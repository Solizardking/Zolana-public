# ZOLana

**Privacy-first, agentic Solana platform for autonomous DeFi, shielded wallets, and offline cold storage**

ZOLana is the combined system: Dark Protocol, Dark Wallet, DarkSwap, paper-wallet tooling, and the broader Zcash-inspired privacy stack, all organized around Clawd agents that can monitor, route, and operate the chain with policy-driven autonomy.

It is inspired by Gorbagana and shaped around a simple idea: private money should be fast, programmable, and usable by agents without giving up user custody.

SOLtoshi is the outward-facing operator persona. ZOLtoshi is the privacy-first chain persona. Same system, different face.

---

## Executive Summary

> ZOLana combines Zcash-style zero-knowledge privacy, Solana-speed execution, Jupiter routing, Helius infrastructure, offline paper-wallet generation, and AI agents in trusted execution environments into one unified privacy-first blockchain platform.

| What | How |
|------|-----|
| Privacy | Zcash Sapling and Orchard-inspired shielded flows, encrypted memos, notes, commitments, and nullifiers |
| Speed | Solana execution with fast confirmation targets, low fees, and high-throughput routing |
| Swaps | Jupiter aggregation for best-route private swaps and liquidity discovery |
| Infrastructure | Helius RPC, webhooks, and data APIs for transaction and asset operations |
| AI Agents | TEE-secured Clawd agents for policy, automation, monitoring, and routing |
| Wallets | Dark Wallet plus external wallet integrations like Backpack and Phantom |
| Cold Storage | Offline paper-wallet generation for air-gapped key creation and recovery |
| Autonomy | A chain operator model where agents can manage health, policy, and transaction flows under user-defined rules |

---

## Current Public Release Surface

Treat these paths as the supported public release surface today:

- `dark-wallet/`
- `dark-protocol/sdk/typescript/`
- `dark-protocol/rail-worker/`

Do not ship these paths as supported public surfaces yet:

- `dark-protocol/programs/`
- `dark-protocol/client/`
- `dark-protocol/evm-verifier/`
- root `src/` plus the root `Cargo.toml` / `Cargo.lock` Zcash-derived node tree
- `paper/`, `darkswap/`, `backpack-master/`, and `jupiter-amm-implementation-main/`

Why this boundary exists:

- the Anchor instruction handlers under `dark-protocol/programs/` currently fail
  closed with `FeatureNotProductionReady`
- proof verification, Jupiter CPI, and TEE attestation enforcement are still
  incomplete there
- the remaining Rust Cargo graphs still carry unresolved advisory debt that is
  not cleared for public ship

## Build Map and Smoke Status

Last audited: July 6, 2026.

Public-release build surfaces:

| Surface | Command | Result |
|---------|---------|--------|
| Dark Wallet browser app | `npm --prefix dark-wallet ci`, `npm --prefix dark-wallet audit --json`, `npm --prefix dark-wallet run build` | Pass. npm audit is clean after the lockfile-only transitive update. Production build succeeds. |
| Dark Protocol TypeScript SDK | `pnpm --dir dark-protocol/sdk/typescript build` | Pass. Rollup leaves package dependencies external, which is expected for the SDK bundle. |
| Rail worker | `npm --prefix dark-protocol/rail-worker test` | Pass. 28 Node tests pass, including replay, CORS, Solana Memo verification, x402/AP2/M2M envelope validation, and sanitized rail planning. |
| Dark Protocol Anchor workspace | `cargo check --manifest-path dark-protocol/Cargo.toml` | Pass with warnings. The warnings are consistent with the pre-release boundary: unexpected Anchor/Solana cfg checks, unused imports, and unreachable guarded code behind `FeatureNotProductionReady`. |
| Root Zcash-derived Rust FFI tree | `cargo check --manifest-path Cargo.toml` | Pass with warnings about shared/mutable references to mutable statics in legacy FFI cache paths. |

Current public-exposure posture:

