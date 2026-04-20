import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AWS SAA Study",
  description: "AWS Solutions Architect Associate 2주 완성 학습 도구",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SAA Study",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1625",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
