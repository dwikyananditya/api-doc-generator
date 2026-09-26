import { readFileSync } from "node:fs";

const input = process.argv[2] ?? "docs/api-document.json";
const document = JSON.parse(readFileSync(input, "utf8"));

const missing = (object, fields, prefix) =>
  fields
    .filter(
      (field) => object?.[field] === undefined || object?.[field] === null,
    )
    .map((field) => `${prefix}.${field}`);

const errors = [];

errors.push(...missing(document, ["metadata", "endpoints"], "document"));

errors.push(
  ...missing(
    document.metadata,
    [
      "documentName",
      "service",
      "version",
      "date",
      "author",
      "status",
      "classification",
    ],
    "metadata",
  ),
);

if (!Array.isArray(document.endpoints) || document.endpoints.length === 0)
  errors.push("document.endpoints must contain at least one item");

const validateEntry = (entry, prefix) => {
  errors.push(...missing(entry, ["endpoint", "sections"], prefix));

  errors.push(
    ...missing(
      entry.endpoint,
      ["method", "url", "controller", "serviceMethod"],
      `${prefix}.endpoint`,
    ),
  );

  const sections = entry.sections ?? {};
  const sectionNames = [
    "overview",
    "businessProcess",
    "systemInteraction",
    "database",
    "externalApis",
    "errorHandling",
    "risks",
    "recommendations",
    "response",
  ];

  errors.push(...missing(sections, sectionNames, `${prefix}.sections`));

  errors.push(
    ...missing(
      sections.overview,
      ["controller", "routePrefix", "endpoints", "requestFields"],
      `${prefix}.sections.overview`,
    ),
  );

  errors.push(
    ...missing(
      sections.businessProcess,
      ["steps", "failureBehavior"],
      `${prefix}.sections.businessProcess`,
    ),
  );

  errors.push(
    ...missing(
      sections.systemInteraction,
      ["services", "sequence", "communication"],
      `${prefix}.sections.systemInteraction`,
    ),
  );
  errors.push(
    ...missing(sections.database, ["read", "write"], `${prefix}.sections.database`),
  );

  errors.push(
    ...missing(
      sections.errorHandling,
      [
        "businessRuleValidation",
        "fallbackValues",
        "generalPropagation",
        "unhandled",
      ],
      `${prefix}.sections.errorHandling`,
    ),
  );

  errors.push(
    ...missing(
      sections.response,
      ["success", "fields", "errors", "clientGuidance"],
      `${prefix}.sections.response`,
    ),
  );

  if (
    !Array.isArray(sections.businessProcess?.steps) ||
    sections.businessProcess.steps.length === 0
  )
    errors.push(
      `${prefix}.sections.businessProcess.steps must contain at least one item`,
    );
  if (
    !Array.isArray(sections.recommendations) ||
    sections.recommendations.length === 0
  )
    errors.push(`${prefix}.sections.recommendations must contain at least one item`);

  const endpointSummaries = sections.overview?.endpoints ?? [];
  endpointSummaries.forEach((item, index) =>
    errors.push(
      ...missing(
        item,
        ["method", "path", "handler", "queryDto"],
        `${prefix}.sections.overview.endpoints[${index}]`,
      ),
    ),
  );

  const risks = sections.risks ?? [];
  risks.forEach((item, index) =>
    errors.push(
      ...missing(
        item,
        ["severity", "scenario", "trigger", "businessImpact"],
        `${prefix}.sections.risks[${index}]`,
      ),
    ),
  );

  const recommendations = sections.recommendations ?? [];
  recommendations.forEach((item, index) =>
    errors.push(
      ...missing(
        item,
        ["priority", "title", "problem", "solution"],
        `${prefix}.sections.recommendations[${index}]`,
      ),
    ),
  );
};

(document.endpoints ?? []).forEach((entry, index) =>
  validateEntry(entry, `endpoints[${index}]`),
);

if (errors.length) {
  console.error(`Validation failed for ${input}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${input}.`);