- `.env`, `dark-protocol/.env`, `.claude/settings.local.json`, `.vscode/`,
  `dark-wallet/node_modules/`, `dark-wallet/dist/`, `target/`, `.zolana/`,
  wallet/keypair JSON files, service-account files, token dumps, local ledgers,
  databases, and private-key/certificate files are ignored by the root
  `.gitignore`.
- Tracked `.DS_Store` metadata was removed from the git index.
- A tracked-file scan found no high-confidence live API key, private-key block,
  JWT, GitHub token, AWS access-key, OpenAI, Anthropic, or xAI token patterns.
- A tracked filename scan found no committed `.env`, private key, keypair,
  service-account, credential, token, raw key-dump, or `.DS_Store` files.

Dark Wallet animation/update notes:

- `dark-wallet/src/App.tsx` no longer renders standalone ambient decoration
  nodes.
- `dark-wallet/src/index.css` now drives the dark surface through animated
  page fields, scanlines, hero rail motion, staged status-card wake-ins, and a
  `prefers-reduced-motion` fallback.
- `dark-wallet/postcss.config.cjs` wires Tailwind and Autoprefixer into the
  Vite production build so `@tailwind` directives are processed before
  minification.

---

## Current Dark Wallet Port

The active wallet work ports the Zcash paper-wallet model into the Solana
runtime while keeping the original cold-storage discipline.

What is now wired:

1. `dark-wallet/src/components/wallet/PaperWallet.tsx` adds a Solana paper
   wallet tab with local entropy, keypair generation, printable sheet output,
   and JSON export.
2. `dark-wallet/src/utils/runtime.ts` resolves SVM devnet/mainnet-beta RPC from
   `HELIUS_RPC_URL`, `SOLANA_RPC_URL`, and `SOLANA_CLUSTER`.
3. `dark-wallet/src/utils/dark-clawd-agent.ts` keeps the browser-side Dark
   Clawd path deterministic. It reviews public cold-storage metadata and
   private-payment intent fields locally, without accepting `XAI_API_KEY` or
   `VITE_XAI_API_KEY` in the browser build. When `RAIL_WORKER_URL` is
   configured, `dark-protocol/rail-worker` can perform optional xAI review
   server-side from the same sanitized public metadata.
4. `dark-wallet/src/sdk/private-payment.ts` adds durable private payment
   staging for `x402`, `AP2`, and `M2M`, with explicit Solana/EVM settlement,
   lamport-denominated receipts, local commitments, Solana anchor metadata, and
   exportable EIP-712-style EVM intent proof payloads.
5. `dark-wallet/src/sdk/shielded-ledger.ts` adds a durable browser-local
   shielded note ledger. Shield anchors credit note commitments; unshield and
   private-transfer anchors debit those commitments with nullifier-like local
   records so the UX no longer depends on hard-coded mock shielded balances.
6. `dark-wallet/src/sdk/rail-authorization.ts` adds x402/AP2/M2M authorization
   envelopes with expiry, replay key, Solana anchor binding, verified slot, and
   EVM digest binding for agent/facilitator handoff.
7. `dark-protocol/rail-worker/` validates those exported envelopes, enforces
   replay and expiry locally, and can now forward validated requests to
   configured x402, AP2, or M2M settlement backends.

How the last-November Zcash-to-Solana port works:

1. The original `paper/` generator is kept as archived Zcash/Sapling reference
   material only. It is not part of the supported public release surface.
2. Dark Wallet keeps that workflow but outputs Solana keypairs for SVM use.
3. Shielding and private transfers stay exposed in the wallet as staged
   privacy operations and now anchor wallet-signed Solana Memo intent
   transactions while Dark Protocol program IDs and live proof plumbing are
   finalized.
4. Helius supplies practical RPC access for devnet and mainnet-beta, while the
   paper-wallet generation path remains fully local and does not require RPC.
5. Shield/unshield/private-transfer now maintain a browser-local shielded note
   ledger after the Solana Memo anchor succeeds. This gives the port a durable
   note/balance surface while the full on-chain note scanner, nullifier set, and
   ZK verifier program are still being finalized.
