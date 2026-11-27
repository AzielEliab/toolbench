import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const out = resolve(root, "workers/download-tracker/public/toolbench-0.1.0.tar.gz");

execFileSync(
  "tar",
  [
    "--sort=name",
    "--mtime=2026-11-20 00:00:00",
    "--owner=0",
    "--group=0",
    "--numeric-owner",
    "--use-compress-program",
    "gzip -n",
    "-cf",
    out,
    "--exclude=.git",
    "--exclude=node_modules",
    "--exclude=dist",
    "--exclude=.wrangler",
    "--exclude=toolbench-0.1.0.tar.gz",
    "--transform",
    "s,^\\./,toolbench-0.1.0/,",
    "-C",
    root,
    ".",
  ],
  { stdio: "inherit", env: { ...process.env, SOURCE_DATE_EPOCH: "1763596800" } },
);

console.log(out);
