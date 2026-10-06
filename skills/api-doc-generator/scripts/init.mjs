import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const managers = [
  ["bun", ["bun.lock", "bun.lockb"]],
  ["pnpm", ["pnpm-lock.yaml"]],
  ["npm", ["package-lock.json"]],
];
const installed = ([manager]) =>
  spawnSync(manager, ["--version"], { stdio: "ignore" }).status === 0;
const available = managers.filter(installed);

// Prefer the manager matching the lockfile, but only if it is installed.
const selected =
  available.find(([_, locks]) =>
    locks.some((lock) => existsSync(`${root}/${lock}`)),
  )?.[0] ?? available[0]?.[0];

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