6. Private-payment receipts are currently wallet-side durable records. They can
   be anchored as Solana Memo intent transactions, then store the resulting
   signature, cluster, explorer URL, and status on the same receipt. The wallet
   can re-fetch that transaction and verify the Memo payload still matches the
   receipt fields before exporting EVM proof intent. The wallet also recomputes
   and checks the EVM intent proof digest against the receipt, configured EVM
   chain, and optional verifier address. It can also export a rail
   authorization envelope for x402/AP2/M2M workers. The EVM proof export is an
   intent payload for later verifier or contract anchoring, not yet final
   privacy settlement.
7. The new `dark/` folder is the combined product map. It groups the Solana
   wallet, agent, DeFi, and swap surfaces while pointing back to the canonical
   implementation folders so code does not fork into stale duplicates.
8. The rail worker can now keep a sanitized durable ledger with
   `RAIL_WORKER_STORE_PATH`, so replay protection and settlement status survive
   process restarts without storing full proof payloads, recipients, or amounts.
9. Dark Wallet can submit an anchored receipt directly to the rail worker when
   `RAIL_WORKER_URL` or `VITE_RAIL_WORKER_URL` is configured, then refresh the
   worker ledger status from the paper-wallet receipt row. It now persists and
   renders the worker's sanitized `evmVerifierPlan` with EVM verifier readiness,
   plan digest, verified Solana slot, and sign/submit commands so the operator
   can continue from browser receipt to EVM intent proof without exposing
   recipient, amount, private keys, signatures, or full proof payloads.
10. The rail worker can independently verify the Solana Memo anchor through
    Helius or another Solana RPC before consuming replay keys or forwarding to a
    settlement backend.
11. After validation and Solana Memo verification, the rail worker now returns a
    sanitized `evmVerifierPlan` with verifier address, digest, verified slot,
    proof-file placeholder, and sign/submit command lines. Durable rail-worker
    ledgers store only readiness fields and plan digest, not full proof payloads,
    recipients, or amounts.
12. The EVM verifier now has a relay CLI that converts wallet proof payloads
    into `cast send recordIntentProof(...)` calls, keeping broadcast dry-run by
    default and requiring an explicit EVM signer signature.
13. The verifier package also has a signer CLI that derives the verifier digest
    with `cast call hashIntent(...)` and signs it with a separate
    `EVM_INTENT_PRIVATE_KEY`, keeping the paper wallet free of EVM keys.
14. The rail worker exposes `GET /rail/preflight` and optional
    `/rail/preflight?probe=1` so operators can verify Helius/Solana RPC,
    server-side xAI availability, EVM verifier configuration, durable replay
    ledger mode, and x402/AP2/M2M backend readiness without sending receipts,
    amounts, recipients, proof payloads, API keys, or backend bearer tokens.

Program re-exploration and port mapping:

| Zcash/Sapling reference | Solana/ZOLana port | Current implementation |
|-------------------------|--------------------|------------------------|
| Offline paper wallet entropy and printable recovery | Solana keypair paper wallet with browser-local entropy | `dark-wallet/src/components/wallet/PaperWallet.tsx` (supported), `paper/` (archived reference) |
| Sapling notes and commitments | Durable wallet receipts, local note ledger, note-like commitments, nullifier-ready intent data | `dark-wallet/src/sdk/private-payment.ts`, `dark-wallet/src/sdk/shielded-ledger.ts`, `dark-protocol/sdk/typescript/src/intent.ts` |
| Shielded transaction metadata discipline | Wallet-signed Solana Memo intent anchors on devnet/mainnet-beta | `dark-wallet/src/sdk/dark-protocol.ts` |
| Viewing/spending separation | Public-only agent review plus local secret-key custody | `dark-wallet/src/utils/dark-clawd-agent.ts` |
| Cross-domain proof handoff | EIP-712-style EVM intent proof and consume-once verifier | `dark-protocol/evm-verifier/` |
| Payment facilitator handoff | x402/AP2/M2M rail authorization worker with optional backend forwarding | `dark-protocol/rail-worker/` |

