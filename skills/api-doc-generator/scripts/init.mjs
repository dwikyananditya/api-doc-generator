import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const managers = [
  ["bun", "bun.lockb"],
  ["pnpm", "pnpm-lock.yaml"],
  ["npm", "package-lock.json"],
];

const selected =
  managers.find(([_, lock]) => existsSync(`${root}/${lock}`))?.[0] ??
  managers.find(([manager]) =>
    spawnSync("which", [manager], { stdio: "ignore" }),
  )?.[0];

if (!selected)
  throw new Error(
    "Install bun, pnpm, or npm before initializing api-doc-generator.",
  );
const result = spawnSync(selected, ["install"], {
  cwd: root,
  stdio: "inherit",
});

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Initialized with ${selected}.`);
