import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const nunitoSans = Nunito_Sans({variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real-Time Transcription",
  description: "Real-time speech-to-text transcription powered by Faster-Whisper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <header className="border-b border-border">
          <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              🎙️ Transcription
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/"
                className="hover:text-primary transition-colors"
              >
                Record
              </Link>
              <Link
                href="/sessions"
                className="hover:text-primary transition-colors"
              >
                Sessions
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