Relevant env:

Keep real values in a local untracked env file only. Do not commit live keys,
RPC tokens, or private-key material.

```bash
HELIUS_RPC_URL=
# server-side/manual tooling only; browser wallet ignores raw API-key env
HELIUS_API_KEY=
SOLANA_RPC_URL=
SOLANA_CLUSTER=devnet        # or mainnet-beta
EVM_CHAIN_ID=1
EVM_PRIVATE_PAYMENT_VERIFIER=
EVM_RPC_URL=
EVM_PRIVATE_KEY=
EVM_INTENT_PRIVATE_KEY=
EVM_INTENT_SIGNER=
EVM_INTENT_SIGNATURE=
SOLANA_VERIFIED_SLOT=
RAIL_WORKER_BACKEND_TOKEN=
RAIL_WORKER_STORE_PATH=.zolana/rail-ledger.json
RAIL_WORKER_URL=http://127.0.0.1:4020
RAIL_WORKER_CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
RAIL_WORKER_ENABLE_SETTLEMENT_LIST=0
RAIL_WORKER_VERIFY_SOLANA_ANCHOR=1
RAIL_WORKER_REQUIRE_SOLANA_VERIFICATION=1
RAIL_WORKER_SOLANA_COMMITMENT=confirmed
# rail-worker only; do not expose in a public browser build
XAI_API_KEY=
XAI_BASE_URL=
XAI_MODEL=
X402_FACILITATOR_URL=
AP2_MANDATE_RUNNER_URL=
M2M_SETTLEMENT_URL=
```

---

## Repository Atlas

| Directory | Purpose |
|-----------|---------|
| [`dark/`](./dark/README.md) | Combined product map for Dark Wallet, Dark Agent, Dark DeFi, and Dark Swap surfaces |
| [`src/`](./src/README.md) | Zcash-derived full-node daemon and privacy core reference; not in the current supported public release surface |
| [`dark-protocol/`](./dark-protocol/README.md) | TypeScript SDK, rail worker, and experimental Solana privacy program research |
| [`dark-protocol/rail-worker/`](./dark-protocol/rail-worker/README.md) | Executable intent-mode x402/AP2/M2M rail authorization worker |
| [`dark-protocol/evm-verifier/`](./dark-protocol/evm-verifier/README.md) | Pre-release EVM consume-once verifier tooling; not in the current supported public release surface |
| [`dark-wallet/`](./dark-wallet/README.md) | Browser-based privacy wallet with shielded balances, private transfers, and swap UX |
| [`darkswap/`](./darkswap/README.md) | Jupiter routing reference examples; not part of the supported public release surface |
| [`paper/`](./paper/README.md) | Archived Zcash paper-wallet reference; not part of the supported public release surface |
| [`backpack-master/`](./backpack-master/README.md) | Vendored Backpack wallet reference monorepo; not part of the supported public release surface |
| [`helius-sdk-main/`](./helius-sdk-main/README.md) | Helius RPC, webhooks, DAS, and transaction infrastructure |
| [`jupiter-amm-implementation-main/`](./jupiter-amm-implementation-main/README.md) | Vendored Jupiter AMM reference code; not part of the supported public release surface |
| [`depends/`](./depends/README.md) | Cross-compilation dependency builder and build support |
| [`build-aux/`](./build-aux/README.md) | GNU Autotools support files and build system glue |
| [`contrib/`](./contrib/README.md) | Packaging, Docker, CI/CD, and deployment tooling |
| [`doc/`](./doc/README.md) | Documentation, release notes, and developer guidance |
| [`qa/`](./qa/README.md) | Quality assurance, RPC tests, and validation tooling |
| [`share/`](./share/README.md) | Shared build scripts and configuration helpers |
| [`zcutil/`](./zcutil/README.md) | Utilities for build, fuzz, and release workflows |
| [`test/`](./test/README.md) | Linting and test infrastructure |

