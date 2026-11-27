import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { LIMITATION, SUITE_CASES } from "../src/engine.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function runCli(args: string[]) {
  return spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

describe("toolbench CLI", () => {
  it("runs the full suite and exits 0 only when every case passes", () => {
    const result = runCli(["run"]);
    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.count, 8);
    assert.equal(body.passed, 8);
    assert.equal(body.invents_pass, false);
    assert.equal(body.third_party_lab_status, "SLOT");
    assert.equal(body.external_lab, "unverified");
    const ids = body.cases.map((row: { id: string }) => row.id);
    assert.deepEqual(ids, SUITE_CASES.map((row) => row.id));
    for (const row of body.cases) {
      assert.equal(row.pass, row.got_kind === row.expect_kind && row.got_code === row.expect_code);
      assert.equal(row.invents_pass, false);
    }
  });

  it("prints one JSON result for each of the eight case ids", () => {
    for (const row of SUITE_CASES) {
      const result = runCli(["run", row.id]);
      assert.equal(result.status, 0, result.stderr);
      const body = JSON.parse(result.stdout);
      assert.equal(body.id, row.id);
      assert.equal(body.slug, row.slug);
      assert.equal(body.case_op, row.op);
      assert.equal(body.got_kind, row.expect_kind);
      assert.equal(body.got_code, row.expect_code);
      assert.equal(body.pass, true);
      assert.equal(body.third_party_lab_status, "SLOT");
    }
  });

  it("exits 1 for an unknown case and does not report a pass", () => {
    const result = runCli(["run", "not-a-case"]);
    assert.equal(result.status, 1);
    const body = JSON.parse(result.stdout);
    assert.equal(body.ok, false);
    assert.equal(body.pass, false);
    assert.equal(body.invents_pass, false);
    assert.equal(body.known.length, 8);
  });

  it("serves suite, limitation, and a doctor that actually ran the cases", () => {
    const suite = JSON.parse(runCli(["suite"]).stdout);
    assert.equal(suite.count, 8);
    assert.equal(suite.third_party_lab_status, "SLOT");
    const limit = JSON.parse(runCli(["limitation"]).stdout);
    assert.equal(limit.limitation, LIMITATION);
    assert.equal(limit.honesty_labels.third_party_lab, "SLOT");
    const doctor = runCli(["doctor"]);
    assert.equal(doctor.status, 0, doctor.stderr);
    const body = JSON.parse(doctor.stdout);
    assert.equal(body.passed, 8);
    assert.equal(body.failed.length, 0);
    assert.equal(body.mesh_enabled_by_this_process, false);
  });
});
