/**
 * ToolBench Worker agent surface.
 * Read paths are local. The 8-case suite runs in the Node package, not here.
 * /v1 and /mcp never increment DOWNLOADS. GET never enables mesh.
 * Author: Aziel Eliab only.
 */
import { classifyV1Path, doorTargetUrl } from "./door.js";

const PRODUCT = "toolbench";
const NAME = "ToolBench";
const VERSION = "0.1.0";
const AUTHOR = "Aziel Eliab";
const HOST = "https://toolbench-download-tracker.vibelock.workers.dev";
const GITHUB = "https://github.com/AzielEliab/toolbench";
const CATALOG_MCP = "https://aziel-runtime.vibelock.workers.dev/mcp";
const FRAGGATE_CALL = "https://aziel-runtime.vibelock.workers.dev/v1/fraggate/call";
const MOTTO = "Synthetic refuse packs. Self-test ≠ third-party lab.";
const LIMITATION =
  "THIS IS: a standalone synthetic tool-use playground (TOOLBENCH-0.1) for FragGate refuse packs (Sentinel / TDQS / FG-HALLUC-TOOL / FG-STUB). suite lists 8 cases; run_case classifies one against a vendored snapshot of the FragGate kind rows for zkattest, mmconsensus, and toolbench, copied from AzielEliab/aziel-runtime src/fraggate/registry.js. Honesty: REAL classification of those 8 cases. invent_completeness / live remote harness / third-party lab / invent-a-pass stay SLOT. Self-test is not a third-party lab. This repository is not the hosted FragGate door. Author: Aziel Eliab only.";

const CASE_IDS = [
  "fg-halluc",
  "zk-stub-groth16",
  "zk-health",
  "zk-unknown",
  "mm-stub-live-model",
  "mm-tally",
  "tb-stub-fielded",
  "guest-vm-halluc",
];

const LIVE_OPS = ["health", "skill", "doctor", "suite", "run_case", "limitation"];
const READ_OPS = ["health", "skill", "doctor", "limitation", "suite"];
const DOOR_NOTE =
  "This Worker serves the counted source archive and read-only status. It does not run the 8-case suite and it does not report a pass. Run npx tsx src/cli.ts run after install. /v1 and /mcp do not increment. GET never enables mesh. FragGate on aziel-runtime stays the executable door.";

const SKILL = `---
name: ToolBench
description: >-
  Standalone deterministic 8-case FragGate refuse benchmark (TOOLBENCH-0.1).
  Third-party lab stays SLOT. Author Aziel Eliab.
---

# ToolBench

${MOTTO}

Author: **Aziel Eliab**. Identity is Aziel Eliab only.
Version: ${VERSION}
GitHub: ${GITHUB}
Download tracker: ${HOST}/download
Stats: ${HOST}/stats
Archive: toolbench-0.1.0.tar.gz (built from this repository; package.json ${VERSION})

${DOOR_NOTE}

Always send \`User-Agent: Mozilla/5.0\`.

## This Worker

| Method | Path | What |
|--------|------|------|
| GET | \`/download\` | Counted gzip of toolbench-0.1.0.tar.gz. HTTP 200. |
| GET | \`/go\` | Same counted archive. HTTP 200. |
| GET | \`/count\` | Compact count JSON. Does not increment. |
| GET | \`/stats\` | Full stats JSON. Does not increment. |
| GET | \`/v1/health\` | Tracker liveness. Does not increment. |
| GET | \`/v1/skill\` | This markdown. Does not increment. |
| GET | \`/v1/doctor\` | Read-only self-check. Does not run cases. Does not increment. |
| GET | \`/v1/limitation\` | Honesty text from this repository. Does not increment. |
| GET | \`/v1/suite\` | Case ids only. executed false. No pass field. |
| GET | \`/v1/fraggate/list\` | PROXY to aziel-runtime. Not a second door. |
| POST | \`/v1/fraggate/call\` | PROXY to aziel-runtime. FragGate remains the executable door. |
| GET | \`/v1/mesh\` | PROXY. Does not enable mesh. |
| GET | \`/mcp\` | MCP docs. Does not increment. |
| POST | \`/mcp\` | JSON-RPC for the read-only tools below. |

Catalog MCP: \`${CATALOG_MCP}\` with FragGate slug \`${PRODUCT}\`.
Catalog call: \`POST ${FRAGGATE_CALL}\` body \`{"slug":"toolbench","op":"suite"}\`.

## Local suite

\`\`\`bash
npx tsx src/cli.ts suite
npx tsx src/cli.ts run
npx tsx src/cli.ts run fg-halluc
\`\`\`

suite and run_case are REAL against the vendored kind table.
invent_completeness, live_remote_harness, invent_pass, and third_party_lab are SLOT.

## Case ids

${CASE_IDS.map((id) => "- `" + id + "`").join("\n")}

Read tools on this Worker: ${READ_OPS.map((op) => "`toolbench_" + op + "`").join(", ")}.
run_case is not executed here.
`;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, mcp-session-id, User-Agent, Authorization",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function suiteBody() {
  return {
    ok: true,
    op: "suite",
    product: PRODUCT,
    version: VERSION,
    spec: "TOOLBENCH-0.1",
    executed: false,
    case_ids: CASE_IDS.slice(),
    count: CASE_IDS.length,
    third_party_lab: false,
    third_party_lab_status: "SLOT",
    external_lab: "unverified",
    invents_pass: false,
    note: "This Worker does not run cases and does not report a pass. Use npx tsx src/cli.ts run.",
  };
}

