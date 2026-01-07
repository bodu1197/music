"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import RightSidebar from "@/components/layout/RightSidebar";
import GlobalPlayer from "@/components/player/GlobalPlayer";
import MobilePlayer from "@/components/player/MobilePlayer";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AppPreloader } from "@/components/preload/AppPreloader";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isFullWidthPage = pathname === "/search" || pathname.startsWith("/artist/");

    return (
        <PlayerProvider>
            <AppPreloader />
            <div className="flex min-h-screen">
                <aside>
                    <Sidebar />
                </aside>
                <main className={`flex-1 md:ml-[245px] ${isFullWidthPage ? '' : 'lg:pr-[340px]'} pb-[140px] md:pb-[90px] min-h-screen overflow-x-hidden`}>
                    {children}
                </main>
                {!isFullWidthPage && (
                    <aside className="hidden lg:block">
                        <RightSidebar />
                    </aside>
                )}
                <PlayerSidebar />
                <GlobalPlayer />
                <MobilePlayer />
                <BottomNav />
            </div>
        </PlayerProvider>
    );
}
