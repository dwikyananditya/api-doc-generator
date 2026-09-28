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
  muted: "666666",
  white: "FFFFFF",
  rowOdd: "F2F4F6",
  border: "CCCCCC",
  code: "98D8A0",
  infoBorder: "185FA5",
  infoBg: "E6F1FB",
};
const W = 9360;

const page = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};

const line = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const borders = { top: line, bottom: line, left: line, right: line };
const none = { style: BorderStyle.NONE, size: 0, color: C.white };

const run = (value, options = {}) =>
  new TextRun({ text: String(value), font: "Arial", size: 22, color: C.bodyText, ...options });

const paragraph = (value, options = {}) =>
  new Paragraph({ children: [run(value, options)], spacing: { before: 60, after: 60 } });

const heading = (value, level, pageBreakBefore = false) =>
  new Paragraph({
    pageBreakBefore,
    heading: level,
    children: [
      run(value, {
        bold: true,
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22,
        color: level === HeadingLevel.HEADING_2 ? C.blue : C.darkBlue,
      }),
    ],
    border:
      level === HeadingLevel.HEADING_1
        ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue, space: 4 } }
        : undefined,
    spacing: { before: level === HeadingLevel.HEADING_3 ? 160 : 280, after: 120 },
  });

const listItem = (value, reference, instance) =>
  new Paragraph({
    numbering: { reference, level: 0, instance },
    children: [run(value)],
    spacing: { before: 40, after: 40 },
  });

const cell = (value, width, { header = false, odd = false } = {}) =>
  new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.TOP,
    shading: { type: ShadingType.CLEAR, fill: header ? C.darkBlue : odd ? C.rowOdd : C.white },
    children: String(value ?? "-")
      .split("\n")
      .map(
        (text) =>
          new Paragraph({
            children: [run(text, { size: 20, bold: header, color: header ? C.white : C.bodyText })],
          }),
      ),
  });

// columns: [[title, width, (row) => value], ...]; widths must sum to W.
const table = (columns, rows) =>
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: columns.map(([, width]) => width),
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map(([title, width]) => cell(title, width, { header: true })),
      }),
      ...rows.map(
        (row, index) =>
          new TableRow({
            cantSplit: true,
            children: columns.map(([, width, get]) => cell(get(row), width, { odd: index % 2 === 1 })),
          }),
      ),
    ],
  });

const keyValueTable = (pairs) =>
  table(
    [
      ["Keterangan", 2600, ([key]) => key],
      ["Isi", 6760, ([, value]) => value],
    ],
    pairs.filter(([, value]) => value !== undefined && value !== ""),
  );

const tableOrEmpty = (columns, rows, emptyText) =>
  rows?.length ? table(columns, rows) : paragraph(emptyText, { italics: true, color: C.muted });

const codeBlock = (value) =>
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            borders: { top: none, bottom: none, left: none, right: none },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            shading: { type: ShadingType.CLEAR, fill: C.darkBg },
            children: (typeof value === "string" ? value : JSON.stringify(value, null, 2))
              .split("\n")
              .map(
                (text) =>
                  new Paragraph({
                    children: [new TextRun({ text, font: "Courier New", size: 19, color: C.code })],
                    spacing: { before: 20, after: 20 },
                  }),
              ),
          }),
        ],
      }),
    ],
  });

const callout = (value) =>
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            borders: {
              top: none,
              bottom: none,
              right: none,
              left: { style: BorderStyle.SINGLE, size: 24, color: C.infoBorder },
            },
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            shading: { type: ShadingType.CLEAR, fill: C.infoBg },
            children: [paragraph(value)],
          }),
        ],
      }),
    ],
  });

const spacer = () => new Paragraph({ children: [], spacing: { before: 60, after: 60 } });

const fieldColumns = [
  ["Field", 1800, (row) => row.name],
  ["Nama mudah", 1800, (row) => row.label],
  ["Jenis isi", 1400, (row) => row.type],
  ["Wajib?", 1100, (row) => (row.required ? "Wajib" : "Opsional")],
  ["Keterangan", 3260, (row) => row.description],
];

const route = (endpoint) => `${endpoint.method} ${endpoint.url}`;

