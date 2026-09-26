# DOCX Rendering Specification

> Untuk maintainer `scripts/generate.mjs`. Model yang menulis JSON tidak perlu membaca file ini.

## Warna

| Token      | Hex                 | Pemakaian            |
| ---------- | ------------------- | -------------------- |
| `darkBg`   | `1A1A2E`            | code block           |
| `blue`     | `185FA5`            | H2, border, info     |
| `darkBlue` | `2C3E50`            | H1, H3, table header |
| `bodyText` | `1A1A2E`            | body                 |
| `rowOdd`   | `F2F4F6`            | zebra table          |
| `red`      | `A32D2D` / `FCEBEB` | critical             |
| `amber`    | `BA7517` / `FAEEDA` | medium risk          |
| `green`    | `3B6D11` / `EAF3DE` | correct behavior     |
| `info`     | `185FA5` / `E6F1FB` | information          |
| `purple`   | `534AB7` / `EEEDFE` | recommendation       |

## Typography

| Element      | Font        | Size | Style                          |
| ------------ | ----------- | ---- | ------------------------------ |
| H1           | Arial       | 32   | bold, dark blue, bottom border |
| H2           | Arial       | 28   | bold, blue                     |
| H3           | Arial       | 24   | bold, dark blue                |
| Body         | Arial       | 22   | normal                         |
| Table header | Arial       | 20   | bold, white on dark blue       |
| Table cell   | Arial       | 20   | normal                         |
| Inline code  | Courier New | 20   | `C7254E` on `F9F2F4`           |
| Code block   | Courier New | 19   | dark background                |
| Badge        | Arial       | 18   | bold                           |

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
3. Use numbering with `LevelFormat.BULLET`, never hardcoded bullet characters.
4. Use `tabStops` for header and footer alignment, never tables there.
5. Gunakan page break hanya bila perpindahan konten memang memerlukannya; jangan memaksa setiap section ke halaman baru.
6. Use separate paragraphs instead of `\n` inside `TextRun`.
7. Make `columnWidths` sum exactly to the table width.
8. Set `width` on every `TableCell` as well as its table column.
9. Set page size explicitly; `docx` defaults are not US Letter.
10. Validate the generated DOCX after rendering.
