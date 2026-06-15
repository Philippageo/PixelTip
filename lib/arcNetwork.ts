declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// ARC Testnet network config
export const ARC_CHAIN_ID = 5042002;
export const ARC_CHAIN_HEX = "0x" + ARC_CHAIN_ID.toString(16);
export const ARC_RPC = "https://rpc.testnet.arc.network";
export const ARCSCAN = "https://testnet.arcscan.app";

export const ARC_NETWORK_PARAMS = {
  chainId: ARC_CHAIN_HEX,
  chainName: "ARC Testnet",
  nativeCurrency: { name: "ARC", symbol: "ARC", decimals: 18 },
  rpcUrls: [ARC_RPC],
  blockExplorerUrls: [ARCSCAN],
};

/**
 * Adds ARC Testnet to wallet (if not present) and switches to it.
 * Always attempts to switch regardless of current chain.
 */
export async function switchToArc(): Promise<void> {
  if (!window.ethereum) throw new Error("No wallet detected");

  // First try to add the network (safe to call even if already added)
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ARC_NETWORK_PARAMS],
    });
  } catch {
    // Some wallets throw if chain already exists — ignore
  }

  // Then force switch
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: ARC_CHAIN_HEX }],
  });
}
