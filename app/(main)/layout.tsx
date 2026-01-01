
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import RightSidebar from "@/components/layout/RightSidebar";
import GlobalPlayer from "@/components/player/GlobalPlayer";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <aside>
                <Sidebar />
            </aside>
            <main className="flex-1 md:ml-[245px] lg:mr-[320px] pb-16 md:pb-0 min-h-screen">
                {children}
            </main>
            <aside className="hidden lg:block">
                <RightSidebar />
            </aside>
            <GlobalPlayer />
            <BottomNav />
        </div>
    );
}
