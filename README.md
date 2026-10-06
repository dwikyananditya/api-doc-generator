# API Doc Generator

An [Agent Skill](https://agentskills.io) that analyzes a backend module's endpoints (NestJS, Node.js, Go, or .NET) and produces a plain-language Indonesian DOCX document for non-technical readers: request payload/DTO, query parameters, response shape, database queries, and table relations.

In a microservice setup, run the agent from the folder that contains all service repositories. When an endpoint calls another service through an env var such as `${SVC_REPO_PROJECT_B}/api/v1/foo`, the skill maps it to the `repo-project-b` folder and documents the DTO, response, and queries from there. How far it follows those calls is set by the analysis depth:

- `single` (default) — **Single Layer**: the target (proxy) plus the one service it calls. Calls from that service onward are listed but not traced.
- `deep` — **Deep Analysis**: every service in the chain is traced recursively down to the last handler, documenting each one's DTOs, responses, queries, and relations.

It works with any agent that supports the `SKILL.md` format. Invoke it by name, or with a slash command where your agent supports one:

```text
/api-doc-generator path/to/target
/api-doc-generator path/to/target --depth deep
```

Asking in plain words ("deep analysis", "analisis mendalam") works too.

Output is written to the application root's `docs/` folder as `<target-name>.json` (the analyzed data) and `<target-name>.docx` (the rendered document).

## Layout

| Path | Purpose |
| --- | --- |
| `skills/api-doc-generator/SKILL.md` | Workflow and rules for the agent |
| `skills/api-doc-generator/spec/API_DOCUMENTATION_SPEC.md` | Content rules for each section |
| `skills/api-doc-generator/spec/example-api-document.json` | Complete valid example |
| `skills/api-doc-generator/spec/DOCX_RENDERING_SPEC.md` | Styling rules for the renderer |
| `skills/api-doc-generator/schema/api-document.schema.json` | JSON structure contract |
| `skills/api-doc-generator/scripts/` | `init`, `validate`, and `generate` scripts |
