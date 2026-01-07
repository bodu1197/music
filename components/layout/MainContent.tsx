"use client";

import { usePathname } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

interface MainContentProps {
    children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
    const pathname = usePathname();
    const { isQueueOpen } = usePlayer();

    const isFullWidthPage = pathname === "/search" || pathname.startsWith("/artist/");

    return (
        <main
            className={cn(
                "flex-1 md:ml-[clamp(200px,18.5vw,280px)] pb-[140px] md:pb-[90px] min-h-screen overflow-x-hidden transition-[margin] duration-300",
                !isFullWidthPage && "lg:pr-[340px]",
                isQueueOpen && "md:mr-[350px] lg:mr-[400px]"
            )}
        >
            {children}
        </main>
    );
}
