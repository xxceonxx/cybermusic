import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cybermusic — Make Music Together",
    template: "%s — Cybermusic",
  },
  manifest: "/manifest.json",
  themeColor: "#000000",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  description:
    "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
  openGraph: {
    title: "Cybermusic — Make Music Together",
    description:
      "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
    type: "website",
    siteName: "Cybermusic",
  },
  twitter: {
    card: "summary",
    title: "Cybermusic — Make Music Together",
    description:
      "Create songs, collaborate with musicians worldwide, record in the browser, and mint as NFTs on Base.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-zinc-800/60 py-6 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-500">Cybermusic</span>
                <span>&middot;</span>
                <span>Built on Base</span>
                <span>&middot;</span>
                <span>Stored on IPFS</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/xxceonxx/cybermusic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  GitHub
                </a>
                <a
                  href="https://ethglobal.com/showcase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  ETHGlobal
                </a>
                <span>&copy; {new Date().getFullYear()}</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