---

## Core Components

### 1. Zcash Full Node (`src/`)

The base chain engine and privacy kernel.

- Shielded transactions with zk-SNARK-based privacy primitives
- Private wallet support with spending and viewing key separation
- Consensus, networking, and RPC plumbing
- The long-lived node layer that everything else hangs off

### 2. Dark Protocol (`dark-protocol/`)

The Solana privacy layer and transaction intelligence layer.

- Shielded addresses, notes, commitments, and nullifiers
- Private transfers, unshielding, and swap routing
- Encrypted memos and privacy-preserving metadata
- AI-agent hooks for TEE-secured automation
- Helius and Jupiter integrations for practical execution

### 3. Dark Wallet (`dark-wallet/`)

The browser wallet and user-facing privacy cockpit.

- Shield tokens into private balance
- Unshield tokens back to transparent balance
- Private transfer between shielded addresses
- Wallet connect flows for external wallets
- Modern UI for private balances, route previews, and status

### 4. DarkSwap (`darkswap/`)

The liquidity and routing layer.

- Jupiter quote and swap examples
- Route discovery across Solana liquidity sources
- Reference implementations for swap execution
- A practical place to plug private routing into the wallet and protocol layers

### 5. Legacy Paper Wallet Reference (`paper/`)

Archived Zcash/Sapling reference material retained for porting context.

- Legacy upstream paper-wallet source
- Historical key-format and printable-wallet fixtures
- Not part of the supported public release surface
- Supported Solana paper-wallet flow lives in `dark-wallet/`

### 6. Infrastructure (`helius-sdk-main/`)

The network and delivery layer.

- RPC endpoints and smart transaction support
- Webhooks and asset data APIs
- Priority fee and compute optimization
- A safer way to connect the wallet and protocol to live chain data

### 7. Clawd Agent Control Plane

The operational layer that lets agents run the system with policy.

- Chain health monitoring
- Swap routing recommendations
- Treasury and balance policy
- Security checks and redaction
- Validator and service coordination
- Autonomous operation with explicit guardrails

---

## Repository Map

