"use client";

import { usePathname } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import Link from "next/link";

interface MainContentProps {
    children: React.ReactNode;
}

export default function MainContent({ children }: Readonly<MainContentProps>) {
    const pathname = usePathname();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isQueueOpen } = usePlayer();

    const isFullWidthPage = pathname === "/search" || pathname.startsWith("/artist/") || pathname.startsWith("/cafe/");

    return (
        <main
            className={cn(
                "flex-1 md:ml-[clamp(200px,18.5vw,280px)] pb-[140px] md:pb-[90px] min-h-screen overflow-x-hidden",
                !isFullWidthPage && "lg:pr-[340px]"
            )}
        >
            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0f0f23]/95 backdrop-blur-sm sticky top-0 z-40 border-b border-white/5">
                <Link href="/">
                    <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">VibeStation</h1>
                </Link>
                <NotificationBell />
            </div>
            {children}
        </main>
    );
}
