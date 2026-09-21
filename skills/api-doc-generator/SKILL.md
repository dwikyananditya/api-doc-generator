---
name: api-doc-generator
description: Generate factual API documentation from a backend source file or folder and render it as DOCX. Use when the user invokes `/api-doc-generator`, asks to document an API endpoint, or wants backend source converted into API documentation.
compatibility: Node.js runtime and local filesystem access. No office suite required.
---

# API doc generator

Generate the requested API documentation from source code for both technical and non-technical readers. Read `spec/API_DOCUMENTATION_SPEC.md` before starting; it is the source of truth for output language, evidence, JSON structure, audience, and document layout.

## Input

```text
/api-doc-generator path/to/target
/api-doc-generator path/to/target --format docx
```

The default format is `docx`. If the target contains multiple endpoints and the user has not specified a scope, ask whether to document one endpoint or all endpoints.

## Workflow

Use the skill directory as `RUNTIME_ROOT`.

1. Read `spec/API_DOCUMENTATION_SPEC.md`.
2. Resolve the source as `TARGET_ROOT` and derive `<target-name>` from its folder name or filename.
3. Resolve `PROJECT_ROOT` as the application/repository root, not the source module folder. Prefer the nearest ancestor containing `.git`; otherwise use the nearest ancestor containing a project manifest such as `package.json`, `go.mod`, `*.csproj`, `*.sln`, or `Cargo.toml`.
4. Run `node scripts/init.mjs` from `RUNTIME_ROOT` when dependencies are missing.
5. Inspect the target source directly and write `<PROJECT_ROOT>/docs/<target-name>.json` according to `schema/api-document.schema.json` and the spec. Do not create the documentation folder inside `src/`, a feature/module folder, or the source target unless that folder is itself the project root.
6. Validate the JSON:

   ```sh
   node scripts/validate.mjs <PROJECT_ROOT>/docs/<target-name>.json
   ```

7. Generate the DOCX document:

   ```sh
   node scripts/generate.mjs <PROJECT_ROOT>/docs/<target-name>.json <PROJECT_ROOT>/docs/<target-name>.docx
   ```

8. Report the source target, project root, JSON path, output path, format, validation result, and unresolved facts.

## Boundaries

- Inspect only source related to the requested endpoint. Perform source inspection directly; no inventory script is required.
- Treat source code as the factual authority.
- Prefer language that readers unfamiliar with NestJS, DTOs, decorators, RxJS, or database terminology can understand. Add business context when it helps; technical details may still be retained.
- Decorators and source identifiers may be included when relevant. When a field or behavior is intended for a general audience, consider adding a short explanation so the code is not the only context.
- When using `notDetected`, consider adding context about the limits of the analyzed source. Do not change facts merely to remove a technical marker.
- Follow an available downstream contract when it is needed to understand a proxy target. If it is unavailable, record the analysis boundary without forcing a conclusion.
- Stop before rendering if JSON validation fails.
- Do not overwrite an existing output without checking the user's intent.