```ascii
┌─────────────────────────────────────────────────────────────────────┐
│                              ZOLana                                 │
├──────────────────────────────┬──────────────────────────────────────┤
│  Privacy Kernel              │  Agentic Solana Layer                │
│  ─ src/                      │  ─ dark-protocol/                    │
│  ─ depends/                  │  ─ dark-wallet/                      │
│  ─ build-aux/                │  ─ darkswap/                         │
│  ─ zcutil/                   │  ─ paper/                            │
│                              │  ─ dark/                             │
├──────────────────────────────┴──────────────────────────────────────┤
│  Infrastructure + Wallet Ecosystem                                  │
│  ─ helius-sdk-main/  ─ backpack-master/  ─ jupiter-amm-implementation-main/ │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Deep Dive

| Directory | Role | Notes |
|-----------|------|-------|
| `dark/` | Combined product map | Groups wallet, agent, DeFi, and swap surfaces without duplicating source |
| `dark-protocol/` | Core privacy programs | 10+ documented instruction surfaces, private swap flows, AI hooks |
| `src/` | Zcash node and consensus | Privacy kernel, wallet, and RPC foundation |
| `dark-wallet/` | Browser privacy wallet | Vite, React, TypeScript, and modern wallet UX |
| `darkswap/` | Swap routing layer | Jupiter quote and swap integration reference examples |
| `paper/` | Archived reference | Legacy Zcash paper-wallet source kept for historical porting context only |
| `backpack-master/` | Wallet reference | Vendored wallet monorepo for implementation reference only |
| `helius-sdk-main/` | Infra layer | RPC, webhooks, DAS, and smart transaction support |
| `jupiter-amm-implementation-main/` | AMM primitives | Vendored routing and liquidity reference logic |

---

## How It Fits Together

1. Create cold keys locally in `dark-wallet/` for the supported Solana paper-wallet flow; treat `paper/` as archived reference material only.
2. Load the wallet in `dark-wallet/` and connect an external wallet when needed.
3. Shield funds into the privacy pool via `dark-protocol/`.
4. Use `darkswap/` and Jupiter routing to discover the best path.
5. Let Clawd agents watch policy, risk, and chain health.
6. Unshield or privately transfer only when the policy and user intent allow it.

This is not just a set of directories. It is an operating model:

- private by default
- transparent when the user asks for it
- agentic when the policy allows it
- offline when custody matters
- auditable at every boundary

---

## Dark Protocol Surface

The protocol layer is the cryptographic and execution core of the platform.

### Documented instruction surface

| # | Instruction | Purpose |
|---|------------|---------|
| 1 | `initialize_protocol` | Set up protocol state and tree structure |
| 2 | `create_shielded_address` | Derive a shielded address for private activity |
| 3 | `shield_tokens` | Move transparent assets into the private pool |
| 4 | `unshield_tokens` | Release shielded assets back to transparent balance |
| 5 | `private_transfer` | Move value between shielded recipients |
| 6 | `private_swap` | Route swaps through private liquidity paths |
| 7 | `add_to_privacy_pool` | Deposit into privacy pool capacity |
| 8 | `remove_from_privacy_pool` | Withdraw from the privacy pool |
| 9 | `register_ai_agent` | Register a TEE-secured automation agent |
| 10 | `execute_ai_action` | Execute an allowed agent action |

### Cryptographic modules

- Pedersen commitments
- Merkle trees and commitment proofs
- Nullifier-based double-spend prevention
- Note encryption and encrypted memos
- Sapling-style address and key derivation
- Groth16-style proving system integration
- Jupiter routing integration for swap flows

---

## Dark Wallet Surface

The wallet is the part users actually touch, but it is also the policy mirror of the protocol.

- Transparent balance and shielded balance views
- Shield, unshield, and private transfer flows
- Swap preview and route selection
- Wallet adapter support for external wallets
- Private memo support
- Real-time status and ledger history
- A clean visual layer that keeps the privacy system understandable

The wallet should make privacy feel operational, not ceremonial.

---

## DarkSwap Surface

DarkSwap is the route and liquidity intelligence layer.

- Jupiter quote discovery
- Best-route selection across Solana liquidity
- Slippage-aware execution
- Swap examples for Node, Rust, and wallet integration
- Private routing patterns for the protocol layer

This is where liquidity becomes policy.

---

## Paper Wallet / Cold Storage

The supported cold-storage lane is the local Solana paper-wallet flow in
`dark-wallet/`.

- Generate keys without a connected wallet or RPC dependency
- Print or export for physical storage after explicit secret reveal
- Keep high-value keys air-gapped
- Use the archived `paper/` tree only as historical reference material after a
  separate re-audit

For a privacy-first system, cold storage is not optional. The supported path is
the Solana paper-wallet flow, not the archived legacy subtree.

---

## Clawd Agent Control Plane

Clawd agents are the automation layer that lets ZOLana behave like an operating system instead of a static app.

### Agent roles

- `guardian` - checks risk before value moves
- `router` - evaluates swap paths and liquidity health
- `treasurer` - watches reserves and policy thresholds
- `sentinel` - tracks chain health and service uptime
- `operator` - coordinates routine blockchain tasks
- `recovery` - handles fallback and cold-storage workflows

### Operating rules

- Never hide risk, fees, or routing details
- Ask before moving value unless the policy explicitly allows it
- Prefer privacy by default
- Fail closed when inputs are malformed or the route is uncertain
- Keep offline recovery paths available
- Make automation visible, not magical

### Personas

- SOLtoshi: chain operator, routing, and execution persona
- ZOLtoshi: privacy guardian, recovery, and shielded-asset persona

---

## Architecture

```ascii
┌─────────────────────────────────────────────────────────────────────┐
│                         Clawd Agent Layer                           │
│  Policy • Monitoring • Routing • Recovery • Treasury • Automation  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        ZOLana Application Layer                    │
│     dark-wallet  •  dark-protocol  •  darkswap  •  paper          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                   Privacy + Execution Foundation                    │
│   Zcash-style notes • commitments • nullifiers • Solana speed       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        Solana and Infra Layer                       │
│  Helius RPC • Jupiter routing • wallets • validators • APIs         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Performance and Target Specs

