/**
 * Suite-scoped FragGate kind table (TOOLBENCH-0.1).
 *
 * Rows are copied from AzielEliab/aziel-runtime src/fraggate/registry.js
 * LIVE_OPS and STUB_OPS for zkattest, mmconsensus, and toolbench.
 * Source commit 116c56c41cb35c9184fc22b30a0e97c1fd9c3ada.
 *
 * classifyCall is the same decision procedure as that file:
 * missing entry → halluc, stub status → stub, named stub op → stub,
 * live op → live, other live-status op → unknown_op, local_only status
 * → local_only. Nothing here forces a pass.
 *
 * Slugs outside this snapshot are not classified as if the full catalog
 * were loaded. live_remote_harness stays SLOT.
 *
 * Author: Aziel Eliab. Identity is Aziel Eliab only.
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from "node:crypto";

export const KIND_TABLE_SOURCE = Object.freeze({
  repo: "https://github.com/AzielEliab/aziel-runtime",
  path: "src/fraggate/registry.js",
  commit: "116c56c41cb35c9184fc22b30a0e97c1fd9c3ada",
  scope: "zkattest, mmconsensus, toolbench",
  full_catalog_loaded: false,
  live_remote_harness: "SLOT",
  note: "Suite-scoped snapshot. Not a third-party lab letter and not the full FragGate catalog.",
});

export const KIND_TO_CODE = Object.freeze({
  live: "FG-OK",
  stub: "FG-STUB",
  halluc: "FG-HALLUC-TOOL",
  unknown_op: "FG-UNKNOWN-OP",
  local_only: "FG-LOCAL-ONLY",
});

export type KindName = keyof typeof KIND_TO_CODE;

/** Callable ops. Copied verbatim from registry.js LIVE_OPS for these three slugs. */
export const LIVE_OPS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  zkattest: Object.freeze(["health", "skill", "doctor", "commit", "attest", "open", "verify", "limitation"]),
  mmconsensus: Object.freeze(["health", "skill", "doctor", "tally", "agree", "limitation"]),
  toolbench: Object.freeze(["health", "skill", "doctor", "suite", "run_case", "limitation"]),
});

/** Named refuses. Copied verbatim from registry.js STUB_OPS for these three slugs. */
export const STUB_OPS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  zkattest: Object.freeze([
    "groth16",
    "snark",
    "stark",
    "plonk",
    "bulletproofs",
    "pairing",
    "trusted_setup",
    "prove",
    "full_zk",
    "zk_snark",
    "reveal_witness",
  ]),
  mmconsensus: Object.freeze([
    "live_model_call",
    "openai",
    "anthropic",
    "grok",
    "blend_models",
    "remote_infer",
    "truth_score",
    "court",
  ]),
  toolbench: Object.freeze(["invent_completeness", "live_remote_harness", "invent_pass", "third_party_lab"]),
});

/** These three slugs have no OP_ALIASES rows in the source registry. */
export const OP_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  zkattest: Object.freeze({}),
  mmconsensus: Object.freeze({}),
  toolbench: Object.freeze({}),
});

export const VENDORED_SLUGS = Object.freeze(Object.keys(LIVE_OPS));

/** Runtime toolbench ops.js forces these names through classifyCall(null). */
export const HALLUC_FIXTURE_SLUGS = Object.freeze(["not-a-real-slug", "qemu-sandbox"]);

export interface RegistryEntry {
  slug: string;
  status: string;
}

export interface ClassifiedCall {
  kind: KindName | null;
  status: string | null;
  op?: string;
  requested?: string;
  aliased?: boolean;
  code: string | null;
  refused?: boolean;
  error?: string;
  honesty?: "REAL" | "SLOT";
  note?: string;
}

export function resolveOpAlias(slug: string, op: string): { requested: string; op: string; aliased: boolean } {
  const requested = String(op || "").trim();
  const mapped = (OP_ALIASES[slug] || {})[requested];
  if (mapped) return { requested, op: mapped, aliased: true };
  return { requested, op: requested, aliased: false };
}

export function codeForKind(kind: string | null | undefined): string | null {
  if (!kind) return null;
  return KIND_TO_CODE[kind as KindName] || null;
}

/**
 * Decision procedure from aziel-runtime registry.js classifyCall.
 * A null entry is FG-HALLUC-TOOL. This function does not consult SUITE_CASES
 * and does not set pass.
 */
export function classifyCall(entry: RegistryEntry | null, op: string): ClassifiedCall {
  const action = String(op || "").trim();
  if (!entry) {
    return { kind: "halluc", status: null, code: KIND_TO_CODE.halluc, honesty: "REAL" };
  }
  if (entry.status === "local_only") {
    if (!action) {
      return { kind: "unknown_op", status: entry.status, code: KIND_TO_CODE.unknown_op, honesty: "REAL" };
    }
    return { kind: "local_only", status: "local_only", code: KIND_TO_CODE.local_only, honesty: "REAL" };
  }
  if (entry.status === "stub") {
    return { kind: "stub", status: "stub", code: KIND_TO_CODE.stub, honesty: "REAL" };
  }
  const stubs = STUB_OPS[entry.slug] || [];
  if (action && stubs.includes(action)) {
    return { kind: "stub", status: "stub", code: KIND_TO_CODE.stub, honesty: "REAL" };
  }
  const resolved = resolveOpAlias(entry.slug, action);
  const live = LIVE_OPS[entry.slug] || [];
  if (entry.status === "live" && action && (live.includes(action) || live.includes(resolved.op))) {
    return {
      kind: "live",
      status: "live",
      op: resolved.op,
      requested: resolved.requested,
      aliased: resolved.aliased,
      code: KIND_TO_CODE.live,
      honesty: "REAL",
    };
  }
  if (entry.status === "live" && action) {
    return { kind: "unknown_op", status: "live", code: KIND_TO_CODE.unknown_op, honesty: "REAL" };
  }
  if (!action) {
    return { kind: "unknown_op", status: entry.status, code: KIND_TO_CODE.unknown_op, honesty: "REAL" };
  }
  return { kind: "local_only", status: "local_only", code: KIND_TO_CODE.local_only, honesty: "REAL" };
}

/**
 * Toolbench's runtime classifySlugOp path, limited to the vendored snapshot.
 * Out-of-snapshot slugs refuse instead of inventing a kind.
 */
export function classifySuiteCall(slug: string, op: string): ClassifiedCall {
  const key = String(slug || "").trim().toLowerCase();
  if (!key || (HALLUC_FIXTURE_SLUGS as readonly string[]).includes(key)) {
    return classifyCall(null, op);
  }
  if (!(VENDORED_SLUGS as readonly string[]).includes(key)) {
    return {
      kind: null,
      status: null,
      code: null,
      refused: true,
      error: "slug outside vendored suite snapshot",
      honesty: "SLOT",
      note: "live_remote_harness is SLOT. This process does not invent a kind for a slug it did not vendor from the FragGate registry.",
    };
  }
  return classifyCall({ slug: key, status: "live" }, op);
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(obj[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Hash of the vendored rows. This is a content digest, not a lab certificate. */
export function kindTableDigest(): string {
  const body = canonicalize({
    live: LIVE_OPS,
    stub: STUB_OPS,
    aliases: OP_ALIASES,
    source: KIND_TABLE_SOURCE.commit,
  });
  return createHash("sha256").update(body).digest("hex");
}
