import { readFileSync } from "node:fs";

const input = process.argv[2] ?? "docs/api-document.json";
const document = JSON.parse(readFileSync(input, "utf8"));
const schema = JSON.parse(
  readFileSync(new URL("../schema/api-document.schema.json", import.meta.url), "utf8"),
);

// Supports only the keywords used in schema/api-document.schema.json.
const typeOf = (value) =>
  value === null
    ? "null"
    : Array.isArray(value)
      ? "array"
      : Number.isInteger(value)
        ? "integer"
        : typeof value;

const errors = [];

const check = (node, value, path) => {
  if (node.$ref) node = schema.$defs[node.$ref.split("/").pop()];

  const types = [node.type].flat().filter(Boolean);
  if (types.length && !types.includes(typeOf(value))) {
    errors.push(`${path} must be ${types.join(" or ")}`);
    return;
  }
  if (node.enum && !node.enum.includes(value))
    errors.push(`${path} must be one of: ${node.enum.join(", ")}`);
  if (node.minLength && typeof value === "string" && value.trim().length < node.minLength)
    errors.push(`${path} must not be empty`);

  if (Array.isArray(value)) {
    if (node.minItems && value.length < node.minItems)
      errors.push(`${path} must contain at least ${node.minItems} item(s)`);
    if (node.items)
      value.forEach((item, index) => check(node.items, item, `${path}[${index}]`));
  }

  if (typeOf(value) === "object") {
    for (const key of node.required ?? [])
      if (!(key in value)) errors.push(`${path}.${key} is required`);
    for (const [key, item] of Object.entries(value)) {
      if (node.properties?.[key]) check(node.properties[key], item, `${path}.${key}`);
      else if (node.additionalProperties === false)
        errors.push(`${path}.${key} is not allowed`);
    }
  }
};

check(schema, document, "document");

if (errors.length) {
  console.error(`Validation failed for ${input}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validated ${input}.`);
