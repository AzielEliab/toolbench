/**
 * ToolBench in-process ops. Classification is src/kind-table.ts.
 * Author: Aziel Eliab.
 * SPDX-License-Identifier: Apache-2.0
 */

import { classifySuiteCall } from "./kind-table.js";
import {
  AXES,
  AUTHOR,
  LIMITATION,
  LIVE_OPS,
  MOTTO,
  NAME,
  NEIGHBORS,
  PRODUCT,
  PRODUCT_GITHUB,
  ROLE,
  RUNTIME_NEIGHBOR,
  SPEC,
  STUB_REFUSE,
  SUITE_CASES,
  VERSION,
  findCase,
  limitationCite,
  scoreCase,
  suiteList,
} from "./engine.js";

export const TOOLBENCH_OPS = LIVE_OPS.slice();

function envelope() {
  return {
    product: PRODUCT,
    name: NAME,
    version: VERSION,
    spec: SPEC,
    role: ROLE,
    motto: MOTTO,
    axes: AXES,
    neighbors: NEIGHBORS,
    live_ops: LIVE_OPS,
    stub_ops: STUB_REFUSE,
    limitation: LIMITATION,
    author: AUTHOR,
    identity: AUTHOR,
    door: "fraggate",
    true_engine_runtime: true,
    hosted_fraggate_door: false,
    kv_increment: false,
    mesh_enabled_by_this_process: false,
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    external_lab: "unverified" as const,
    github: PRODUCT_GITHUB,
    runtime_neighbor: RUNTIME_NEIGHBOR,
    worker_home: null,
    in_runtime: false,
    standalone: true,
    domain: null,
    placement: "tool-playground",
    kind_table: "vendored-suite-snapshot",
  };
}

export function toolbenchHealth() {
  return {
    ok: true,
    op: "health",
    status: "ok",
    ...envelope(),
  };
}

export function toolbenchSkill() {
  const base = envelope();
  const markdown = `# ${NAME} (${SPEC})

Synthetic FragGate / Sentinel / TDQS refuse playground. ${MOTTO} suite lists cases; run_case classifies one against the vendored kind table. invent_completeness / live_remote_harness stay SLOT. Standalone placement. Cite ${PRODUCT_GITHUB}. Neighbor: ${RUNTIME_NEIGHBOR}.

- CLI: \`npx tsx src/cli.ts run\`
- Library: \`runToolbench("run_case", { id: "fg-halluc" })\`
- Hosted door: FragGate on aziel-runtime. This package does not open a second door.

LIVE_OPS: ${base.live_ops.join(", ")}.

Stubs (refuse): ${base.stub_ops.join(", ")}.

Axes / order: ${base.axes.join(", ")}.
Neighbors: ${base.neighbors.join(", ")}.

Author: Aziel Eliab only.
Limitation: ${LIMITATION}
`;
  return {
    ok: true,
    op: "skill",
    markdown,
    skill: markdown,
    ...base,
  };
}

export function runCase(payload: unknown) {
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const id = body.id != null ? body.id : body.case;
  const row = findCase(id);
  if (!row) {
    return {
      ok: false,
      error: "unknown case id",
      status: 400,
      known: suiteList().cases.map((item) => item.id),
      pass: false,
      invents_pass: false,
      third_party_lab: false,
      third_party_lab_status: "SLOT" as const,
    };
  }
  const classified = classifySuiteCall(row.slug, row.op);
  if (classified.refused || !classified.kind) {
    return {
      ok: false,
      op: "run_case",
      id: row.id,
      error: classified.error || "classification refused",
      honesty: "SLOT",
      pass: false,
      invents_pass: false,
      third_party_lab: false,
      third_party_lab_status: "SLOT" as const,
      note: classified.note || row.note,
    };
  }
  return scoreCase(row, classified.kind);
}

export function runSuite() {
  const cases = SUITE_CASES.map((row) => runCase({ id: row.id }));
  const failed = cases.filter((row) => !row.pass);
  return {
    ok: failed.length === 0,
    op: "suite_run",
    schema: "toolbench.case.v0.1",
    product: PRODUCT,
    spec: SPEC,
    version: VERSION,
    count: cases.length,
    passed: cases.length - failed.length,
    failed: failed.map((row) => ("id" in row ? row.id : null)),
    cases,
    invents_pass: false,
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    external_lab: "unverified" as const,
    author: AUTHOR,
    identity: AUTHOR,
    door: "fraggate",
    note: "Each pass is got kind and code against the case expectation. A failing case stays failed. Third-party lab stays SLOT.",
  };
}

export function toolbenchDoctor() {
  const suite = runSuite();
  return {
    ...envelope(),
    ok: suite.ok,
    op: "doctor",
    doctor: true,
    cases: suite.count,
    passed: suite.passed,
    failed: suite.failed,
    results: suite.cases,
    note: "ToolBench doctor runs the 8 synthetic cases locally against the vendored kind table. Self-test is not a third-party lab. A pass is agreement with that table. FragGate on aziel-runtime stays the hosted door. This response does not enable mesh.",
  };
}

export async function runToolbench(op: string, payload?: unknown) {
  if (op === "health") return toolbenchHealth();
  if (op === "skill") return toolbenchSkill();
  if (op === "doctor") return toolbenchDoctor();
  if (op === "limitation") return limitationCite();
  if (op === "suite") return suiteList();
  if (op === "run_case") return runCase(payload);
  if (op === "suite_run") return runSuite();
  return {
    ok: false,
    unsupported: true,
    op,
    invents_pass: false,
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    note: "Unknown op. invent_pass and third_party_lab stay SLOT.",
  };
}

export { LIMITATION, VERSION };
