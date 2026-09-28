---
name: api-doc-generator
description: Analyze the endpoints in a backend source file or module (NestJS, Node.js, Go, or .NET) and produce a single plain-language Indonesian DOCX document covering, for each endpoint, the request payload/DTO, query parameters, response shape, database queries and table relations. Follows HTTP calls one hop into sibling microservice repositories (e.g. `${SVC_REPO_PROJECT_B}/api/v1/foo`) to find the real DTOs, responses and queries. Use when the user invokes the api-doc-generator skill (e.g. `/api-doc-generator <path>`) or asks for an API documentation document/report of an endpoint from its source code. Not for OpenAPI/Swagger specs, README files, or inline code comments.
compatibility: Node.js plus bun, pnpm, or npm to install the `docx` dependency. No office suite required.
---

# API doc generator

Turn a backend module's source into one API document that a non-technical reader can follow: what to send, what comes back, and which data is read or written. You write a JSON file; the bundled scripts validate it and render the DOCX.

**One path in, one document out.** Whatever the target is (a file, a module, or a folder of many modules), write exactly one `<target-name>.json` and one `<target-name>.docx` containing every endpoint under it. Never ask whether to combine or split, and never produce per-endpoint or per-module files.

**Write for non-technical readers, in Bahasa Indonesia.** Short sentences, everyday words, and the business meaning of every field. Technical identifiers (field, class, table, env var, HTTP method) stay in their original form so engineers can trace them, but always sit next to a plain explanation.

**The document describes what the client of the target service sends and receives.** When the target only forwards a request to another service, the real DTO, response, and queries live in that other service, so they are documented from there.

`RUNTIME_ROOT` is this skill's directory. Run scripts with absolute paths, e.g. `node <RUNTIME_ROOT>/scripts/validate.mjs`.

## References

- `spec/API_DOCUMENTATION_SPEC.md` — content rules for every part of the document and metadata defaults. Read it before writing JSON.
- `spec/example-api-document.json` — a complete, valid document with a forwarded endpoint and a local one. Match its shapes, tone, and level of detail.
- `schema/api-document.schema.json` — the structural contract the validator enforces.
- `spec/DOCX_RENDERING_SPEC.md` — renderer styling only. Do not read it unless changing `scripts/generate.mjs`.

## Workflow

1. **Resolve paths.**
   - `TARGET_ROOT`: the file or folder the user gave.
   - `<target-name>`: the folder name, or the filename without extension.
   - `PROJECT_ROOT`: the nearest ancestor of the target with a project manifest (`package.json`, `go.mod`, `*.csproj`, `*.sln`, `Cargo.toml`) that is inside the git root; fall back to the git root. In a monorepo this is the app folder (e.g. `apps/api`), never `src/` or a feature module.
   - `WORKSPACE_ROOT`: the folder holding all the service repositories — the current working directory when the target's repository is inside it, otherwise the parent folder of the target's git root.
2. **Collect endpoints.** Find every endpoint anywhere under the target, recursively, unless the user named specific ones. Each endpoint is one item in `endpoints`; keep endpoints from the same module/subfolder next to each other. When the same handler is exposed under several routes (e.g. `/capaian/...` and `/web/capaian/...`), write one item and list the other routes in `aliases`.
3. **Check for existing output.** Only the exact files `<PROJECT_ROOT>/docs/<target-name>.json` and `.docx` count. If they exist, ask before overwriting. Other files in `docs/` are not a reason to ask: leave them untouched and list them in the final report as possibly obsolete.
4. **Install dependencies** if `<RUNTIME_ROOT>/node_modules/docx` does not exist: `node <RUNTIME_ROOT>/scripts/init.mjs`.
5. **Analyze the target service.** Start at each route handler and follow what it needs: DTO/validation, service, repository/entity/ORM model or raw SQL, HTTP client, and guards. Skip `node_modules`, build output, generated code, and unrelated modules. Trace shared pieces (guards, HTTP client wrapper, base entities) once and reuse the findings.
6. **Resolve outgoing HTTP calls to repositories.** A call whose base URL comes from an env var or config key — e.g. `${SVC_REPO_PROJECT_B}/api/v1/foo`, `process.env.SVC_REPO_PROJECT_B`, `configService.get('SVC_REPO_PROJECT_B')`, `os.Getenv(...)`, `IConfiguration[...]` — points at another service. Follow the HTTP client wrapper if there is one to find the env var and path.
   - **Map the env var to a folder by name.** Drop affixes such as `SVC_`, `SERVICE_`, `_URL`, `_HOST`, `_BASE_URL`, `_API`; lowercase; turn `_` into `-` (`SVC_REPO_PROJECT_B` → `repo-project-b`). Look for that folder directly under `WORKSPACE_ROOT`, first as an exact match, then as a unique folder whose name contains it.
   - **When there is no match or several matches**, collect every unresolved env var and ask the user once, in a single question, which folder each maps to. If the user says the repo is not available, document the call from the caller's side only.
   - Do not read `.env`, helm, k8s, terraform, or CI files to resolve names.
