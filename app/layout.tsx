import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

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
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-black text-white`}>
        <div className="flex min-h-screen">
          <aside>
            <Sidebar />
          </aside>
          <main className="flex-1 md:ml-[245px] pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
