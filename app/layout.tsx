import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PrefetchProvider } from "@/contexts/PrefetchContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  preload: false, // Only used for logo, not critical for initial render
});

export const metadata: Metadata = {
  title: "VibeStation | Global Music Fandom SNS",
  description: "Instagram 100% + Music Sharing + Personal Shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-[#0f0f23] text-white`}>
        <AuthProvider>
          <PrefetchProvider>
            {children}
          </PrefetchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
