// -----------------------------------------------------------------------------
// ARC Testnet — connection constants + the add/switch helper used by the nav.
// Values here are fixed by the network; only the wrapping changes between builds.
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// Numeric chain id, then its 0x form. toHex keeps the two in lock-step.
const toHex = (n: number) => "0x" + n.toString(16);

export const ARC_CHAIN_ID = 5042002;
export const ARC_CHAIN_HEX = toHex(ARC_CHAIN_ID);

// Public endpoints.
export const ARC_RPC = "https://rpc.testnet.arc.network";
export const ARCSCAN = "https://testnet.arcscan.app";

// EIP-3085 payload handed to wallet_addEthereumChain.
export const ARC_NETWORK_PARAMS = {
  chainId: ARC_CHAIN_HEX,
  chainName: "ARC Testnet",
  nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
  rpcUrls: [ARC_RPC],
  blockExplorerUrls: [ARCSCAN],
};

/**
 * Ensures the wallet knows about ARC Testnet and then makes it the active chain.
 * The switch is always issued, no matter what chain is currently selected.
 */
export async function switchToArc(): Promise<void> {
  const provider = window.ethereum;
  if (!provider) throw new Error("No wallet detected");

  // Adding is idempotent — wallets that already have ARC may reject, which is fine.
  try {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [ARC_NETWORK_PARAMS],
    });
  } catch {
    /* chain already registered — nothing to do */
  }

  // Now flip to ARC.
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: ARC_CHAIN_HEX }],
  });
}