function healthBody() {
  return {
    ok: true,
    product: PRODUCT,
    name: NAME,
    version: VERSION,
    author: AUTHOR,
    spec: "TOOLBENCH-0.1",
    surface: "download-tracker",
    door: "fraggate",
    slug: PRODUCT,
    kv_increment: false,
    mesh_enabled_by_get: false,
    suite_executed_here: false,
    third_party_lab_status: "SLOT",
    note: DOOR_NOTE,
  };
}

function doctorBody() {
  return {
    ok: true,
    product: PRODUCT,
    version: VERSION,
    author: AUTHOR,
    identity: "Aziel Eliab only",
    worker_local: true,
    fraggate_live: false,
    asset: "toolbench-0.1.0.tar.gz",
    suite_executed_here: false,
    cases_run_here: 0,
    third_party_lab_status: "SLOT",
    note: "Read-only self-check. The 8-case suite stays in the Node process after install. This response does not enable mesh and does not report a pass.",
  };
}

function doorRefusal(op) {
  return {
    ok: false,
    code: "TOOLBENCH-DOOR",
    op,
    honesty: "REAL",
    door: "fraggate",
    slug: PRODUCT,
    agent_path: FRAGGATE_CALL,
    local: "npx tsx src/cli.ts run",
    invents_pass: false,
    third_party_lab_status: "SLOT",
    note: `This Worker does not run \`${op}\`. Use the local CLI, or POST FragGate with slug toolbench. Nothing was enabled.`,
  };
}

function openapiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "ToolBench download tracker",
      version: VERSION,
      description: DOOR_NOTE,
      license: { name: "Apache-2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
    },
    servers: [{ url: HOST }],
    paths: {
      "/download": {
        get: {
          operationId: "downloadArchive",
          summary: "Counted download of toolbench-0.1.0.tar.gz",
          responses: { "200": { description: "gzip archive" } },
        },
      },
      "/stats": {
        get: {
          operationId: "stats",
          summary: "Full download stats. Does not increment.",
          responses: { "200": { description: "stats JSON" } },
        },
      },
      "/count": {
        get: {
          operationId: "downloadCount",
          summary: "Views and downloads. total equals downloads. Does not increment.",
          responses: { "200": { description: "count JSON" } },
        },
      },
      "/v1/health": { get: { operationId: "health", summary: "Tracker liveness", responses: { "200": { description: "health" } } } },
      "/v1/skill": { get: { operationId: "skill", summary: "Skill markdown", responses: { "200": { description: "markdown" } } } },
      "/v1/suite": { get: { operationId: "suite", summary: "Case ids. Does not execute or report a pass.", responses: { "200": { description: "suite" } } } },
      "/mcp": {
        post: {
          operationId: "mcp",
          summary: "MCP JSON-RPC for read-only toolbench tools",
          responses: { "200": { description: "JSON-RPC" } },
        },
      },
    },
  };
}

