import { Keypair } from "@solana/web3.js";
import type { DarkNetwork } from "./runtime";

export interface SolanaPaperWallet {
  label: string;
  network: DarkNetwork;
  createdAt: number;
  publicKey: string;
  secretKey: number[];
  secretKeyJson: string;
  seedFingerprint: string;
  publicFingerprint: string;
  entropyNote: string;
}

export interface SolanaPaperWalletOptions {
  label?: string;
  network?: DarkNetwork;
  entropy?: string;
}

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requireWebCrypto(): Crypto {
  const webCrypto = globalThis.crypto;
  if (
    !webCrypto
    || typeof webCrypto.getRandomValues !== "function"
    || !webCrypto.subtle
    || typeof webCrypto.subtle.digest !== "function"
  ) {
    throw new Error("Secure Web Crypto is required to generate a Solana paper wallet");
  }

  return webCrypto;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  requireWebCrypto().getRandomValues(bytes);
  return bytes;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const source = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await requireWebCrypto().subtle.digest("SHA-256", source);
  return new Uint8Array(digest);
}

async function deriveSeed(
  label: string,
  network: DarkNetwork,
  entropy: string,
): Promise<Uint8Array> {
  const randomSalt = randomBytes(32);
  const payload = textEncoder.encode([
    "dark-wallet-paper",
    label,
    network,
    entropy.trim(),
    bytesToHex(randomSalt),
    Date.now().toString(16),
  ].join("\n"));

  return (await sha256(payload)).slice(0, 32);
}

function fingerprint(bytes: Uint8Array, length = 12): string {
  return bytesToHex(bytes).slice(0, length).toUpperCase();
}

function normalizeLabel(label?: string): string {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Dark Solana paper wallet";
}

export async function generateSolanaPaperWallet(
  options: SolanaPaperWalletOptions = {},
): Promise<SolanaPaperWallet> {
  const label = normalizeLabel(options.label);
  const network = options.network ?? "devnet";
  const entropy = options.entropy?.trim() ?? "";
  const seed = await deriveSeed(label, network, entropy);
  const keypair = Keypair.fromSeed(seed);
  const secretKey = Array.from(keypair.secretKey);
  const secretKeyJson = JSON.stringify(secretKey, null, 2);
  const publicKeyBytes = keypair.publicKey.toBytes();

  return {
    label,
    network,
    createdAt: Date.now(),
    publicKey: keypair.publicKey.toBase58(),
    secretKey,
    secretKeyJson,
    seedFingerprint: fingerprint(seed),
    publicFingerprint: fingerprint(publicKeyBytes),
    entropyNote: entropy ? "custom entropy + local randomness" : "local randomness only",
  };
}

export function serializeSolanaPaperWallet(wallet: SolanaPaperWallet): string {
  return JSON.stringify(wallet, null, 2);
}

export function paperWalletFileName(wallet: SolanaPaperWallet): string {
  const slug = wallet.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "dark-solana-paper-wallet"}-${wallet.network}.json`;
}

export function summarisePaperWallet(wallet: SolanaPaperWallet): string {
  return [
    `Label: ${wallet.label}`,
    `Network: ${wallet.network}`,
    `Public key: ${wallet.publicKey}`,
    `Seed fingerprint: ${wallet.seedFingerprint}`,
    `Public fingerprint: ${wallet.publicFingerprint}`,
  ].join("\n");
}
