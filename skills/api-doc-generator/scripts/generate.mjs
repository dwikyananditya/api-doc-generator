import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, basename } from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  Header,
  Footer,
  PageNumber,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  TabStopType,
  TabStopPosition,
  LevelFormat,
} from "docx";

const input = process.argv[2] ?? "docs/api-document.json";
const output =
  process.argv[3] ?? `${dirname(input)}/${basename(input, extname(input))}.docx`;
const data = JSON.parse(readFileSync(input, "utf8"));
mkdirSync(dirname(output), { recursive: true });

const C = {
  darkBg: "1A1A2E",
  blue: "185FA5",
  darkBlue: "2C3E50",
  bodyText: "1A1A2E",
  white: "FFFFFF",
  rowOdd: "F2F4F6",
  border: "CCCCCC",
  redBorder: "A32D2D",
  redBg: "FCEBEB",
  amberBorder: "BA7517",
  amberBg: "FAEEDA",
  greenBorder: "3B6D11",
  greenBg: "EAF3DE",
  infoBorder: "185FA5",
  infoBg: "E6F1FB",
  purpleBorder: "534AB7",
  purpleBg: "EEEDFE",
  codeKey: "5BBFFF",
  codeStr: "98D8A0",
  codeNum: "FAC775",
  codeBool: "C4B5FD",
  codeComment: "888888",
};
const W = 9360;

const page = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: C.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: C.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: C.border },
};

const text = (value) =>
  typeof value === "string" ? value : JSON.stringify(value, null, 2);

const labels = {
  metadata: "Metadata",
  endpoint: "Endpoint",
  overview: "Ringkasan endpoint",
  businessProcess: "Alur bisnis",
  systemInteraction: "Interaksi sistem",
  database: "Operasi database",
  externalApis: "Integrasi API eksternal",
  errorHandling: "Penanganan error",
  risks: "Analisis risiko",
  recommendations: "Rekomendasi perbaikan",
  response: "Struktur respons",
  controller: "Controller",
  routePrefix: "Prefix rute",
  endpoints: "Daftar endpoint",
  requestFields: "Field request",
  steps: "Langkah proses",
  failureBehavior: "Perilaku saat gagal",
  services: "Layanan",
  sequence: "Urutan komunikasi",
  communication: "Komunikasi",
  read: "Operasi baca",
  write: "Operasi tulis",
  businessRuleValidation: "Validasi aturan bisnis",
  fallbackValues: "Nilai fallback",
  generalPropagation: "Propagasi error umum",
  unhandled: "Belum ditangani",
  clientGuidance: "Panduan client",
  sourceEvidence: "Bukti sumber",
  method: "Method",
  path: "Path",
  handler: "Handler",
  queryDto: "DTO query",
  field: "Field",
  type: "Tipe",
  required: "Wajib",
  validation: "Validasi",
  source: "Sumber",
  execution: "Urutan eksekusi",
  purpose: "Tujuan",
  scenario: "Skenario",
  trigger: "Pemicu",
  businessImpact: "Dampak bisnis",
  severity: "Severity",
  priority: "Prioritas",
  title: "Judul",
  problem: "Masalah",
  solution: "Solusi",
  success: "Respons sukses",
  fields: "Field respons",
  errors: "Respons error",
  auth: "Autentikasi",
  contentType: "Content-Type",
  successStatus: "Status sukses",
  functionName: "Nama function",
  serviceMethod: "Method service",
  documentName: "Nama dokumen",
  version: "Versi",
  date: "Tanggal",
  author: "Author",
  status: "Status",
  classification: "Klasifikasi",
  query: "Parameter query",
  url: "URL",
  aliases: "Route lain",
};

const label = (value) =>
  labels[String(value)] ??
  String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

const scalar = (value) =>
  value === null || value === undefined
    ? "notDetected"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

