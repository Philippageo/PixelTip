<div align="center">

<img src="public/logo.svg" alt="PixelTip" width="104" height="104" />

# PixelTip

**On-chain creator tipping on ARC.**
Spin up a profile, share your page, and get tipped in native **ARC** — instantly, transparently, no middleman.

[![Network](https://img.shields.io/badge/ARC-Testnet-00b894?style=flat-square)](https://testnet.arcscan.app)
[![Chain](https://img.shields.io/badge/chain-5042002-00b894?style=flat-square)](https://testnet.arcscan.app)
[![Built with Next.js](https://img.shields.io/badge/Next.js-16-111111?style=flat-square&logo=next.js)](https://nextjs.org)
[![ethers](https://img.shields.io/badge/ethers-v6-111111?style=flat-square)](https://docs.ethers.org)
[![License](https://img.shields.io/badge/license-MIT-00b894?style=flat-square)](#)

### [→ Open the live app](https://pixeltip-brown.vercel.app)

</div>

---

## ✨ The idea

Tipping a creator usually means a platform sitting in the middle — taking a cut, holding your money,
deciding the rules. PixelTip removes the middle.

Anyone can claim a profile on-chain, get a personal page like `pixeltip-brown.vercel.app/creator/0x…`,
and start receiving tips in **ARC** the moment they share the link. Every tip is a real transaction:
no custody, no sign-ups, no waiting for a payout. You can watch the money move on
[ArcScan](https://testnet.arcscan.app) the second it lands.

## 🎯 What you can do

- **Claim a profile** — connect a wallet, pick a name and a craft. One transaction and you're live forever.
- **Share one link** — every creator gets a clean public page with their stats, an identicon, and a tip box.
- **Tip in ARC** — drop a creator some tokens with a message. 97.5% reaches them, 2.5% keeps the lights on.
- **Cheer in public** — each page shows an on-chain wall of supporters and messages.
- **Cash out anytime** — tips pile up in the contract; withdraw to your wallet whenever, no lock-up.
- **Watch it live** — a global activity feed and leaderboard, read straight from the chain.

## 🔁 How it works

```
  ①  REGISTER            ②  SHARE                ③  EARN
  connect · name ·       send your /creator      tips land on-chain ·
  category · 1 tx        link anywhere           withdraw anytime
```

## ⛓ On ARC

Built natively on ARC Testnet, where tips settle in seconds and every action is public and verifiable.

|              |                                                                                  |
| ------------ | -------------------------------------------------------------------------------- |
| Network      | ARC Testnet · chain `5042002`                                                    |
| Contract     | [`0x74d21b54c684f0b78E29D11e3A994C6605C1D545`](https://testnet.arcscan.app/address/0x74d21b54c684f0b78E29D11e3A994C6605C1D545) |
| Platform fee | 2.5%                                                                             |
| Custody      | None — funds live in the smart contract, controlled by the creator              |

The `PixelTip` contract is written in Solidity and verified on ArcScan, so anyone can read exactly
what happens to a tip.

## 🛠 Under the hood

`Next.js 16` · `React 19` · `ethers v6` · native ARC RPC for read-only browsing · dependency-free
identicons generated from each wallet address.

<div align="center">
<sub>Made with 🩵 for creators on ARC.</sub>
</div>
