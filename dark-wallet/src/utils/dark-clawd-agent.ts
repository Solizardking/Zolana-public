export type DarkClawdPaymentRail = "x402" | "ap2" | "m2m";
export type DarkClawdPaymentSettlement = "solana" | "evm";
export type DarkClawdPaymentProofLayer = "solana" | "evm";
export type DarkClawdPlanRisk = "low" | "medium" | "high";

export interface DarkClawdRailPlanContext {
  network: string;
  amountSol: number;
  recipientFingerprint: string;
  memoFingerprint?: string;
  rail: DarkClawdPaymentRail;
  settlement: DarkClawdPaymentSettlement;
  proofLayer: DarkClawdPaymentProofLayer;
  durableReceipt: boolean;
  heliusConfigured: boolean;
  evmChainId: number;
  evmVerifierConfigured: boolean;
  railWorkerConfigured: boolean;
  hasSolanaAnchor?: boolean;
  solanaAnchorVerified?: boolean;
  railWorkerMode?: string;
  railWorkerSettlementStatus?: string;
  operatorPrompt?: string;
}

export interface DarkClawdRailPlan {
  recommendedRail: DarkClawdPaymentRail;
  recommendedSettlement: DarkClawdPaymentSettlement;
  recommendedProofLayer: DarkClawdPaymentProofLayer;
  requireDurableReceipt: boolean;
  risk: DarkClawdPlanRisk;
  summary: string;
  actionItems: string[];
  cautions: string[];
}

function scoreRisk(actionItems: string[], cautions: string[]): DarkClawdPlanRisk {
  if (actionItems.length >= 3 || cautions.some((caution) => caution.includes("Do not submit"))) {
    return "high";
  }

  if (actionItems.length > 0 || cautions.length > 1) {
    return "medium";
  }

  return "low";
}

export function fingerprintPublicValue(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "empty";
  }

  let hash = 0x811c9dc5;
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}#${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createDarkClawdRailPlan(context: DarkClawdRailPlanContext): DarkClawdRailPlan {
  const actionItems: string[] = [];
  const cautions: string[] = [];
  let recommendedRail = context.rail;
  let recommendedSettlement = context.settlement;
  let recommendedProofLayer = context.proofLayer;

  if (!context.durableReceipt) {
    actionItems.push("Enable durable non-ephemeral receipt storage before anchoring or exporting rail auth.");
  }

  if (!context.heliusConfigured) {
    actionItems.push("Configure HELIUS_RPC_URL or SOLANA_RPC_URL before mainnet-beta use.");
  }

  if (!context.hasSolanaAnchor) {
    actionItems.push("Anchor the receipt as a wallet-signed Solana Memo before rail submission.");
  } else if (!context.solanaAnchorVerified) {
    actionItems.push("Verify the Solana Memo anchor before EVM proof signing or rail-worker submission.");
  }

  if (!context.railWorkerConfigured) {
    actionItems.push("Set RAIL_WORKER_URL for direct x402/AP2/M2M authorization submission.");
  }

  if (!context.evmVerifierConfigured) {
    actionItems.push("Set EVM_PRIVATE_PAYMENT_VERIFIER before relying on EVM consume-once intent proofing.");
  }

  if (context.amountSol >= 1 || context.network === "mainnet-beta") {
    recommendedProofLayer = "evm";
    recommendedSettlement = "evm";
    recommendedRail = context.rail === "x402" ? "ap2" : context.rail;
    cautions.push("High-value or mainnet flow should use AP2/M2M-style mandates plus EVM consume-once proofing.");
  }

  if (context.amountSol < 0.05 && context.network !== "mainnet-beta") {
    recommendedRail = "x402";
    recommendedSettlement = "solana";
    cautions.push("Small devnet test flow can stay on x402/Solana intent mode until backend settlement is configured.");
  }

  if (context.rail === "m2m" && !context.railWorkerConfigured) {
    cautions.push("Do not submit M2M sessions without a reachable rail worker and replay ledger.");
  }

  if (context.settlement === "evm" && !context.evmVerifierConfigured) {
    cautions.push("EVM settlement/proof mode is incomplete until the verifier contract address is configured.");
  }

  if (context.railWorkerMode === "intent-only") {
    cautions.push("Rail worker is in intent-only mode; this proves authorization but does not claim final settlement.");
  }

  if (context.railWorkerSettlementStatus && context.railWorkerSettlementStatus !== "settled") {
    cautions.push(`Rail settlement status is ${context.railWorkerSettlementStatus}; keep the receipt queued.`);
  }

  if (actionItems.length === 0) {
    actionItems.push("Proceed: stage receipt, anchor on Solana, verify Memo, export/sign EVM proof, then submit rail auth.");
  }

  const risk = scoreRisk(actionItems, cautions);

  return {
    recommendedRail,
    recommendedSettlement,
    recommendedProofLayer,
    requireDurableReceipt: true,
    risk,
    summary: `Use ${recommendedRail.toUpperCase()} with ${recommendedSettlement.toUpperCase()} settlement and ${recommendedProofLayer.toUpperCase()} proofing on ${context.network}.`,
    actionItems,
    cautions,
  };
}

export function formatDarkClawdRailPlan(plan: DarkClawdRailPlan): string {
  return [
    `Risk: ${plan.risk.toUpperCase()}`,
    plan.summary,
    `Recommended: rail=${plan.recommendedRail}, settlement=${plan.recommendedSettlement}, proof=${plan.recommendedProofLayer}, durable=${plan.requireDurableReceipt ? "yes" : "no"}`,
    "",
    "Action items:",
    ...plan.actionItems.map((item) => `- ${item}`),
    "",
    "Cautions:",
    ...(plan.cautions.length > 0 ? plan.cautions.map((item) => `- ${item}`) : ["- No additional cautions from deterministic policy."]),
  ].join("\n");
}
