# ToolBench download tracker

Worker name: `toolbench-download-tracker`.

This source is the landing and counted download. It is not deployed by tests or by a pull request. A deploy happens only after Dual CLEAR and an explicit OK. Cap-7 ≠ ICANN. Paid sat HELD. Remain-OFF.

Expected route after that deploy: `https://toolbench-download-tracker.vibelock.workers.dev/`

`GET /download` returns `public/toolbench-0.1.0.tar.gz` with HTTP 200 (`Content-Type: application/gzip`, `Content-Disposition: attachment`). The archive is the repository tree at package.json version **0.1.0**. GitHub Releases has no asset. Do not invent another version.

## Count

KV binding `DOWNLOADS`. Create a new namespace `TOOLBENCH_DOWNLOADS` and replace the placeholder id in `wrangler.toml` before deploy. Do not reuse another product's namespace.

Key layout: `toolbench|owner|repo|branch|fork`.

`GET /` counts a page view. `GET /download` and `GET /go` count a download. Totals on `GET /count` and `GET /stats` sum every branch and fork. `POST /event` records a fork or branch when the caller sends `{owner,repo,branch,fork}`.

`/v1`, `/mcp`, and `/v1/mesh/*` do not increment. GET never enables mesh. FragGate stays the executable door: `/v1/fraggate/*` and `/v1/mesh/*` proxy to aziel-runtime. This Worker does not run the 8-case suite and does not report a pass.

Human/bot display uses strategy (b): `views_bot = views - views_human` and the same for downloads. Threshold 30. Never inflate. Never sample. Never reset existing counters.

## Local

```bash
cd workers/download-tracker
npm install
npx wrangler dev
```

Open the printed local URL. `GET /download` serves the archive from `public/`.

Rebuild the archive from the repository root:

```bash
node workers/download-tracker/scripts/pack-archive.mjs
```

Author: Aziel Eliab. Apache-2.0. Forks are always allowed.
