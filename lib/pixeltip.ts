import { ethers } from "ethers";
import { ARC_RPC } from "./arcNetwork";

// ─────────────────────────────────────────────────────────────
// PixelTip — on-chain creator tipping on ARC Testnet
// Single source of truth for the deployed contract.
// Verified on ArcScan · solc 0.8.20 · platform fee 2.5%
// ─────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = "0x74d21b54c684f0b78E29D11e3A994C6605C1D545";

export const PIXELTIP_ABI = [
  "function owner() view returns (address)",
  "function totalTips() view returns (uint256)",
  "function totalVolume() view returns (uint256)",
  "function platformFee() view returns (uint256)",
  "function getCreatorsCount() view returns (uint256)",
  "function getTipsCount() view returns (uint256)",
  "function creators(address) view returns (string name, string category, bool active, uint256 tipsReceived, uint256 volumeReceived)",
  "function pendingWithdrawals(address) view returns (uint256)",
  "function creatorList(uint256) view returns (address)",
  "function tips(uint256) view returns (address sender, address creator, uint256 amount, uint256 timestamp, string message)",
  "function registerCreator(string name, string category) external",
  "function tip(address creator, string message) external payable",
  "function withdraw() external",
  "event TipSent(address indexed sender, address indexed creator, uint256 amount, string message)",
  "event CreatorRegistered(address indexed creator, string name, string category)",
  "event Withdrawn(address indexed creator, uint256 amount)",
];

export const CATEGORIES = ["designer", "video", "3d", "tutor", "musician", "writer", "dev"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CAT_LABELS: Record<string, string> = {
  designer: "GRAPHIC DESIGN",
  video: "VIDEO",
  "3d": "3D / VFX",
  tutor: "TUTOR",
  musician: "MUSIC",
  writer: "WRITER",
  dev: "DEV",
};

export const CAT_ICON: Record<string, string> = {
  designer: "🎨",
  video: "🎬",
  "3d": "🧊",
  tutor: "📚",
  musician: "🎵",
  writer: "✍️",
  dev: "💻",
};

export interface Creator {
  address: string;
  name: string;
  category: string;
  active: boolean;
  tipsReceived: bigint;
  volumeReceived: bigint;
}

export interface TipRecord {
  index: number;
  sender: string;
  creator: string;
  amount: bigint;
  timestamp: number; // unix seconds
  message: string;
}

export interface PlatformStats {
  tips: bigint;
  volume: bigint;
  creators: bigint;
  fee: bigint; // basis points
}

// ── Read-only helpers (public RPC, no wallet needed) ──────────
export function readProvider() {
  return new ethers.JsonRpcProvider(ARC_RPC);
}

export function readContract(provider?: ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, PIXELTIP_ABI, provider ?? readProvider());
}

/**
 * Run `fn` over `items` with bounded concurrency, tolerating individual
 * failures. A single throttled/dropped RPC call no longer rejects the whole
 * batch — successful results are returned, failed ones are skipped.
 */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const settled = await Promise.allSettled(items.slice(i, i + limit).map(fn));
    for (const s of settled) if (s.status === "fulfilled") out.push(s.value);
  }
  return out;
}

export async function fetchStats(contract?: ethers.Contract): Promise<PlatformStats> {
  const c = contract ?? readContract();
  const [tips, volume, fee, creators] = await Promise.all([
    c.totalTips(),
    c.totalVolume(),
    c.platformFee(),
    c.getCreatorsCount(),
  ]);
  return { tips, volume, fee, creators };
}