7. **Analyze the called service — one hop only.** In the mapped repository, find the handler for the called method and path, accounting for global prefixes, controller prefixes, and API versioning. From it, document the request DTO and validation, the response shape, the database queries, and the table relations, exactly as in step 5.
   - **Do not follow that service's own outgoing calls.** If repo B calls repo C, list the call in `downstream` with `handler` set to `-` and move on. Still resolve C's name with the same folder mapping (a folder lookup only, no code opened); if no folder matches, use the env var name exactly as written. Never make up a service name.
   - Tag every query and relation with the service that owns it.
   - **Request fields come from what the target service accepts.** If the target passes the body or query through untouched, use the called service's DTO and say so in `request.dto`.
   - **The response is what the target service returns.** If it returns the called service's response as-is, use that shape. If it reshapes the data, document the final shape.
8. **Write** `<PROJECT_ROOT>/docs/<target-name>.json` following the spec and example. Fill metadata with the defaults in the spec, and list every service involved in `services`.
9. **Validate:**

   ```sh
   node <RUNTIME_ROOT>/scripts/validate.mjs <PROJECT_ROOT>/docs/<target-name>.json
   ```

   If it fails, fix the JSON and validate again. Do not render invalid JSON.
10. **Render:**

    ```sh
    node <RUNTIME_ROOT>/scripts/generate.mjs <PROJECT_ROOT>/docs/<target-name>.json <PROJECT_ROOT>/docs/<target-name>.docx
    ```

    Confirm the DOCX exists and is not empty.
11. **Report** in chat: the target, the project root, the services traced (with each env var → folder mapping), the JSON and DOCX paths, the validation result, and any facts that could not be determined from source.

## Rules

- **The document states facts about the API, never about the analysis.** Do not write how a mapping was decided, which repos or files were not opened or traced, which env values or `.env` files were not checked, or side observations such as bugs and inconsistencies. Put anything the user needs to know about the analysis in the final report (step 11) instead.
- Service names are always the real repository folder names. Never derive a name from an env var when a matching folder exists.
- Source code is the only source of facts. Never infer authentication, status codes, validation rules, table names, or relations without evidence in source. `handler`, `request.dto`, and `downstream[].handler` carry the file and symbol so engineers can check.
- Write field types in everyday words (`Teks`, `Angka`, `Ya/Tidak`, `Tanggal dan jam`, `Daftar`), adding the format when it matters (`Teks (UUID)`, `Angka bulat, 1 sampai 100`).
- Every request and response field explains what it means for the user or the business process, not just its type.
- Relations come from entity/model definitions (`@ManyToOne`, `belongsTo`, GORM tags, EF navigation properties), migrations, or explicit joins in queries. A cross-service link through an ID stored without a foreign key is a relation too: mark it as `Referensi lewat API/ID, tanpa foreign key`.
- When a required value has no evidence in source, state the plain fact about the API (e.g. `Tidak perlu login` when no guard applies), never `null`, a made-up value, or a remark about the analysis. Use an empty array when a list genuinely has no entries.
- If the target contains no HTTP endpoint, or a route cannot be traced to a handler, stop and tell the user what was found instead of producing a partial document.