const renderEndpoint = (endpoint, index) => {
  const { request, database, response } = endpoint;
  const number = index + 1;
  const hasExample = (value) => value !== null && value !== undefined && value !== "";

  return [
    heading(`${number}. ${endpoint.title}`, HeadingLevel.HEADING_1, index > 0),
    paragraph(route(endpoint), { font: "Courier New", bold: true, color: C.blue }),

    heading(`${number}.1 Ringkasan`, HeadingLevel.HEADING_2),
    paragraph(endpoint.summary),
    keyValueTable([
      ["Method", endpoint.method],
      ["URL", endpoint.url],
      ["URL lain (alias)", endpoint.aliases?.join("\n")],
      ["Perlu login?", endpoint.auth],
      ["Lokasi kode", endpoint.handler],
    ]),

    heading(`${number}.2 Alur singkat`, HeadingLevel.HEADING_2),
    ...endpoint.flow.map((step) => listItem(step, "steps", number)),

    heading(`${number}.3 Data yang dikirim`, HeadingLevel.HEADING_2),
    keyValueTable([
      ["Format data", request.contentType],
      ["Definisi (DTO)", request.dto],
    ]),
    heading("Parameter di URL (path)", HeadingLevel.HEADING_3),
    tableOrEmpty(fieldColumns, request.pathParams, "Tidak ada parameter di path URL."),
    heading("Parameter query (?nama=nilai)", HeadingLevel.HEADING_3),
    tableOrEmpty(fieldColumns, request.queryParams, "Tidak ada parameter query."),
    heading("Isi body (payload)", HeadingLevel.HEADING_3),
    tableOrEmpty(fieldColumns, request.body, "Endpoint ini tidak menerima body."),
    ...(hasExample(request.example)
      ? [heading("Contoh request", HeadingLevel.HEADING_3), codeBlock(request.example)]
      : []),

    heading(`${number}.4 Service lain yang dipanggil`, HeadingLevel.HEADING_2),
    tableOrEmpty(
      [
        ["Service", 1600, (row) => row.service],
        ["Panggilan", 2600, (row) => row.call],
        ["Tujuan", 2600, (row) => row.purpose],
        ["Kode di service tujuan", 2560, (row) => row.handler],
      ],
      endpoint.downstream,
      "Endpoint ini tidak memanggil service lain.",
    ),

    heading(`${number}.5 Data di database`, HeadingLevel.HEADING_2),
    heading("Query yang dijalankan", HeadingLevel.HEADING_3),
    tableOrEmpty(
      [
        ["Service", 1500, (row) => row.service],
        ["Tabel", 1600, (row) => row.table],
        ["Operasi", 1000, (row) => row.operation],
        ["Kondisi / filter", 2400, (row) => row.filter],
        ["Tujuan", 2860, (row) => row.purpose],
      ],
      database.queries,
      "Endpoint ini tidak mengakses database secara langsung.",
    ),
    heading("Relasi antar tabel", HeadingLevel.HEADING_3),
    tableOrEmpty(
      [
        ["Dari", 2200, (row) => row.from],
        ["Ke", 2200, (row) => row.to],
        ["Jenis relasi", 1700, (row) => row.kind],
        ["Artinya", 3260, (row) => row.meaning],
      ],
      database.relations,
      "Tidak ada relasi tabel yang dipakai endpoint ini.",
    ),

    heading(`${number}.6 Bentuk response`, HeadingLevel.HEADING_2),
    paragraph(`Jika berhasil, sistem membalas dengan status ${response.status}.`),
    ...(hasExample(response.example)
      ? [heading("Contoh response sukses", HeadingLevel.HEADING_3), codeBlock(response.example)]
      : []),
    heading("Penjelasan field response", HeadingLevel.HEADING_3),
    tableOrEmpty(
      [
        ["Field", 2600, (row) => row.name],
        ["Jenis isi", 1600, (row) => row.type],
        ["Arti", 5160, (row) => row.description],
      ],
      response.fields,
      "Response tidak berisi data.",
    ),
    heading("Kemungkinan gagal", HeadingLevel.HEADING_3),
    tableOrEmpty(
      [
        ["Status", 1000, (row) => row.status],
        ["Kapan terjadi", 4360, (row) => row.condition],
        ["Pesan", 4000, (row) => row.message],
      ],
      response.errors,
      "Tidak ditemukan respons gagal yang ditangani secara eksplisit di source.",
    ),

    ...(endpoint.notes?.length
      ? [
          heading(`${number}.7 Catatan`, HeadingLevel.HEADING_2),
          ...endpoint.notes.flatMap((note) => [callout(note), spacer()]),
        ]
      : []),
  ];
};

const endpoints = data.endpoints;
const service = data.metadata.service;
const documentName = data.metadata.documentName;

const cover = [
  new Paragraph({
    children: [run("API DOCUMENTATION", { bold: true, size: 56, color: C.darkBlue })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 900, after: 240 },
  }),
  new Paragraph({
    children: [run(service, { bold: true, size: 36, color: C.blue })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [run(documentName, { size: 28, color: C.muted })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 500 },
  }),
  keyValueTable([
    ["Nama dokumen", documentName],
    ["Service", service],
    ["Versi", data.metadata.version],
    ["Tanggal", data.metadata.date],
    ["Penulis", data.metadata.author],
    ["Status", data.metadata.status],
    ["Klasifikasi", data.metadata.classification],
  ]),
  heading("Service yang terlibat", HeadingLevel.HEADING_3),
  table(
    [
      ["Service", 1900, (row) => row.name],
      ["Repository", 1900, (row) => row.repo],
      ["Dipanggil lewat", 2700, (row) => row.envVar || "-"],
      ["Peran", 2860, (row) => row.role],
    ],
    data.services,
  ),
  heading("Daftar endpoint", HeadingLevel.HEADING_3),
  table(
    [
      ["No", 600, (row) => row.no],
      ["Method", 1000, (row) => row.method],
      ["URL", 4160, (row) => row.url],
      ["Fungsi", 3600, (row) => row.title],
    ],
    endpoints.map((endpoint, index) => ({ ...endpoint, no: index + 1 })),
  ),
  new Paragraph({
    children: [run("CONFIDENTIAL — Internal Engineering Use Only", { italics: true, size: 18, color: C.muted })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
  }),
];

const header = new Header({
  children: [
    new Paragraph({
      children: [
        run(`API Documentation  •  ${service}`, { size: 18, color: C.muted }),
        run("\t"),
        run(documentName, { size: 18, color: C.blue }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue, space: 4 } },
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      children: [
        run(`Confidential  •  ${service}`, { size: 18, color: "888888" }),
        run("\t"),
        run("Page ", { size: 18, color: "888888" }),
        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "888888" }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
    }),
  ],
});

const document = new Document({
  numbering: {
    config: [
      {
        reference: "steps",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: C.bodyText } } },
  },
  sections: [
    { properties: { page }, children: cover },
    {
      properties: { page },
      headers: { default: header },
      footers: { default: footer },
      children: endpoints.flatMap(renderEndpoint),
    },
  ],
});

writeFileSync(output, await Packer.toBuffer(document));

console.log(`Rendered ${output}.`);
