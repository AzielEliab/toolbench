/**
 * ToolBench — synthetic FragGate / Sentinel / TDQS refuse playground.
 *
 * REAL: the eight named cases classify against the vendored FragGate kind
 * table. pass is got_kind === expect_kind and got_code === expect_code.
 * Honesty: invent_completeness / live remote harness / third-party lab stay SLOT.
 *
 * Author: Aziel Eliab. Identity is Aziel Eliab only.
 * SPDX-License-Identifier: Apache-2.0
 */

import { KIND_TO_CODE, codeForKind, kindTableDigest, KIND_TABLE_SOURCE } from "./kind-table.js";

export const PRODUCT = "toolbench";
export const NAME = "ToolBench";
export const VERSION = "0.1.0";
export const ENGINE_VERSION = VERSION;
export const SPEC = "TOOLBENCH-0.1";
export const AUTHOR = "Aziel Eliab";
export const MOTTO = "Synthetic refuse packs. Self-test ≠ third-party lab.";
export const ROLE = "automated tool-use benchmarking playground (FragGate door)";
export const SCHEMA = "toolbench.case.v0.1";
export const PRODUCT_GITHUB = "https://github.com/AzielEliab/toolbench";
export const RUNTIME_NEIGHBOR = "https://github.com/AzielEliab/aziel-runtime";

export const AXES = Object.freeze(["case", "kind", "code", "pass"]);
export const NEIGHBORS = Object.freeze(["zkattest", "mmconsensus", "decisiongate"]);

export const STUB_REFUSE = Object.freeze([
  "invent_completeness",
  "live_remote_harness",
  "invent_pass",
  "third_party_lab",
]);

export const LIMITATION =
  "THIS IS: a standalone synthetic tool-use playground (TOOLBENCH-0.1) for FragGate refuse packs (Sentinel / TDQS / FG-HALLUC-TOOL / FG-STUB). suite lists 8 cases; run_case classifies one against a vendored snapshot of the FragGate kind rows for zkattest, mmconsensus, and toolbench, copied from AzielEliab/aziel-runtime src/fraggate/registry.js. Honesty: REAL classification of those 8 cases. invent_completeness / live remote harness / third-party lab / invent-a-pass stay SLOT. Self-test is not a third-party lab. This repository is not the hosted FragGate door. Author: Aziel Eliab only.";

export const LIVE_OPS = Object.freeze(["health", "skill", "doctor", "suite", "run_case", "limitation"]);

export { KIND_TO_CODE };

export interface SuiteCase {
  id: string;
  slug: string;
  op: string;
  expect_kind: string;
  expect_code: string;
  note: string;
}

export const SUITE_CASES: readonly SuiteCase[] = Object.freeze([
  {
    id: "fg-halluc",
    slug: "not-a-real-slug",
    op: "health",
    expect_kind: "halluc",
    expect_code: "FG-HALLUC-TOOL",
    note: "Unknown registry name refuses FG-HALLUC-TOOL.",
  },
  {
    id: "zk-stub-groth16",
    slug: "zkattest",
    op: "groth16",
    expect_kind: "stub",
    expect_code: "FG-STUB",
    note: "Full ZK proving stays SLOT / FG-STUB.",
  },
  {
    id: "zk-health",
    slug: "zkattest",
    op: "health",
    expect_kind: "live",
    expect_code: "FG-OK",
    note: "zkattest health is a live door op.",
  },
  {
    id: "zk-unknown",
    slug: "zkattest",
    op: "not_an_op",
    expect_kind: "unknown_op",
    expect_code: "FG-UNKNOWN-OP",
    note: "Live slug, unknown op.",
  },
  {
    id: "mm-stub-live-model",
    slug: "mmconsensus",
    op: "live_model_call",
    expect_kind: "stub",
    expect_code: "FG-STUB",
    note: "Live multi-model calls stay SLOT.",
  },
  {
    id: "mm-tally",
    slug: "mmconsensus",
    op: "tally",
    expect_kind: "live",
    expect_code: "FG-OK",
    note: "Posted-opinion tally is live.",
  },
  {
    id: "tb-stub-fielded",
    slug: "toolbench",
    op: "invent_completeness",
    expect_kind: "stub",
    expect_code: "FG-STUB",
    note: "invent_completeness is not invented.",
  },
  {
    id: "guest-vm-halluc",
    slug: "qemu-sandbox",
    op: "boot",
    expect_kind: "halluc",
    expect_code: "FG-HALLUC-TOOL",
    note: "No QEMU / KVM guest slug exists.",
  },
]);

export function suiteList() {
  return {
    ok: true,
    op: "suite",
    schema: SCHEMA,
    product: PRODUCT,
    spec: SPEC,
    version: VERSION,
    count: SUITE_CASES.length,
    cases: SUITE_CASES.map((row) => ({ ...row })),
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    external_lab: "unverified" as const,
    kind_table_sha256: kindTableDigest(),
    kind_table_sha256_is_lab_certificate: false,
    kind_table_source: KIND_TABLE_SOURCE,
    note: "Synthetic cases only. Self-test is not a third-party lab. The digest covers the vendored kind rows, not an external letter.",
    author: AUTHOR,
    identity: AUTHOR,
    door: "fraggate",
  };
}

export function findCase(id: unknown): SuiteCase | null {
  const key = String(id || "").trim();
  return SUITE_CASES.find((row) => row.id === key) || null;
}

export function scoreCase(row: SuiteCase, kind: string | null | undefined) {
  const got_kind = String(kind || "");
  const got_code = codeForKind(got_kind);
  const pass = got_kind === row.expect_kind && got_code === row.expect_code;
  return {
    ok: true,
    op: "run_case",
    schema: SCHEMA,
    id: row.id,
    slug: row.slug,
    case_op: row.op,
    expect_kind: row.expect_kind,
    expect_code: row.expect_code,
    got_kind,
    got_code,
    pass,
    invents_pass: false,
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    external_lab: "unverified" as const,
    note: row.note,
    author: AUTHOR,
    identity: AUTHOR,
    door: "fraggate",
  };
}

export function limitationCite() {
  return {
    ok: true,
    op: "limitation",
    product: PRODUCT,
    spec: SPEC,
    version: VERSION,
    limitation: LIMITATION,
    live_ops: LIVE_OPS.slice(),
    stub_ops: STUB_REFUSE.slice(),
    honesty_labels: {
      suite: "REAL",
      run_case: "REAL",
      invent_completeness: "SLOT",
      live_remote_harness: "SLOT",
      invent_pass: "SLOT",
      third_party_lab: "SLOT",
    },
    third_party_lab: false,
    third_party_lab_status: "SLOT" as const,
    external_lab: "unverified" as const,
    out_of_scope: STUB_REFUSE.slice(),
    author: AUTHOR,
    identity: AUTHOR,
    door: "fraggate",
  };
}
