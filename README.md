# PixelTip — questions people actually ask me

PixelTip is a tip jar for creators that lives entirely on the Arc testnet: you claim a profile, you get a link, people send you money on it, and you pull that money out whenever you feel like it. No account on my server, no dashboard I control, no payout schedule.

I kept getting the same handful of questions when I showed this to other designers, so I just wrote the answers down. Here they are, in roughly the order people ask them.

### So what is this, in one breath?

A page at `/creator/<your-wallet-address>` that anyone can open and drop you a few coins on. The coins land in a contract, the contract keeps a tab with your name on it, and you sweep the tab into your wallet on your own clock. That's the whole product. Everything below is just the fine print.

### Do I need an account to receive tips?

You need a wallet and one transaction. You call `registerCreator(name, category)` once — that writes your display name and a craft tag (designer, video, 3d, tutor, musician, writer, dev) into the contract and adds you to the public creator list. After that your page exists forever and you never sign up for anything again. There's no email, no password, no profile stored on a database I own. The "account" is just a row in a smart contract keyed to your address.

### Can someone tip me without an account?

Yes — that's the point. The person tipping you doesn't register anything. They open your page, type an amount and an optional message, and call `tip(yourAddress, message)` with the coins attached. The only requirement on their end is a wallet that can talk to Arc. No follower relationship, no platform login, no "create an account to continue."

### Where does the money actually go?

Into the contract, split the instant the transaction lands. Look at the real code:

```solidity
uint256 fee = (msg.value * platformFee) / 10000;
uint256 net = msg.value - fee;
pendingWithdrawals[creator] += net;   // your share, waiting for you
pendingWithdrawals[owner]   += fee;   // the protocol's sliver
```

Your share is credited to a balance the contract holds *for you* — not for me, not for a company. I can't move it, freeze it, or route it anywhere. It sits in `pendingWithdrawals[yourAddress]` until you decide to withdraw. The contract is a vault with your name on a shelf inside it, and you're the only one with the key to that shelf.

### What's the fee?

2.5%. In the contract that's `platformFee = 250`, applied as `amount * 250 / 10000`. So on a 1-coin tip, 0.975 is yours and 0.025 covers the protocol. The contract caps this — `setPlatformFee` reverts above 1000 (10%) — so it can never quietly balloon into the kind of cut a typical platform takes. That ceiling is enforced by the deployed code, not by my promise.

### Why build this on Arc instead of just using a payment app?

Because the tips are tiny, and tiny is exactly where ordinary rails fall apart. A real tip from a real fan is a dollar or two. Run that through a card processor or a "creator platform" and a fixed 30-cent-plus-percentage fee eats a quarter of it before anyone counts the platform's own cut. The economics only work if the cost of *moving* the dollar is a rounding error against the dollar itself.

On Arc the value you tip and the cost to send it are the same native unit, and a transfer costs a sliver of one of these small tips — small enough that a 1-coin tip arrives as ~0.975 instead of ~0.70. There's no separate fee token to acquire first, no minimum payout that traps your earnings until they cross a threshold. For payments this small, that's the difference between the model existing and not. PixelTip isn't a card-rail product wearing a blockchain hat — it's a thing that's only affordable because the settlement cost is this low.

### How fast does a tip show up, and when can I cash out?

The tip is final when the transaction confirms — seconds. There's no clearing window, no "pending for 7 days," no monthly payout run. Your page reads the contract directly and the supporter wall, the leaderboard, and the live feed all update from on-chain data. Cashing out is just another transaction you send whenever the balance is worth sending; see the next answer.

### How do I get my money out?

You call `withdraw()`. It reads your pending balance, zeroes it, and transfers the whole thing to your wallet in one shot:

```solidity
uint256 amount = pendingWithdrawals[msg.sender];
require(amount > 0, "Nothing to withdraw");
pendingWithdrawals[msg.sender] = 0;
payable(msg.sender).transfer(amount);
```

No lock-up, no minimum, no approval from me. This is a pull payment — the contract never pushes money at you, you reach in and take what's yours. Withdraw a hundred times a day or once a year; the contract doesn't care and neither do I.

### Can I take a tip back?

No, and neither can the tipper. Once `tip(...)` confirms, the split has happened and your share is sitting in your withdrawal balance. There's no undo button, no refund function, no dispute queue — the contract simply doesn't have a code path that reverses a completed tip. That's deliberate: a tip you can claw back isn't a tip, and a creator who has to wonder whether today's earnings will vanish tomorrow can't plan around them.

### Is it really on-chain, or is there a server doing the real work?

Really on-chain. The contract is [`0x74d21b54c684f0b78E29D11e3A994C6605C1D545`](https://testnet.arcscan.app/address/0x74d21b54c684f0b78E29D11e3A994C6605C1D545) on Arc testnet (chain `5042002`), and it's verified there — you can open that link and read every function I described above, including the fee math and the withdraw logic, without taking my word for any of it. The website is just a friendly face over that contract: registering, tipping, and withdrawing are all transactions your wallet signs and sends straight to Arc. The stats, the leaderboard, and the activity feed are read live from the chain over a public RPC. There's no private database holding the truth — the chain is the database.

### Is there an AI agent running my profile?

Not yet, and I won't pretend otherwise. The site shows a "PixelAgent" panel marked *coming soon* with a join-the-waitlist button — it's a mockup of an idea, not a running service. There is no autonomous agent script in this repo, and nothing on a server is auto-replying to tips or moving your funds. The only server-side code is a small `/api/verify` route I used once to submit the contract source to ArcScan for verification; it doesn't touch tips or balances. If a real agent ever ships, this answer changes and the code lands in the repo first.

### What do the categories do?

They're a tag, not a gate. When you register you pick one of designer, video, 3d, tutor, musician, writer, or dev, and it shows up as a label on your page and in the leaderboard. It doesn't change your fee or your link or who can tip you — it's just so people skimming the creator list can tell at a glance what you make.

### Can I run it myself?

It's a Next.js app and the only on-chain dependency is the address above. Clone it, `npm install`, `npm run dev`, point a wallet at Arc testnet, and you're talking to the same live contract everyone else is. Nothing about it is hosted-only.

```bash
npm install
npm run dev
```

---

Built by Philippa George. If something here is wrong or unclear, the contract is the source of truth — read it, don't trust me.
