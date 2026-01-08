"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import RightSidebar from "@/components/layout/RightSidebar";
import GlobalPlayer from "@/components/player/GlobalPlayer";
import MobilePlayer from "@/components/player/MobilePlayer";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import MainContent from "@/components/layout/MainContent";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { AppPreloader } from "@/components/preload/AppPreloader";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const isFullWidthPage = pathname === "/search" || pathname.startsWith("/artist/");

    return (
        <PlayerProvider>
            <LibraryProvider>
                <AppPreloader />
                <div className="flex min-h-screen">
                    <aside>
                        <Suspense fallback={null}>
                            <Sidebar />
                        </Suspense>
                    </aside>
                    <MainContent>
                        {children}
                    </MainContent>
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
                <AddToLibraryModal />
            </LibraryProvider>
        </PlayerProvider>
    );
}