export async function fetchCreators(limit = 50, contract?: ethers.Contract): Promise<Creator[]> {
  const c = contract ?? readContract();
  const count = Number(await c.getCreatorsCount());
  const n = Math.min(count, limit);
  const idxs = Array.from({ length: n }, (_, i) => i);
  const addrs = await mapLimit(idxs, 10, (i) => c.creatorList(i) as Promise<string>);
  const raw = await mapLimit(addrs, 10, async (addr: string) => {
    const d = await c.creators(addr);
    return {
      address: addr,
      name: d.name,
      category: d.category,
      active: d.active,
      tipsReceived: d.tipsReceived,
      volumeReceived: d.volumeReceived,
    } as Creator;
  });
  return raw.filter((cr) => cr.active);
}

export async function fetchCreator(addr: string, contract?: ethers.Contract): Promise<Creator | null> {
  if (!ethers.isAddress(addr)) return null;
  const c = contract ?? readContract();
  const d = await c.creators(addr);
  if (!d.active) return null;
  return {
    address: ethers.getAddress(addr),
    name: d.name,
    category: d.category,
    active: d.active,
    tipsReceived: d.tipsReceived,
    volumeReceived: d.volumeReceived,
  };
}

/**
 * Read recent tips straight from the on-chain `tips` array (no log-range
 * limits, works on any RPC). Scans the tail of the array and optionally
 * filters by creator.
 */
export async function fetchTips(
  opts: { creator?: string; max?: number; scan?: number } = {},
  contract?: ethers.Contract
): Promise<TipRecord[]> {
  const { creator, max = 15, scan = 80 } = opts;
  const c = contract ?? readContract();
  const count = Number(await c.getTipsCount());
  if (!count) return [];
  const start = Math.max(0, count - scan);
  const idxs: number[] = [];
  for (let i = count - 1; i >= start; i--) idxs.push(i);
  const raw = await mapLimit(idxs, 10, async (i) => {
    const t = await c.tips(i);
    return {
      index: i,
      sender: t.sender,
      creator: t.creator,
      amount: t.amount,
      timestamp: Number(t.timestamp),
      message: t.message,
    } as TipRecord;
  });
  // mapLimit may reorder slightly across chunks — keep strict newest-first.
  raw.sort((a, b) => b.index - a.index);
  const filtered = creator
    ? raw.filter((t) => t.creator.toLowerCase() === creator.toLowerCase())
    : raw;
  return filtered.slice(0, max);
}

/**
 * A creator's FULL tip history via the indexed `TipSent(_, creator)` event —
 * not limited to the tail of the global `tips` array, so the supporters feed
 * cannot silently under-count. Falls back to a wide array scan if the RPC
 * rejects the log query (e.g. block-range limits).
 */
export async function fetchCreatorTips(
  creator: string,
  max = 30,
  contract?: ethers.Contract
): Promise<TipRecord[]> {
  if (!ethers.isAddress(creator)) return [];
  const provider = readProvider();
  const c = contract ?? readContract(provider);
  try {
    const filter = c.filters.TipSent(null, creator); // creator is indexed
    const logs = (await c.queryFilter(filter)) as ethers.EventLog[];
    const recent = logs.slice(-max).reverse();
    const out = await mapLimit(recent, 8, async (lg) => {
      const a = lg.args as unknown as {
        sender: string;
        creator: string;
        amount: bigint;
        message: string;
      };
      const block = await provider.getBlock(lg.blockNumber);
      return {
        index: lg.blockNumber * 1_000_000 + (lg.index ?? 0),
        sender: a.sender,
        creator: a.creator,
        amount: a.amount,
        timestamp: block ? Number(block.timestamp) : 0,
        message: a.message,
      } as TipRecord;
    });
    out.sort((a, b) => b.index - a.index);
    return out.slice(0, max);
  } catch {
    // RPC refused the log range — degrade to scanning the array tail.
    return fetchTips({ creator, max, scan: 400 }, c);
  }
}

// ── Formatting helpers ────────────────────────────────────────
export function shortAddr(addr: string, lead = 6, tail = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function fmtArc(wei: bigint, dp = 4): string {
  return parseFloat(ethers.formatEther(wei)).toFixed(dp);
}

export function timeAgo(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
