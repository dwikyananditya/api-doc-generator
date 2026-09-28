# DOCX Rendering Specification

> Untuk maintainer `scripts/generate.mjs`. Model yang menulis JSON tidak perlu membaca file ini.

## Warna

| Token      | Hex                 | Pemakaian                  |
| ---------- | ------------------- | -------------------------- |
| `darkBg`   | `1A1A2E`            | code block                 |
| `blue`     | `185FA5`            | H2, garis H1, URL endpoint |
| `darkBlue` | `2C3E50`            | H1, H3, table header       |
| `bodyText` | `1A1A2E`            | body                       |
| `muted`    | `666666`            | teks "tidak ada", cover    |
| `rowOdd`   | `F2F4F6`            | zebra table                |
| `info`     | `185FA5` / `E6F1FB` | callout catatan            |

## Typography

| Element      | Font        | Size | Style                          |
| ------------ | ----------- | ---- | ------------------------------ |
| H1           | Arial       | 32   | bold, dark blue, bottom border |
| H2           | Arial       | 26   | bold, blue                     |
| H3           | Arial       | 22   | bold, dark blue                |
| Body         | Arial       | 22   | normal                         |
| Table header | Arial       | 20   | bold, white on dark blue       |
| Table cell   | Arial       | 20   | normal                         |
| Inline code  | Courier New | 20   | `C7254E` on `F9F2F4`           |
| Code block   | Courier New | 19   | dark background                |

## Page setup

Use US Letter explicitly in both Word sections:

```js
const page = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};
```

## Implementation rules

1. Use `WidthType.DXA`, never percentage widths.
2. Use `ShadingType.CLEAR`, never solid shading.
3. Use numbering (`LevelFormat.DECIMAL` for `flow`, restarted per endpoint via `instance`), never hardcoded list characters.
4. Use `tabStops` for header and footer alignment, never tables there.
5. Gunakan page break hanya bila perpindahan konten memang memerlukannya; jangan memaksa setiap section ke halaman baru.
6. Use separate paragraphs instead of `\n` inside `TextRun`.
7. Make `columnWidths` sum exactly to the table width.
8. Set `width` on every `TableCell` as well as its table column.
9. Set page size explicitly; `docx` defaults are not US Letter.
10. Set `cantSplit` on body rows so a row never breaks across pages.
11. Every table column has an Indonesian title for non-technical readers; empty lists render a sentence instead of an empty table.
12. Validate the generated DOCX after rendering.
