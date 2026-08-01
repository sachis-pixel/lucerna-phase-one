import type { Metadata } from "next";
import { Cinzel, Quicksand, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Lucerna Academy type system: classical serif for chapter/header voice,
// rounded child-friendly sans for body and dialogue.
const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Lucerna Academy — Power One: The Chaos Forge",
  description: "Become a cyber-alchemist. Learn how AI actually thinks."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${quicksand.variable} ${plexMono.variable}`}>
      <body className="theme-red themed font-rune antialiased">{children}</body>
    </html>
  );
}
