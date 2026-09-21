# API Doc Generator

Generate factual API documentation from backend source as DOCX.

```text
/api-doc-generator path/to/target
/api-doc-generator path/to/target --format docx
```

The skill reads the bundled specification, inspects source directly, explains behavior for both technical and non-technical readers, writes target-named JSON under the application/repository root's `docs/` directory, validates it, and generates the selected document there.

Technical identifiers remain available as evidence. When useful, request fields can include a plain-language validation rule or business meaning in addition to the source-level details. Technical markers remain available when they are the clearest factual representation; add context when it helps the intended reader.