const paragraph = (value, size = 22, color = C.bodyText) =>
  new Paragraph({
    children: [
      new TextRun({ text: scalar(value), font: "Arial", size, color }),
    ],
    spacing: { before: 60, after: 60 },
  });

const heading = (value, level = HeadingLevel.HEADING_2, pageBreakBefore = false) =>
  new Paragraph({
    pageBreakBefore,
    children: [
      new TextRun({
        text: value,
        bold: true,
        font: "Arial",
        size:
          level === HeadingLevel.HEADING_1
            ? 28
            : level === HeadingLevel.HEADING_2
              ? 24
              : 22,
        color: level === HeadingLevel.HEADING_1 ? C.blue : C.darkBlue,
      }),
    ],
    heading: level,
    spacing: { before: 200, after: 120 },
  });

const bullet = (value) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [
      new TextRun({
        text: scalar(value),
        font: "Arial",
        size: 22,
        color: C.bodyText,
      }),
    ],
    spacing: { before: 40, after: 40 },
  });


const cell = (value, header = false, odd = false) =>
  new TableCell({
    borders,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    width: { size: header ? 3000 : 6360, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    shading: {
      type: ShadingType.CLEAR,
      fill: header ? C.darkBlue : odd ? C.rowOdd : C.white,
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: scalar(value),
            font: "Arial",
            size: 20,
            bold: header,
            color: header ? C.white : C.bodyText,
          }),
        ],
      }),
    ],
  });
const propertyTable = (rows) =>
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [
      new TableRow({ children: [cell("Field", true), cell("Detail", true)] }),
      ...rows.map(
        ([key, value], index) =>
          new TableRow({
            children: [
              cell(key, false, index % 2 === 1),
              cell(value, false, index % 2 === 1),
            ],
          }),
      ),
    ],
  });
const arrayTable = (rows) => {
  const keys = [
    ...new Set(
      rows.flatMap((row) =>
        typeof row === "object" && row ? Object.keys(row) : [],
      ),
    ),
  ];
  if (!keys.length) return rows.map(bullet);
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: keys.map(() => Math.floor(W / keys.length)),
    rows: [
      new TableRow({
        children: keys.map(
          (key) =>
            new TableCell({
              borders,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              shading: { type: ShadingType.CLEAR, fill: C.darkBlue },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: label(key),
                      bold: true,
                      font: "Arial",
                      size: 20,
                      color: C.white,
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
      ...rows.map(
        (row, index) =>
          new TableRow({
            children: keys.map(
              (key) =>
                new TableCell({
                  borders,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  shading: {
                    type: ShadingType.CLEAR,
                    fill: index % 2 ? C.rowOdd : C.white,
                  },
                  children: [paragraph(row?.[key] ?? "notDetected", 20)],
                }),
            ),
          }),
      ),
    ],
  });
};

const codeBlock = (value) =>
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: C.darkBg },
              bottom: { style: BorderStyle.NONE, size: 0, color: C.darkBg },
              left: { style: BorderStyle.NONE, size: 0, color: C.darkBg },
              right: { style: BorderStyle.NONE, size: 0, color: C.darkBg },
            },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            shading: { type: ShadingType.CLEAR, fill: C.darkBg },
            children: text(value)
              .split("\n")
              .map(
                (line) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: line,
                        font: "Courier New",
                        size: 19,
                        color: C.codeStr,
                      }),
                    ],
                    spacing: { before: 20, after: 20 },
                  }),
              ),
          }),
        ],
      }),
    ],
  });


const renderValue = (key, value) => {
  if (value === null || value === undefined)
    return [paragraph(`${label(key)}: notDetected`)];
  if (
    key.toLowerCase().includes("json") ||
    key.toLowerCase().includes("example")
  )
    return [heading(label(key), HeadingLevel.HEADING_3), codeBlock(value)];

  if (Array.isArray(value))
    return [
      heading(label(key), HeadingLevel.HEADING_3),
      ...(value.length && typeof value[0] === "object"
        ? [arrayTable(value)]
        : value.map((item) => bullet(item))),
    ];
  if (typeof value === "object")
    return [
      heading(label(key), HeadingLevel.HEADING_3),
      propertyTable(
        Object.entries(value).map(([childKey, childValue]) => [
          label(childKey),
          scalar(childValue),
        ]),
      ),
    ];
  return [paragraph(`${label(key)}: ${scalar(value)}`)];
};

