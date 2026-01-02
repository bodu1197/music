import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import RightSidebar from "@/components/layout/RightSidebar";
import GlobalPlayer from "@/components/player/GlobalPlayer";
import PlayerSidebar from "@/components/player/PlayerSidebar";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MoodsPreloader } from "@/components/preload/MoodsPreloader";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <PlayerProvider>
            <MoodsPreloader />
            <div className="flex min-h-screen">
                <aside>
                    <Sidebar />
                </aside>
                <main className="flex-1 md:ml-[245px] lg:pr-[340px] pb-[139px] md:pb-[90px] min-h-screen overflow-x-hidden">
                    {children}
                </main>
                <aside className="hidden lg:block">
                    <RightSidebar />
                </aside>
                <PlayerSidebar />
                <GlobalPlayer />
                <BottomNav />
            </div>
        </PlayerProvider>
    );
}
