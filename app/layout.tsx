import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelTip — Creative Studio & English Tutor",
  description:
    "Philippa George — freelance designer with 7 years of experience. Graphics, video, 3D production, and English tutoring.",
  keywords: "freelance designer, graphics, video, 3D, English tutor, PixelTip",
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