const renderSection = (title, value) => {
  const body = !Array.isArray(value)
    ? Object.entries(value ?? {}).flatMap(([key, item]) =>
        renderValue(key, item),
      )
    : value.length
      ? [arrayTable(value)].flat()
      : [paragraph("Tidak ada.")];
  return [heading(title, HeadingLevel.HEADING_2), ...body];
};

const entries = data.endpoints ?? [];
const service = data.metadata?.service ?? "API";
const documentName = data.metadata?.documentName ?? service;
const coverRows = Object.entries(data.metadata ?? {}).map(([key, value]) => [
  label(key),
  scalar(value),
]);
const routeOf = (endpoint) => `${endpoint?.method ?? ""} ${endpoint?.url ?? ""}`;

const cover = [
  new Paragraph({
    children: [
      new TextRun({
        text: "API DOCUMENTATION",
        bold: true,
        font: "Arial",
        size: 56,
        color: C.darkBlue,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 900, after: 240 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: service,
        bold: true,
        font: "Arial",
        size: 36,
        color: C.blue,
      }),
    ],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: documentName,
        font: "Arial",
        size: 28,
        color: "666666",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 500 },
  }),
  propertyTable(coverRows),
  heading(labels.endpoints, HeadingLevel.HEADING_3),
  arrayTable(
    entries.map(({ endpoint }, index) => ({
      no: String(index + 1),
      method: endpoint?.method,
      url: endpoint?.url,
      functionName: endpoint?.functionName ?? endpoint?.serviceMethod,
    })),
  ),
  new Paragraph({
    children: [
      new TextRun({
        text: "CONFIDENTIAL — Internal Engineering Use Only",
        italics: true,
        font: "Arial",
        size: 18,
        color: "666666",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
  }),
];

const content = entries.flatMap(({ endpoint = {}, sections = {} }, index) => [
  heading(`${index + 1}. ${routeOf(endpoint)}`, HeadingLevel.HEADING_1, index > 0),
  propertyTable(
    Object.entries(endpoint).map(([key, value]) => [
      label(key),
      Array.isArray(value) ? value.join(", ") : scalar(value),
    ]),
  ),
  ...Object.entries(sections).flatMap(([key, value]) =>
    renderSection(label(key), value),
  ),
]);

const header = new Header({
  children: [
    new Paragraph({
      children: [
        new TextRun({
          text: `API Documentation  •  ${service}`,
          font: "Arial",
          size: 18,
          color: "666666",
        }),
        new TextRun({ text: "\t" }),
        new TextRun({
          text: documentName,
          font: "Arial",
          size: 18,
          color: C.blue,
        }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue, space: 4 },
      },
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      children: [
        new TextRun({
          text: `Confidential  •  ${service}`,
          font: "Arial",
          size: 18,
          color: "888888",
        }),
        new TextRun({ text: "\t" }),
        new TextRun({
          text: "Page ",
          font: "Arial",
          size: 18,
          color: "888888",
        }),
        new TextRun({
          children: [PageNumber.CURRENT],
          font: "Arial",
          size: 18,
          color: "888888",
        }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 },
      },
    }),
  ],
});

const document = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: C.bodyText } },
      },
    },
    sections: [
      { properties: { page }, children: cover },
      {
        properties: { page },
        headers: { default: header },
        footers: { default: footer },
        children: content,
      },
    ],
  });

writeFileSync(output, await Packer.toBuffer(document));

console.log(`Rendered ${output}.`);
