---
name: api-doc-generator
description: Analyze a backend endpoint's source (NestJS, Node.js, Go, or .NET) and produce an Indonesian-language DOCX report covering request fields, business flow, system and database interactions, error handling, risks, and improvement recommendations. Use when the user invokes the api-doc-generator skill (e.g. `/api-doc-generator <path>`) or asks for an API documentation document/report of an endpoint from its source code. Not for OpenAPI/Swagger specs, README files, or inline code comments.
compatibility: Node.js plus bun, pnpm, or npm to install the `docx` dependency. No office suite required.
---

# API doc generator

Turn one backend endpoint's source into a factual API document for technical and non-technical readers. You write a JSON file; the bundled scripts validate it and render the DOCX.

**All text values in the JSON must be written in Bahasa Indonesia.** Keep technical identifiers (class, method, field, env var, HTTP method) in their original form and explain them in plain language.

`RUNTIME_ROOT` is this skill's directory. Run scripts with absolute paths, e.g. `node <RUNTIME_ROOT>/scripts/validate.mjs`.

## References

- `spec/API_DOCUMENTATION_SPEC.md` — content rules for every section, severity levels, metadata defaults. Read it before writing JSON.
- `spec/example-api-document.json` — a complete, valid document. Match its shapes and level of detail.
- `schema/api-document.schema.json` — the structural contract the validator enforces.
- `spec/DOCX_RENDERING_SPEC.md` — renderer styling only. Do not read it unless changing `scripts/generate.mjs`.

## Workflow

1. **Resolve paths.**
   - `TARGET_ROOT`: the file or folder the user gave.
   - `<target-name>`: the folder name, or the filename without extension.
   - `PROJECT_ROOT`: the nearest ancestor of the target with a project manifest (`package.json`, `go.mod`, `*.csproj`, `*.sln`, `Cargo.toml`) that is inside the git root; fall back to the git root. In a monorepo this is the app folder (e.g. `apps/api`), never `src/` or a feature module.
2. **Choose scope.** Find the endpoints in the target. If there is exactly one, document it. If there are several and the user did not name one, ask which one, or whether to document all of them. Each JSON file holds exactly one endpoint; for "all", write one file per endpoint named `<target-name>-<handler>`.
3. **Check for existing output.** If `<PROJECT_ROOT>/docs/<target-name>.json` or `.docx` already exists, ask before overwriting.
4. **Install dependencies** if `<RUNTIME_ROOT>/node_modules/docx` does not exist: `node <RUNTIME_ROOT>/scripts/init.mjs`.
5. **Analyze the source — inside `PROJECT_ROOT` only.** Start at the route handler and follow the direct imports it needs: service, DTO, repository/entity, HTTP client, and the guards/pipes/interceptors applied to it. Skip `node_modules`, build output, generated code, and unrelated modules.
   - **Do not open other repositories**, even sibling checkouts of the downstream services. A downstream HTTP call is documented from the caller's side: URL, method, parameters sent, fields read from the response, and what happens on failure. Note in the document that the downstream's internals were not analyzed.
   - **Do not read deployment or infrastructure config** (helm, k8s, terraform, CI, `.env` files). If behavior depends on an env var (e.g. a guard toggled by `USE_GUARDS`), document the condition as written in code.
   - Only go beyond these limits if the user explicitly asks.
   - For several endpoints in one module, trace the shared pieces (guards, interceptors, error types, HTTP client) once and reuse them for every endpoint's document.
6. **Write** `<PROJECT_ROOT>/docs/<target-name>.json` following the spec and example. Fill metadata with the defaults in the spec.
7. **Validate:**

   ```sh
   node <RUNTIME_ROOT>/scripts/validate.mjs <PROJECT_ROOT>/docs/<target-name>.json
   ```

   If it fails, fix the JSON and validate again. Do not render invalid JSON.
8. **Render:**

   ```sh
   node <RUNTIME_ROOT>/scripts/generate.mjs <PROJECT_ROOT>/docs/<target-name>.json <PROJECT_ROOT>/docs/<target-name>.docx
   ```

   Confirm the DOCX exists and is not empty.
9. **Report** the target, project root, JSON and DOCX paths, validation result, and any facts that could not be determined from source.

## Rules

- Source code is the only source of facts. Never infer authentication, status codes, transactions, retries, or constraints without evidence in source; cite the file and symbol.
- Keep implemented behavior (Sections 1–6), risks (Section 7), and recommendations (Section 8) separate. Missing error handling is a risk, not an error-handling entry.
- Every request field gets a plain-language name, type, whether it is required, its fill rule, and its business meaning, with the source reference kept in `source`.
- Every section explains what the behavior means for the user or the business process, not just which classes are called.
- When a required value cannot be found, write a factual sentence (e.g. `Tidak ditemukan pengecekan autentikasi di source yang dianalisis`), never `null` or a made-up value. Use an empty array when a list genuinely has no entries.
- Do not pad recommendations or risks to reach a count. One well-supported item beats five generic ones.
- If the target contains no HTTP endpoint, or the route cannot be traced to a handler, stop and tell the user what was found instead of producing a partial document.
