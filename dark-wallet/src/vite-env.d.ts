/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly HELIUS_RPC_URL?: string;
  readonly SOLANA_RPC_URL?: string;
  readonly SOLANA_CLUSTER?: string;
  readonly EVM_CHAIN_ID?: string;
  readonly EVM_PRIVATE_PAYMENT_VERIFIER?: string;
  readonly RAIL_WORKER_URL?: string;
  readonly VITE_HELIUS_RPC_URL?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_SOLANA_CLUSTER?: string;
  readonly VITE_EVM_CHAIN_ID?: string;
  readonly VITE_EVM_PRIVATE_PAYMENT_VERIFIER?: string;
  readonly VITE_RAIL_WORKER_URL?: string;
}
