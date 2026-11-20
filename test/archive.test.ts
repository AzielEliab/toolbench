import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { describe, it } from "node:test";
import { gunzipSync } from "node:zlib";

const ARCHIVE = new URL("../workers/download-tracker/public/toolbench-0.1.0.tar.gz", import.meta.url);
const SCRIPT = new URL("../workers/download-tracker/scripts/pack-archive.mjs", import.meta.url);

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("reproducible archive", () => {
  it("packs toolbench-0.1.0.tar.gz twice to the same bytes", () => {
    execFileSync(process.execPath, [SCRIPT.pathname], { stdio: "inherit" });
    const first = readFileSync(ARCHIVE);
    execFileSync(process.execPath, [SCRIPT.pathname], { stdio: "inherit" });
    const second = readFileSync(ARCHIVE);
    assert.ok(statSync(ARCHIVE).size > 1000);
    assert.equal(sha256(first), sha256(second));
    assert.equal(first[0], 0x1f);
    assert.equal(first[1], 0x8b);
    const listing = execFileSync("tar", ["-tzf", ARCHIVE.pathname], { encoding: "utf8" });
    assert.match(listing, /toolbench-0\.1\.0\/package\.json/);
    assert.match(listing, /toolbench-0\.1\.0\/src\/cli\.ts/);
    assert.match(listing, /toolbench-0\.1\.0\/src\/kind-table\.ts/);
    assert.match(listing, /toolbench-0\.1\.0\/LICENSE/);
    assert.doesNotMatch(listing, /node_modules/);
    assert.doesNotMatch(listing, /toolbench-0\.1\.0\.tar\.gz/);
    const packed = execFileSync("tar", ["-xOzf", ARCHIVE.pathname, "toolbench-0.1.0/package.json"], { encoding: "utf8" });
    assert.equal(JSON.parse(packed).version, "0.1.0");
    assert.equal(JSON.parse(packed).license, "Apache-2.0");
    const raw = gunzipSync(first);
    assert.ok(raw.byteLength > first.byteLength);
  });
});
