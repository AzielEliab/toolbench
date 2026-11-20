import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SUITE_CASES, findCase, limitationCite, scoreCase, suiteList } from "../src/engine.js";
import { classifySuiteCall } from "../src/kind-table.js";
import { runCase, runSuite, runToolbench, toolbenchDoctor, toolbenchHealth } from "../src/ops.js";

const CONTRACT = [
  { id: "fg-halluc", slug: "not-a-real-slug", op: "health", expect_kind: "halluc", expect_code: "FG-HALLUC-TOOL" },
  { id: "zk-stub-groth16", slug: "zkattest", op: "groth16", expect_kind: "stub", expect_code: "FG-STUB" },
  { id: "zk-health", slug: "zkattest", op: "health", expect_kind: "live", expect_code: "FG-OK" },
  { id: "zk-unknown", slug: "zkattest", op: "not_an_op", expect_kind: "unknown_op", expect_code: "FG-UNKNOWN-OP" },
  { id: "mm-stub-live-model", slug: "mmconsensus", op: "live_model_call", expect_kind: "stub", expect_code: "FG-STUB" },
  { id: "mm-tally", slug: "mmconsensus", op: "tally", expect_kind: "live", expect_code: "FG-OK" },
  { id: "tb-stub-fielded", slug: "toolbench", op: "invent_completeness", expect_kind: "stub", expect_code: "FG-STUB" },
  { id: "guest-vm-halluc", slug: "qemu-sandbox", op: "boot", expect_kind: "halluc", expect_code: "FG-HALLUC-TOOL" },
];

describe("TOOLBENCH-0.1 suite", () => {
  it("lists the eight contract cases and no extra ones", () => {
    assert.equal(SUITE_CASES.length, 8);
    assert.deepEqual(SUITE_CASES.map((row) => row.id), CONTRACT.map((row) => row.id));
    const listed = suiteList();
    assert.equal(listed.count, 8);
    assert.equal(listed.third_party_lab, false);
    assert.equal(listed.third_party_lab_status, "SLOT");
    assert.equal(listed.external_lab, "unverified");
    assert.equal(listed.kind_table_sha256_is_lab_certificate, false);
    for (const expected of CONTRACT) {
      const row = findCase(expected.id);
      assert.ok(row);
      assert.equal(row.slug, expected.slug);
      assert.equal(row.op, expected.op);
      assert.equal(row.expect_kind, expected.expect_kind);
      assert.equal(row.expect_code, expected.expect_code);
    }
  });

  it("runs every case through classifySuiteCall and scores without forcing pass", () => {
    for (const expected of CONTRACT) {
      const row = findCase(expected.id);
      assert.ok(row);
      const classified = classifySuiteCall(row.slug, row.op);
      assert.equal(classified.refused, undefined);
      assert.equal(classified.honesty, "REAL");
      const result = runCase({ id: expected.id, pass: true, invents_pass: true, third_party_lab: true });
      assert.equal(result.ok, true);
      assert.equal(result.got_kind, classified.kind);
      assert.equal(result.got_code, classified.code);
      assert.equal(result.got_kind, expected.expect_kind);
      assert.equal(result.got_code, expected.expect_code);
      assert.equal(result.pass, result.got_kind === result.expect_kind && result.got_code === result.expect_code);
      assert.equal(result.pass, true);
      assert.equal(result.invents_pass, false);
      assert.equal(result.third_party_lab, false);
      assert.equal(result.third_party_lab_status, "SLOT");
    }
  });

  it("fails a case when the observed kind disagrees with the expectation", () => {
    const row = findCase("zk-health");
    assert.ok(row);
    const scored = scoreCase(row, "halluc");
    assert.equal(scored.got_kind, "halluc");
    assert.equal(scored.got_code, "FG-HALLUC-TOOL");
    assert.equal(scored.pass, false);
    assert.equal(scored.invents_pass, false);
    const empty = scoreCase(row, "");
    assert.equal(empty.pass, false);
    assert.equal(empty.got_code, null);
  });

  it("does not invent a result for an unknown id", () => {
    const missing = runCase({ id: "invented-pass", pass: true });
    assert.equal(missing.ok, false);
    assert.equal(missing.pass, false);
    assert.equal(missing.invents_pass, false);
    assert.equal(missing.third_party_lab_status, "SLOT");
    assert.equal(missing.known?.length, 8);
  });

  it("reports suite and doctor from the same eight classifications", async () => {
    const suite = runSuite();
    assert.equal(suite.count, 8);
    assert.equal(suite.passed, 8);
    assert.equal(suite.failed.length, 0);
    assert.equal(suite.ok, true);
    assert.equal(suite.invents_pass, false);
    assert.equal(suite.third_party_lab_status, "SLOT");
    assert.equal(suite.external_lab, "unverified");
    const doctor = toolbenchDoctor();
    assert.equal(doctor.ok, true);
    assert.equal(doctor.passed, 8);
    assert.equal(doctor.cases, 8);
    assert.equal(doctor.mesh_enabled_by_this_process, false);
    assert.equal(doctor.hosted_fraggate_door, false);
    assert.equal(doctor.third_party_lab_status, "SLOT");
    const viaOp = await runToolbench("run_case", { case: "fg-halluc" });
    assert.equal(viaOp.got_kind, "halluc");
    assert.equal(viaOp.pass, true);
  });

  it("keeps health, skill, and limitation on the REAL versus SLOT labels", async () => {
    const health = toolbenchHealth();
    assert.equal(health.ok, true);
    assert.equal(health.version, "0.1.0");
    assert.equal(health.spec, "TOOLBENCH-0.1");
    assert.equal(health.placement, "tool-playground");
    assert.equal(health.in_runtime, false);
    assert.equal(health.standalone, true);
    assert.equal(health.kv_increment, false);
    const limit = limitationCite();
    assert.equal(limit.honesty_labels.suite, "REAL");
    assert.equal(limit.honesty_labels.run_case, "REAL");
    assert.equal(limit.honesty_labels.invent_completeness, "SLOT");
    assert.equal(limit.honesty_labels.live_remote_harness, "SLOT");
    assert.equal(limit.honesty_labels.invent_pass, "SLOT");
    assert.equal(limit.honesty_labels.third_party_lab, "SLOT");
    assert.equal(limit.third_party_lab, false);
    assert.equal(limit.external_lab, "unverified");
    const skill = await runToolbench("skill");
    assert.match(skill.markdown, /TOOLBENCH-0\.1/);
    assert.match(skill.markdown, /SLOT/);
    const unsupported = await runToolbench("third_party_lab");
    assert.equal(unsupported.ok, false);
    assert.equal(unsupported.unsupported, true);
    assert.equal(unsupported.invents_pass, false);
  });
});