function mcpTools() {
  return [
    { name: "toolbench_health", description: "Tracker liveness. Does not run the suite or enable mesh.", inputSchema: { type: "object", properties: {} } },
    { name: "toolbench_skill", description: "Skill markdown for ToolBench 0.1.0.", inputSchema: { type: "object", properties: {} } },
    { name: "toolbench_doctor", description: "Read-only self-check of this download tracker.", inputSchema: { type: "object", properties: {} } },
    { name: "toolbench_limitation", description: "Honesty text from this repository.", inputSchema: { type: "object", properties: {} } },
    { name: "toolbench_suite", description: "Lists the 8 case ids. Does not execute them and does not report a pass.", inputSchema: { type: "object", properties: {} } },
  ];
}

function mcpInitialize() {
  return {
    protocolVersion: "2025-03-26",
    capabilities: { tools: { listChanged: false } },
    serverInfo: { name: "toolbench-download-tracker", version: VERSION },
    instructions: DOOR_NOTE + " Catalog MCP remains " + CATALOG_MCP + ". Do not rename aziel-runtime tools.",
  };
}

function readTool(name) {
  if (name === "toolbench_health" || name === "health") return healthBody();
  if (name === "toolbench_skill" || name === "skill") return { skill: SKILL };
  if (name === "toolbench_doctor" || name === "doctor") return doctorBody();
  if (name === "toolbench_limitation" || name === "limitation") return { ok: true, limitation: LIMITATION, version: VERSION };
  if (name === "toolbench_suite" || name === "suite") return suiteBody();
  return null;
}

async function handleMcp(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    const docs = {
      product: PRODUCT,
      version: VERSION,
      author: AUTHOR,
      protocol: "mcp",
      door: "fraggate",
      slug: PRODUCT,
      catalog_mcp: CATALOG_MCP,
      tools: mcpTools().map((t) => t.name),
      third_party_lab_status: "SLOT",
      note: DOOR_NOTE,
    };
    if (request.method === "HEAD") return new Response(null, { status: 200, headers: corsHeaders() });
    return json(docs);
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  const id = body && Object.prototype.hasOwnProperty.call(body, "id") ? body.id : null;
  const method = body && body.method;
  const params = (body && body.params) || {};
  if (method === "initialize") return json({ jsonrpc: "2.0", id, result: mcpInitialize() });
  if (method === "notifications/initialized" || method === "initialized") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (method === "ping") return json({ jsonrpc: "2.0", id, result: {} });
  if (method === "tools/list") return json({ jsonrpc: "2.0", id, result: { tools: mcpTools() } });
  if (method === "tools/call") {
    const name = params.name;
    const data = readTool(name);
    if (!data) {
      return json({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [{
            type: "text",
            text: JSON.stringify({
              ok: false,
              code: "TOOLBENCH-DOOR",
              error: "Unknown or non-local tool. run_case goes through the local CLI or FragGate slug toolbench. This Worker did not execute it.",
              agent_path: FRAGGATE_CALL,
              catalog_mcp: CATALOG_MCP,
              invents_pass: false,
              third_party_lab_status: "SLOT",
            }, null, 2),
          }],
        },
      });
    }
    if (name === "toolbench_skill" || name === "skill") {
      return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: SKILL }] } });
    }
    return json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } });
  }
  return json({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "Method not found. Use initialize, tools/list, tools/call." },
  });
}

function runtimeFetcher(env) {
  if (env && env.AZIEL_RUNTIME && typeof env.AZIEL_RUNTIME.fetch === "function") return env.AZIEL_RUNTIME;
  return null;
}