These are the platform targets and reference values used across the docs.

| Metric | Value |
|--------|-------|
| Private transaction throughput | ~1,500 TPS target |
| AI agent response time | <1 second target |
| Private swap latency | ~800 ms target |
| Shielded balance representation | compact note-based state |
| ZK proof size | compact Groth16-style proofs |
| Note payload size | Sapling-style note payloads |
| Transaction fee | sub-cent / low-fee target |
| Confirmation speed | Solana-speed execution profile |

---

## Roadmap

```ascii
PHASE 1: FOUNDATION
├── Zcash-style privacy kernel
├── Dark Wallet UI
├── Dark Protocol program surface
├── Jupiter routing integration
├── Offline paper-wallet tooling
└── Clawd agent policy layer

PHASE 2: ADVANCED PRIVACY
├── Stronger proof workflows
├── Privacy pools
├── Better nullifier handling
├── Stronger memo encryption
└── Deeper auditability

PHASE 3: AUTONOMOUS OPERATIONS
├── Chain health sentinels
├── Treasury policy agents
├── Route-aware swap operators
├── Recovery workflows
└── Validator and service orchestration

PHASE 4: EXPANSION
├── Cross-chain bridges
├── Mobile wallet surfaces
├── Hardware wallet support
├── Governance and policy tooling
└── Broader private DeFi suite
```

---

## Building the Beast

### Prerequisites

- Rust toolchain
- Solana CLI
- Anchor
- Node.js 18+
- A wallet for browser-based testing

### Supported public surfaces

```bash
# Clone the repo
git clone https://github.com/Solizardking/ZOLana.git
cd ZOLana

# Run the supported browser wallet
cd dark-wallet
npm install
npm run dev

# Build the supported TypeScript SDK
cd ../dark-protocol/sdk/typescript
pnpm install
pnpm build

# Verify the supported rail worker
cd ../../rail-worker
npm install
npm test
```

### Experimental program work

These commands are for exploration only. They are not the supported public
release path.

```bash
# Zcash-derived root node/tooling reference
make -j$(nproc) || true

# Experimental Anchor program workspace
cd dark-protocol
anchor build
```

### Development mode

```bash
# Supported surfaces
cd dark-wallet && npm run build
cd ../dark-protocol/sdk/typescript && pnpm build
cd ../../dark-protocol/rail-worker && npm test
```

```bash
# Experimental work only
make check || true
cd dark-protocol && anchor test
```

Legacy `paper/` manifests are intentionally excluded from the supported public
release build and kept only as archived reference material.

---

## Safety and Operating Principles

- Privacy is the default, not a premium feature
- Recovery must work offline
- Agent autonomy is bounded by policy
- Swaps should show route and risk before execution
- Cold storage stays cold
- Public visibility is opt-in
- The system should fail safely when in doubt

---

## Component Docs

See the component READMEs for implementation-specific details:

- [`dark-protocol/README.md`](./dark-protocol/README.md)
- [`dark-wallet/README.md`](./dark-wallet/README.md)
- [`darkswap/README.md`](./darkswap/README.md)
- [`paper/README.md`](./paper/README.md)
- [`ZOLANA_PROJECT_SUMMARY.md`](./ZOLANA_PROJECT_SUMMARY.md)

---

## License

This repository combines multiple upstream open-source projects and their respective licenses. See the individual component licenses and source trees for details.

---

ZOLana is the privacy-first, agentic Solana stack.
SOLtoshi runs it. ZOLtoshi protects it.
