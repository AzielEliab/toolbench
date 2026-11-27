import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { gunzipSync } from "node:zlib";
import { LIMITATION, SUITE_CASES } from "../src/engine.js";
import { THEME } from "../workers/download-tracker/src/home.js";
import { TRACKER, handleRequest } from "../workers/download-tracker/src/index.js";
import { RUNTIME_TEXT } from "../workers/download-tracker/src/runtime.js";
import { BOT_SCORE_THRESHOLD, classifyRequest } from "../workers/download-tracker/src/classify.js";
import { displayRemainder, invariantHolds } from "../workers/download-tracker/src/stats-shape.js";

const ARCHIVE_NAME = "toolbench-0.1.0.tar.gz";

function memoryKv(seed: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    store,
    async get(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key: string, value: string) {
      store.set(key, String(value));
    },
    async list() {
      return {
        keys: [...store.keys()].map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

function diskAssets() {
  return {
    async fetch(request: Request) {
      const url = new URL(request.url);
      const name = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const file = new URL("../workers/download-tracker/public/" + name, import.meta.url);
      if (name.includes("..") || !existsSync(file)) {
        return new Response("missing", { status: 404 });
      }
      const buf = readFileSync(file);
      return new Response(buf, {
        status: 200,
        headers: { "content-length": String(buf.byteLength) },
      });
    },
  };
}

function makeEnv(fetchImpl?: typeof fetch, seed?: Record<string, string>) {
  const env: Record<string, unknown> = {
    DOWNLOADS: memoryKv(seed),
    ASSETS: diskAssets(),
    AZIEL_RUNTIME_ORIGIN: "https://aziel-runtime.example",
  };
  if (fetchImpl) env.AZIEL_RUNTIME = { fetch: fetchImpl };
  return env;
}

async function call(
  path: string,
  init: RequestInit = {},
  env: Record<string, unknown> = makeEnv(),
  cf?: Record<string, unknown>,
) {
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", "Mozilla/5.0");
  const req = new Request("http://127.0.0.1" + path, { ...init, headers });
  if (cf) Object.defineProperty(req, "cf", { value: cf });
  const previous = globalThis.fetch;
  globalThis.fetch = (async () => new Response("[]", { status: 200 })) as typeof fetch;
  try {
    return await handleRequest(req, env);
  } finally {
    globalThis.fetch = previous;
  }
}

function contrast(hexA: string, hexB: string) {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const rgb = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("download tracker", () => {
  it("serves the real 0.1.0 archive on /download and /go and counts once per GET", async () => {
    assert.equal(TRACKER.project, "toolbench");
    assert.equal(TRACKER.version, "0.1.0");
    assert.equal(TRACKER.asset, ARCHIVE_NAME);
    const file = readFileSync(new URL("../workers/download-tracker/public/" + ARCHIVE_NAME, import.meta.url));
    const env = makeEnv();
    const res = await call("/download", {}, env);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") || "", /gzip/);
    assert.match(res.headers.get("content-disposition") || "", /toolbench-0\.1\.0\.tar\.gz/);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.equal(res.headers.get("x-toolbench-asset"), ARCHIVE_NAME);
    const bytes = new Uint8Array(await res.arrayBuffer());
    assert.equal(sha256(bytes), sha256(file));
    assert.equal(bytes[0], 0x1f);
    assert.equal(bytes[1], 0x8b);
    const raw = gunzipSync(bytes);
    assert.ok(raw.byteLength > 100);

    const pathHit = await call("/download/" + ARCHIVE_NAME, {}, env);
    assert.equal(pathHit.status, 200);
    const again = await call("/download?branch=dev", {}, env);
    assert.equal(again.status, 200);
    const fork = await call("/download?owner=Other&repo=toolbench&branch=main", {}, env);
    assert.equal(fork.status, 200);
    const go = await call("/go", {}, env);
    assert.equal(go.status, 200);
    assert.equal(sha256(new Uint8Array(await go.arrayBuffer())), sha256(file));

    const count = await call("/count", {}, env);
    const body = await count.json();
    assert.equal(body.project, "toolbench");
    assert.equal(body.downloads, 5);
    assert.equal(body.total, 5);
    assert.equal(body.downloads, body.downloads_human + body.downloads_bot);
    assert.equal(invariantHolds(body), true);

    const statsRes = await call("/stats", {}, env);
    const stats = await statsRes.json();
    assert.equal(stats.project, "toolbench");
    assert.equal(stats.total, stats.downloads);
    assert.equal(stats.by_branch.main, 4);
    assert.equal(stats.by_branch.dev, 1);
    assert.equal(stats.by_fork["0"], 4);
    assert.equal(stats.by_fork["1"], 1);
    assert.equal(stats.by_repo["AzielEliab/toolbench"], 4);
    assert.equal(stats.by_repo["Other/toolbench"], 1);
    assert.equal(stats.breakdown.length, 3);
    assert.equal(stats.classification.method, "ua_denylist + healthcheck_ua");
    assert.equal(stats.classification.bot_score_threshold, 30);
    assert.match(stats.classification.note, /strategy \(b\)/);
    assert.match(stats.classification.legacy, /views_bot = views - views_human/);
    assert.equal(typeof stats.github.stars, "number");
    assert.equal(typeof stats.github.forks, "number");
    assert.equal(typeof stats.github.watchers, "number");
    assert.equal(typeof stats.github.release_download_count, "number");
    assert.equal(typeof stats.github.fetched_at, "number");
    assert.equal(stats.note, TRACKER.note);
    assert.equal(stats.views, stats.views_human + stats.views_bot);
    assert.deepEqual(stats.human, { views: stats.views_human, downloads: stats.downloads_human });
    assert.deepEqual(stats.bot, { views: stats.views_bot, downloads: stats.downloads_bot });
  });

  it("does not count a missing asset, a HEAD, stats, count, or a page view as a download", async () => {
    const env = makeEnv();
    const missing = await call("/download?asset=toolbench-9.9.9.tar.gz", {}, env);
    assert.equal(missing.status, 404);
    const missingBody = await missing.json();
    assert.equal(missingBody.error, "asset not hosted");
    assert.equal(missingBody.hosted, ARCHIVE_NAME);
    const head = await call("/download", { method: "HEAD" }, env);
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-type"), "application/gzip");
    assert.equal(await head.text(), "");
    await call("/stats", {}, env);
    await call("/count", {}, env);
    const home = await call("/", {}, env);
    assert.equal(home.status, 200);
    const count = await call("/count", {}, env);
    const body = await count.json();
    assert.equal(body.downloads, 0);
    assert.equal(body.views, 1);
    assert.equal(body.views, body.views_human + body.views_bot);
    assert.equal(body.views_human, 1);
    assert.equal(body.views_bot, 0);
  });

  it("keeps the human/bot remainder invariant for empty UA, denylist, health checks, and bot score", async () => {
    assert.equal(BOT_SCORE_THRESHOLD, 30);
    const env = makeEnv();
    await call("/download", { headers: { "user-agent": "" } }, env);
    await call("/download", { headers: { "user-agent": "curl/8.0" } }, env);
    await call("/download", { headers: { "user-agent": "UptimeRobot/1.0" } }, env);
    await call("/", { headers: { "user-agent": "Mozilla/5.0" } }, env);
    const low = await call("/download", { headers: { "user-agent": "Mozilla/5.0" } }, env, {
      botManagement: { score: 30, verifiedBot: false },
    });
    assert.equal(low.status, 200);
    await call("/download", { headers: { "user-agent": "Mozilla/5.0" } }, env, {
      botManagement: { score: 31, verifiedBot: true },
    });
    await call("/download", { headers: { "user-agent": "Mozilla/5.0" } }, env, {
      botManagement: { score: 0, verifiedBot: false },
    });
    const count = await call("/count", {}, env);
    const body = await count.json();
    assert.equal(body.downloads, 6);
    assert.equal(body.downloads_human, 1);
    assert.equal(body.downloads_bot, 5);
    assert.equal(body.views, 1);
    assert.equal(body.views_human, 1);
    assert.equal(body.views_bot, 0);
    assert.equal(invariantHolds(body), true);
    assert.equal(body.classification.method, "ua_denylist + healthcheck_ua");
    const scored = await call("/stats", { headers: { "user-agent": "Mozilla/5.0" } }, env, {
      botManagement: { score: 90, verifiedBot: false },
    });
    const stats = await scored.json();
    assert.equal(stats.classification.method, "cf.botManagement.score + ua_denylist + healthcheck_ua");
    assert.equal(stats.classification.bot_score_threshold, 30);
    assert.equal(stats.downloads, stats.downloads_human + stats.downloads_bot);
  });

  it("displays pre-split remainder as bot and does not rewrite the stored totals", async () => {
    const seeded = makeEnv(undefined, {
      "toolbench|__views__": "5",
      "toolbench|__views_human__": "2",
      "toolbench|__views_bot__": "99",
      "toolbench|__total__": "4",
      "toolbench|__downloads_human__": "1",
      "toolbench|__downloads_bot__": "50",
    });
    const stats = await (await call("/stats", {}, seeded)).json();
    assert.equal(stats.views, 5);
    assert.equal(stats.views_human, 2);
    assert.equal(stats.views_bot, 3);
    assert.equal(stats.downloads, 4);
    assert.equal(stats.downloads_human, 1);
    assert.equal(stats.downloads_bot, 3);
    assert.equal(stats.total, 4);
    assert.deepEqual(displayRemainder(5, 2), { human: 2, bot: 3 });
    const kv = seeded.DOWNLOADS as { store: Map<string, string> };
    assert.equal(kv.store.get("toolbench|__views__"), "5");
    assert.equal(kv.store.get("toolbench|__total__"), "4");
    assert.equal(kv.store.get("toolbench|__views_bot__"), "99");
  });

  it("records branch and fork events and keeps CORS on preflight", async () => {
    const env = makeEnv();
    const options = await call("/download", { method: "OPTIONS" }, env);
    assert.equal(options.status, 204);
    assert.equal(options.headers.get("access-control-allow-origin"), "*");
    assert.match(options.headers.get("access-control-allow-methods") || "", /POST/);
    assert.match(options.headers.get("access-control-allow-headers") || "", /Content-Type/);
    assert.match(options.headers.get("access-control-allow-headers") || "", /MCP-Protocol-Version/);

    const bad = await call("/event", { method: "POST", body: "nope" }, env);
    assert.equal(bad.status, 400);
    const event = await call("/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner: "ForkUser", repo: "toolbench", branch: "feature", fork: true }),
    }, env);
    assert.equal(event.status, 200);
    const eventBody = await event.json();
    assert.equal(eventBody.ok, true);
    assert.equal(eventBody.branch, "feature");
    assert.equal(eventBody.fork, "1");
    assert.equal(eventBody.key, "toolbench|ForkUser|toolbench|feature|1");

    const named = await call("/event", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "" },
      body: JSON.stringify({ fork: "Someone/toolbench", branch: "forked" }),
    }, env);
    assert.equal(named.status, 200);
    const namedBody = await named.json();
    assert.equal(namedBody.owner, "Someone");
    assert.equal(namedBody.repo, "toolbench");
    assert.equal(namedBody.fork, "1");

    const stats = await (await call("/stats", {}, env)).json();
    assert.equal(stats.by_branch.feature, 1);
    assert.equal(stats.by_branch.forked, 1);
    assert.equal(stats.by_fork["1"], 2);
    assert.equal(stats.downloads, 2);
    assert.equal(stats.downloads_human, 1);
    assert.equal(stats.downloads_bot, 1);
    assert.equal(stats.views, 0);
  });

  it("serves install.sh and discovery routes without incrementing", async () => {
    const env = makeEnv();
    const install = await call("/install.sh", {}, env);
    assert.equal(install.status, 200);
    const script = await install.text();
    assert.match(script, /Mozilla\/5\.0/);
    assert.match(script, /ASSET="toolbench-0\.1\.0\.tar\.gz"/);
    assert.match(script, /\/download\?asset=\$\{ASSET\}/);
    assert.match(script, /npx tsx src\/cli\.ts run/);
    for (const path of ["/openapi.json", "/cite.json", "/sitemap.xml", "/robots.txt", "/llms.txt", "/ai.txt"]) {
      const res = await call(path, {}, env);
      assert.equal(res.status, 200, path);
      assert.equal(res.headers.get("access-control-allow-origin"), "*");
    }
    const cite = await (await call("/cite.json", {}, env)).json();
    assert.equal(cite.third_party_lab_status, "SLOT");
    assert.equal(cite.external_lab, "unverified");
    assert.equal(cite.forks, "always allowed");
    const count = await (await call("/count", {}, env)).json();
    assert.equal(count.downloads, 0);
    assert.equal(count.views, 0);
  });

  it("does not increment on /v1 or /mcp and does not report a suite pass", async () => {
    assert.equal(RUNTIME_TEXT.LIMITATION, LIMITATION);
    assert.equal(RUNTIME_TEXT.VERSION, "0.1.0");
    assert.deepEqual([...RUNTIME_TEXT.CASE_IDS], SUITE_CASES.map((row) => row.id));
    const seen: { url: string; method: string; body: string }[] = [];
    const env = makeEnv(async (input, init) => {
      const url = String(input);
      const method = init?.method || "GET";
      const body = init?.body ? new TextDecoder().decode(init.body as ArrayBuffer) : "";
      seen.push({ url, method, body });
      return new Response(JSON.stringify({ ok: true, proxied: true, enabled: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const root = await call("/v1", {}, env);
    assert.equal(root.status, 200);
    assert.equal((await root.json()).kv_increment, false);
    const health = await call("/v1/health", {}, env);
    assert.equal(health.status, 200);
    const healthBody = await health.json();
    assert.equal(healthBody.version, "0.1.0");
    assert.equal(healthBody.mesh_enabled_by_get, false);
    assert.equal(healthBody.suite_executed_here, false);
    assert.equal(healthBody.third_party_lab_status, "SLOT");
    const limit = await (await call("/v1/limitation", {}, env)).json();
    assert.equal(limit.limitation, LIMITATION);
    const suite = await (await call("/v1/suite", {}, env)).json();
    assert.equal(suite.executed, false);
    assert.equal(Object.hasOwn(suite, "pass"), false);
    assert.equal(suite.invents_pass, false);
    assert.equal(suite.third_party_lab_status, "SLOT");
    assert.deepEqual(suite.case_ids, SUITE_CASES.map((row) => row.id));

    const mesh = await call("/v1/mesh", {}, env);
    assert.equal(mesh.status, 200);
    assert.equal(mesh.headers.get("x-aziel-door"), "proxy");
    const meshBody = await mesh.json();
    assert.equal(meshBody.proxied, true);
    assert.equal(seen[0].method, "GET");
    assert.equal(seen[0].body, "");
    assert.match(seen[0].url, /\/v1\/mesh$/);

    const open = await call("/v1/run_case", { method: "POST", body: JSON.stringify({ id: "fg-halluc" }) }, env);
    assert.equal(open.status, 400);
    const refused = await open.json();
    assert.equal(refused.code, "TOOLBENCH-DOOR");
    assert.equal(refused.invents_pass, false);
    assert.equal(seen.length, 1);

    const mcp = await call("/mcp", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    }, env);
    const rpc = await mcp.json();
    const names = rpc.result.tools.map((tool: { name: string }) => tool.name);
    assert.deepEqual(names, [
      "toolbench_health",
      "toolbench_skill",
      "toolbench_doctor",
      "toolbench_limitation",
      "toolbench_suite",
    ]);
    const docs = await call("/mcp", {}, env);
    assert.equal(docs.status, 200);
    const count = await (await call("/count", {}, env)).json();
    assert.equal(count.downloads, 0);
    assert.equal(count.views, 0);
  });

  it("renders the landing without an invented lab result", async () => {
    const env = makeEnv();
    const res = await call("/", {}, env);
    const html = await res.text();
    assert.match(html, /<h1>ToolBench<\/h1>/);
    assert.match(html, /id="download" href="\/download"/);
    assert.match(html, /prefers-color-scheme:\s*light/);
    assert.match(html, /:focus-visible/);
    assert.match(html, /Features/);
    assert.match(html, /SLOT/);
    assert.match(html, /Forks always allowed/);
    assert.match(html, /0\.1\.0/);
    assert.match(html, /href="\/stats"/);
    assert.doesNotMatch(html, /lab-ui\.png/);
    assert.doesNotMatch(html, /9\.9\.9|1\.0\.0|0\.2\.0/);
    for (const theme of [THEME.dark, THEME.light]) {
      assert.ok(contrast(theme.ink, theme.bg) >= 4.5);
      assert.ok(contrast(theme.muted, theme.bg) >= 4.5);
      assert.ok(contrast(theme.btnInk, theme.btnBg) >= 4.5);
      assert.ok(contrast(theme.focus, theme.bg) >= 3);
    }
    const probe = classifyRequest(new Request("http://127.0.0.1/", { headers: { "user-agent": "" } }));
    assert.equal(probe.bucket, "bot");
    assert.equal(probe.reason, "empty_ua");
  });
});
