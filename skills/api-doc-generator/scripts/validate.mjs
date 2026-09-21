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

errors.push(
  ...missing(document, ["metadata", "endpoint", "sections"], "document"),
);

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

errors.push(
  ...missing(
    document.endpoint,
    ["method", "url", "controller", "serviceMethod"],
    "endpoint",
  ),
);

const sections = document.sections ?? {};
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

errors.push(...missing(sections, sectionNames, "sections"));

errors.push(
  ...missing(
    sections.overview,
    ["controller", "routePrefix", "endpoints", "requestFields"],
    "sections.overview",
  ),
);

errors.push(
  ...missing(
    sections.businessProcess,
    ["steps", "failureBehavior"],
    "sections.businessProcess",
  ),
);

errors.push(
  ...missing(
    sections.systemInteraction,
    ["services", "sequence", "communication"],
    "sections.systemInteraction",
  ),
);
errors.push(
  ...missing(sections.database, ["read", "write"], "sections.database"),
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
    "sections.errorHandling",
  ),
);

errors.push(
  ...missing(
    sections.response,
    ["success", "fields", "errors", "clientGuidance"],
    "sections.response",
  ),
);

if (
  !Array.isArray(sections.businessProcess?.steps) ||
  sections.businessProcess.steps.length === 0
)
  errors.push("sections.businessProcess.steps must contain at least one item");
if (
  !Array.isArray(sections.recommendations) ||
  sections.recommendations.length === 0
)
  errors.push("sections.recommendations must contain at least one item");

const endpointSummaries = sections.overview?.endpoints ?? [];
endpointSummaries.forEach((item, index) =>
  errors.push(
    ...missing(
      item,
      ["method", "path", "handler", "queryDto"],
      `sections.overview.endpoints[${index}]`,
    ),
  ),
);

const risks = sections.risks ?? [];
risks.forEach((item, index) =>
  errors.push(
    ...missing(
      item,
      ["severity", "scenario", "trigger", "businessImpact"],
      `sections.risks[${index}]`,
    ),
  ),
);

const recommendations = sections.recommendations ?? [];
recommendations.forEach((item, index) =>
  errors.push(
    ...missing(
      item,
      ["priority", "title", "problem", "solution"],
      `sections.recommendations[${index}]`,
    ),
  ),
);

if (errors.length) {
  console.error(`Validation failed for ${input}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${input}.`);
