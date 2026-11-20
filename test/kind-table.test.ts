import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HALLUC_FIXTURE_SLUGS,
  KIND_TABLE_SOURCE,
  KIND_TO_CODE,
  LIVE_OPS,
  STUB_OPS,
  classifyCall,
  classifySuiteCall,
  kindTableDigest,
} from "../src/kind-table.js";

describe("vendored FragGate kind table", () => {
  it("copies the three suite rows and does not claim the full catalog", () => {
    assert.equal(KIND_TABLE_SOURCE.full_catalog_loaded, false);
    assert.equal(KIND_TABLE_SOURCE.live_remote_harness, "SLOT");
    assert.equal(KIND_TABLE_SOURCE.commit, "116c56c41cb35c9184fc22b30a0e97c1fd9c3ada");
    assert.deepEqual(LIVE_OPS.zkattest, ["health", "skill", "doctor", "commit", "attest", "open", "verify", "limitation"]);
    assert.deepEqual(STUB_OPS.zkattest, [
      "groth16", "snark", "stark", "plonk", "bulletproofs", "pairing",
      "trusted_setup", "prove", "full_zk", "zk_snark", "reveal_witness",
    ]);
    assert.deepEqual(LIVE_OPS.mmconsensus, ["health", "skill", "doctor", "tally", "agree", "limitation"]);
    assert.deepEqual(STUB_OPS.mmconsensus, [
      "live_model_call", "openai", "anthropic", "grok", "blend_models", "remote_infer", "truth_score", "court",
    ]);
    assert.deepEqual(LIVE_OPS.toolbench, ["health", "skill", "doctor", "suite", "run_case", "limitation"]);
    assert.deepEqual(STUB_OPS.toolbench, ["invent_completeness", "live_remote_harness", "invent_pass", "third_party_lab"]);
    assert.equal("qemu-sandbox" in LIVE_OPS, false);
    assert.equal("not-a-real-slug" in LIVE_OPS, false);
    assert.deepEqual([...HALLUC_FIXTURE_SLUGS], ["not-a-real-slug", "qemu-sandbox"]);
  });

  it("classifies from the table, including a mismatch that cannot be passed", () => {
    assert.equal(classifyCall(null, "health").kind, "halluc");
    assert.equal(classifyCall(null, "health").code, "FG-HALLUC-TOOL");
    assert.equal(classifyCall({ slug: "zkattest", status: "live" }, "groth16").kind, "stub");
    assert.equal(classifyCall({ slug: "zkattest", status: "live" }, "health").kind, "live");
    assert.equal(classifyCall({ slug: "zkattest", status: "live" }, "health").code, KIND_TO_CODE.live);
    assert.equal(classifyCall({ slug: "zkattest", status: "live" }, "not_an_op").kind, "unknown_op");
    assert.equal(classifyCall({ slug: "mmconsensus", status: "live" }, "live_model_call").kind, "stub");
    assert.equal(classifyCall({ slug: "mmconsensus", status: "live" }, "tally").kind, "live");
    assert.equal(classifyCall({ slug: "toolbench", status: "live" }, "invent_completeness").kind, "stub");
    assert.equal(classifyCall({ slug: "toolbench", status: "live" }, "invent_pass").kind, "stub");
    assert.equal(classifyCall({ slug: "toolbench", status: "live" }, "third_party_lab").kind, "stub");
    assert.equal(classifyCall({ slug: "toolbench", status: "live" }, "live_remote_harness").kind, "stub");
    assert.equal(classifyCall({ slug: "toolbench", status: "stub" }, "health").kind, "stub");
    assert.equal(classifyCall({ slug: "qemu-sandbox", status: "local_only" }, "boot").kind, "local_only");
    assert.equal(classifyCall({ slug: "zkattest", status: "live" }, "").kind, "unknown_op");
  });

  it("refuses a slug the snapshot does not vendor instead of inventing a kind", () => {
    const outside = classifySuiteCall("azvpn", "health");
    assert.equal(outside.refused, true);
    assert.equal(outside.kind, null);
    assert.equal(outside.honesty, "SLOT");
    assert.equal(outside.code, null);
    const halluc = classifySuiteCall("qemu-sandbox", "boot");
    assert.equal(halluc.kind, "halluc");
    assert.equal(halluc.code, "FG-HALLUC-TOOL");
    assert.notEqual(halluc.kind, "local_only");
  });

  it("keeps a stable content digest that is not a lab certificate", () => {
    const first = kindTableDigest();
    const second = kindTableDigest();
    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
  });
});
