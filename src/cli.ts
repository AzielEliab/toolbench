#!/usr/bin/env node
/**
 * toolbench CLI. Prints one JSON document. Exit 1 when a case does not pass.
 * Author: Aziel Eliab.
 * SPDX-License-Identifier: Apache-2.0
 */

import { findCase, suiteList } from "./engine.js";
import { runCase, runSuite, runToolbench } from "./ops.js";

function emit(body: unknown, code: number): never {
  process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
  process.exit(code);
}

function help() {
  return {
    ok: true,
    product: "toolbench",
    spec: "TOOLBENCH-0.1",
    version: "0.1.0",
    commands: ["suite", "run", "run <id>", "health", "skill", "doctor", "limitation", "help"],
    examples: [
      "npx tsx src/cli.ts suite",
      "npx tsx src/cli.ts run",
      "npx tsx src/cli.ts run fg-halluc",
      "npx tsx src/cli.ts run zk-stub-groth16",
      "npx tsx src/cli.ts doctor",
    ],
    third_party_lab_status: "SLOT",
    forks: "always allowed",
    license: "Apache-2.0",
  };
}

const [cmd = "help", arg] = process.argv.slice(2);

if (cmd === "help" || cmd === "--help" || cmd === "-h") emit(help(), 0);
if (cmd === "suite") emit(suiteList(), 0);
if (cmd === "health" || cmd === "skill" || cmd === "limitation") {
  emit(await runToolbench(cmd), 0);
}
if (cmd === "doctor") {
  const body = await runToolbench("doctor");
  emit(body, body && typeof body === "object" && "ok" in body && body.ok ? 0 : 1);
}
if (cmd === "run") {
  if (!arg) {
    const body = runSuite();
    emit(body, body.ok ? 0 : 1);
  }
  if (!findCase(arg)) {
    emit(
      {
        ok: false,
        error: "unknown case id",
        id: arg,
        known: suiteList().cases.map((row) => row.id),
        pass: false,
        invents_pass: false,
        third_party_lab_status: "SLOT",
      },
      1,
    );
  }
  const body = runCase({ id: arg });
  emit(body, body.pass ? 0 : 1);
}

emit(
  {
    ok: false,
    error: "unknown command",
    command: cmd,
    hint: "suite | run [id] | health | skill | doctor | limitation",
  },
  1,
);