async function proxyDoor(request, url, env) {
  const dest = doorTargetUrl(url.pathname, request.url, env);
  if (!dest) return json({ ok: false, error: "not a door path", path: url.pathname, door: "fraggate" }, 404);
  const headers = new Headers();
  const pass = ["content-type", "accept", "authorization", "user-agent", "mcp-protocol-version", "mcp-session-id"];
  for (const name of pass) {
    const v = request.headers.get(name);
    if (v) headers.set(name, v);
  }
  if (!headers.has("user-agent") && !headers.has("User-Agent")) headers.set("User-Agent", "Mozilla/5.0 ToolBench/0.1.0");
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }
  try {
    const fetcher = runtimeFetcher(env);
    const res = fetcher ? await fetcher.fetch(dest, init) : await fetch(dest, init);
    const outHeaders = new Headers();
    const ctype = res.headers.get("content-type");
    if (ctype) outHeaders.set("content-type", ctype);
    for (const [k, v] of Object.entries(corsHeaders())) outHeaders.set(k, v);
    outHeaders.set("X-Aziel-Door", "proxy");
    outHeaders.set("X-Aziel-Door-Origin", dest);
    outHeaders.set("Cache-Control", "private, no-store");
    return new Response(res.body, { status: res.status, headers: outHeaders });
  } catch (exc) {
    console.error(JSON.stringify({
      event: "fraggate_proxy_failed",
      product: PRODUCT,
      path: url.pathname,
      detail: String(exc && exc.message ? exc.message : exc).slice(0, 240),
    }));
    return json({
      ok: false,
      error: "fraggate_proxy_failed",
      detail: String(exc && exc.message ? exc.message : exc).slice(0, 240),
      origin: dest,
      agent_path: FRAGGATE_CALL,
      door: "fraggate",
      slug: PRODUCT,
      note: "The proxy failed. Nothing was enabled on this Worker.",
    }, 502);
  }
}

export async function handleRuntimeApi(request, url, env) {
  const stripped = url.pathname.replace(/\/+$/, "") || "/";
  if (stripped === "/mcp") return handleMcp(request);

  const classified = classifyV1Path(url.pathname);
  if (classified.kind === "door") return proxyDoor(request, url, env);

  const path = stripped;
  const isApi = path === "/v1" || path.startsWith("/v1/") || path === "/openapi.json";
  if (!isApi) return null;

  if (classified.kind === "multi") {
    return json({
      ok: false,
      error: "not a local op",
      code: "NOT_LOCAL_OP",
      path: classified.path,
      note: "Local reads are a single /v1/{op} segment. FragGate and mesh paths proxy to aziel-runtime and do not increment downloads.",
    }, 404);
  }

  if (path === "/openapi.json" && request.method === "GET") return json(openapiSpec());
  if (path === "/v1" && request.method === "GET") {
    return json({
      ok: true,
      product: PRODUCT,
      version: VERSION,
      read_ops: READ_OPS,
      door: "fraggate",
      kv_increment: false,
      third_party_lab_status: "SLOT",
      note: DOOR_NOTE,
    });
  }
  if (request.method === "GET" && path === "/v1/health") return json(healthBody());
  if (request.method === "GET" && path === "/v1/skill") {
    return new Response(SKILL, {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "private, no-store", ...corsHeaders() },
    });
  }
  if (request.method === "GET" && path === "/v1/doctor") return json(doctorBody());
  if (request.method === "GET" && path === "/v1/limitation") {
    return json({ ok: true, product: PRODUCT, version: VERSION, author: AUTHOR, limitation: LIMITATION });
  }
  if (request.method === "GET" && path === "/v1/suite") return json(suiteBody());

  if (classified.kind === "local" && classified.op) {
    const op = classified.op;
    if (request.method === "GET" && !READ_OPS.includes(op)) {
      return json({ ...doorRefusal(op), hint: "Use the local CLI or FragGate. GET does not enable this op." }, 405);
    }
    if (request.method === "POST") return json(doorRefusal(op), 400);
    if (request.method !== "GET") return json({ ok: false, code: "TOOLBENCH-METHOD", note: "Method not allowed." }, 405);
  }

  return json({ error: "not found", product: PRODUCT, note: DOOR_NOTE }, 404);
}

export const RUNTIME_TEXT = { LIMITATION, MOTTO, VERSION, DOOR_NOTE, CASE_IDS, LIVE_OPS };
