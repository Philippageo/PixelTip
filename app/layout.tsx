import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelTip — On-Chain Creator Tipping on ARC Testnet",
  description:
    "Register a creator profile, get your own shareable page, and receive tips in native ARC tokens — instantly, transparently, and non-custodially on ARC Testnet.",
  keywords:
    "ARC testnet, creator tipping, web3 tips, on-chain, ARC network, PixelTip, crypto creators, smart contract",
  openGraph: {
    title: "PixelTip — On-Chain Creator Tipping on ARC",
    description:
      "Decentralized creator tipping on ARC Testnet. Register, share your page, get tipped in ARC.",
    siteName: "PixelTip",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="scanline" />
        {children}
      </body>
    </html>
  );
}
