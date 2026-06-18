# PixelTip — On-Chain Creator Tipping on ARC Testnet

PixelTip is a decentralized tipping dApp built on **ARC Testnet**. Any creator can
register an on-chain profile in one transaction, get a personal shareable page, and
receive tips in native **ARC** tokens — instantly, transparently, and non-custodially.

> Built as a focused demo to showcase both the ARC network (fast finality, low fees,
> full transparency on ArcScan) and a real end-to-end web3 product.

## What it does

- **Register** — connect a wallet, pick a name + category, one tx writes your profile on-chain.
- **Profile page** — every creator gets `/creator/<address>`: avatar, stats, a tip box, an
  on-chain supporters feed, and a shareable link.
- **Tip** — send ARC to any creator. 97.5% goes to them, 2.5% protocol fee. Settled on-chain.
- **Withdraw** — tips accrue in the contract; creators withdraw anytime. No lock-up, no KYC.
- **Live activity** — a global on-chain tip feed and a creator leaderboard, read straight
  from the contract.
- **Deploy console** — `/deploy` lets you redeploy + auto-verify the contract on ArcScan.

## Smart contract

`PixelTip.sol` — Solidity `^0.8.20`, verified on ArcScan.

| Field | Value |
| --- | --- |
| Network | ARC Testnet |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Contract | `0x74d21b54c684f0b78E29D11e3A994C6605C1D545` |
| Platform fee | 2.5% (250 bps) |

Core methods: `registerCreator(name, category)`, `tip(creator, message) payable`,
`withdraw()`. State is fully readable: `creators`, `creatorList`, `tips`, `totalTips`,
`totalVolume`, `getCreatorsCount`, `getTipsCount`.

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **ethers v6** for wallet + contract interaction
- Read-only data via the public ARC RPC (no wallet needed to browse)
- Deterministic, dependency-free identicon avatars derived from the address

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

You need an EVM wallet (MetaMask / Rabby) and some ARC testnet funds to register or tip.
The app auto-adds and switches to ARC Testnet on connect.

## Project structure

```
app/
  page.tsx                  # directory: register / tip / withdraw / leaderboard / live feed
  creator/[address]/page.tsx# public creator profile + tipping page
  deploy/page.tsx           # deploy + verify console
  api/verify/route.ts       # ArcScan source verification proxy
components/                 # NavBar, Footer, Avatar
lib/
  arcNetwork.ts             # chain config + wallet switch helper
  pixeltip.ts               # contract address, ABI, on-chain read helpers, formatters
```
