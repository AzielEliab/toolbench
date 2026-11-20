# ToolBench

Standalone deterministic 8-case FragGate refuse benchmark (`TOOLBENCH-0.1`).

`suite` and `run_case` are **REAL**: each case is classified against a vendored snapshot of the FragGate kind rows for `zkattest`, `mmconsensus`, and `toolbench`, copied from [`AzielEliab/aziel-runtime`](https://github.com/AzielEliab/aziel-runtime) `src/fraggate/registry.js` (`116c56c41cb35c9184fc22b30a0e97c1fd9c3ada`). `pass` is true only when the observed kind and code equal that case's expectation.

`invent_completeness`, `live_remote_harness`, `invent_pass`, and `third_party_lab` are **SLOT**. External lab status is `unverified`. Self-test is not a third-party lab letter. This package does not open a second FragGate door.

Author: Aziel Eliab. Apache-2.0. **Forks are always allowed.**

## Install

```bash
npm install
```

Node.js 20 or newer.

Counted archive, HTTP 200 once the Worker is deployed (not a GitHub 302):

https://toolbench-download-tracker.vibelock.workers.dev/download

Stats on the same host, active upon Cloudflare deploy:

https://toolbench-download-tracker.vibelock.workers.dev/stats

The Worker source is `workers/download-tracker/`. It is not deployed by this repository's tests.

## CLI

List the eight cases:

```bash
npx tsx src/cli.ts suite
```

Run all eight. Exit 0 only when every case matches the kind table:

```bash
npx tsx src/cli.ts run
```

Run one case:

```bash
npx tsx src/cli.ts run fg-halluc
npx tsx src/cli.ts run zk-stub-groth16
npx tsx src/cli.ts run zk-health
npx tsx src/cli.ts run zk-unknown
npx tsx src/cli.ts run mm-stub-live-model
npx tsx src/cli.ts run mm-tally
npx tsx src/cli.ts run tb-stub-fielded
npx tsx src/cli.ts run guest-vm-halluc
```

Doctor re-runs the suite and reports any id that did not match:

```bash
npx tsx src/cli.ts doctor
```

## The eight cases

| id | slug | op | expected |
|----|------|----|----------|
| `fg-halluc` | `not-a-real-slug` | `health` | halluc / `FG-HALLUC-TOOL` |
| `zk-stub-groth16` | `zkattest` | `groth16` | stub / `FG-STUB` |
| `zk-health` | `zkattest` | `health` | live / `FG-OK` |
| `zk-unknown` | `zkattest` | `not_an_op` | unknown_op / `FG-UNKNOWN-OP` |
| `mm-stub-live-model` | `mmconsensus` | `live_model_call` | stub / `FG-STUB` |
| `mm-tally` | `mmconsensus` | `tally` | live / `FG-OK` |
| `tb-stub-fielded` | `toolbench` | `invent_completeness` | stub / `FG-STUB` |
| `guest-vm-halluc` | `qemu-sandbox` | `boot` | halluc / `FG-HALLUC-TOOL` |

`zk-health` and `mm-tally` are the live controls. The other six are refuses. A case passes when classification matches the row. A mismatch stays a failure. Caller fields such as `pass: true` are ignored.

Slugs outside the snapshot are refused (`live_remote_harness` stays SLOT) instead of being given an invented kind.

## Library

```js
import { runToolbench, runSuite } from "toolbench";

const one = await runToolbench("run_case", { id: "fg-halluc" });
const all = runSuite();
```

Build declarations with `npm run build`. Day-to-day commands use `tsx` on `src/cli.ts`.

## Archive

```bash
node workers/download-tracker/scripts/pack-archive.mjs
```

The script writes `workers/download-tracker/public/toolbench-0.1.0.tar.gz` from this tree at version **0.1.0**. Two runs produce the same bytes. GitHub Releases has no separate asset. Do not invent another version.

## Honesty

| Surface | Label |
|---------|--------|
| `suite`, `run_case` | REAL |
| Kind rows for the three slugs above | REAL snapshot, not the full catalog |
| `invent_completeness`, `live_remote_harness`, `invent_pass` | SLOT |
| Third-party lab | SLOT / unverified |
| Hosted FragGate door | aziel-runtime, not this process |
| Download tracker deploy | held until an explicit deploy |

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Forks are always allowed.
