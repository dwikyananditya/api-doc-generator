# API Doc Generator

An [Agent Skill](https://agentskills.io) that analyzes a backend endpoint's source (NestJS, Node.js, Go, or .NET) and produces an Indonesian-language DOCX report: request fields, business flow, system and database interactions, error handling, risks, and recommendations.

It works with any agent that supports the `SKILL.md` format. Invoke it by name, or with a slash command where your agent supports one:

```text
/api-doc-generator path/to/target
```

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
