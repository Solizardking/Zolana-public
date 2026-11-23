export type DarkNetwork = "devnet" | "mainnet-beta";

export interface DarkRuntimeConfig {
  heliusRpcUrl?: string;
  solanaRpcUrl?: string;
  evmChainId: number;
  evmPrivatePaymentVerifier?: string;
  railWorkerUrl?: string;
  defaultNetwork: DarkNetwork;
}

function readEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeNetwork(value?: string | null): DarkNetwork {
  return value === "mainnet-beta" ? "mainnet-beta" : "devnet";
}

export function formatNetworkLabel(network: DarkNetwork): string {
  return network === "mainnet-beta" ? "Mainnet Beta" : "Devnet";
}

export function getDarkRuntimeConfig(): DarkRuntimeConfig {
  const heliusRpcUrl = readEnv("HELIUS_RPC_URL") || readEnv("VITE_HELIUS_RPC_URL");
  const solanaRpcUrl = readEnv("SOLANA_RPC_URL") || readEnv("VITE_SOLANA_RPC_URL");
  const evmChainIdValue = readEnv("EVM_CHAIN_ID") || readEnv("VITE_EVM_CHAIN_ID") || "1";
  const evmChainId = Number.parseInt(evmChainIdValue, 10);
  const evmPrivatePaymentVerifier =
    readEnv("EVM_PRIVATE_PAYMENT_VERIFIER") || readEnv("VITE_EVM_PRIVATE_PAYMENT_VERIFIER");
  const railWorkerUrl = readEnv("RAIL_WORKER_URL") || readEnv("VITE_RAIL_WORKER_URL");

  const defaultNetwork = normalizeNetwork(
    readEnv("SOLANA_CLUSTER") ||
      readEnv("VITE_SOLANA_CLUSTER") ||
      ((heliusRpcUrl || solanaRpcUrl).includes("mainnet") ? "mainnet-beta" : "devnet"),
  );

  return {
    heliusRpcUrl: heliusRpcUrl || undefined,
    solanaRpcUrl: solanaRpcUrl || undefined,
    evmChainId: Number.isFinite(evmChainId) ? evmChainId : 1,
    evmPrivatePaymentVerifier: evmPrivatePaymentVerifier || undefined,
    railWorkerUrl: railWorkerUrl || undefined,
    defaultNetwork,
  };
}

export function resolveSolanaRpcUrl(
  network: DarkNetwork,
  config: Pick<DarkRuntimeConfig, "heliusRpcUrl" | "solanaRpcUrl"> = {},
): string {
  const direct = config.heliusRpcUrl?.trim() || config.solanaRpcUrl?.trim();
  if (direct) {
    return direct;
  }

  return network === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
}
