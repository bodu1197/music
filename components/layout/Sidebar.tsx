"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User, ShoppingBag, Send, Music2, BarChart2, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab");

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Shop", href: "/shop", icon: ShoppingBag },
        { name: "Messages", href: "/messages", icon: Send },
        { name: "Create", href: "/create", icon: PlusSquare },
        {
            name: "Music",
            href: "/search",
            icon: Music2,
            subItems: [
                { name: "Music Home", href: "/search?tab=music", id: "music", icon: Home },
                { name: "Search", href: "/search?tab=search", id: "search", icon: Search },
                { name: "Charts", href: "/search?tab=charts", id: "charts", icon: BarChart2 },
                { name: "Moods", href: "/search?tab=moods", id: "moods", icon: Sparkles },
            ]
        },
        { name: "Profile", href: "/profile", icon: User },
    ];

    return (
        <div className="hidden md:flex flex-col w-[245px] h-screen fixed left-0 top-0 border-r border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-8 z-50 overflow-y-auto no-scrollbar">
            <Link href="/" className="mb-10 px-4">
                <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">VibeStation</h1>
            </Link>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    // Check if parent is active (includes sub-routes for Music)
                    const isParentActive = pathname === item.href || (item.name === "Music" && pathname === "/search");

                    return (
                        <div key={item.name}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group relative overflow-hidden",
                                    isParentActive && !item.subItems
                                        ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold shadow-lg shadow-[#667eea]/20"
                                        : "text-white/70 hover:text-white hover:bg-[rgba(255,255,255,0.05)]",
                                    isParentActive && item.subItems ? "text-white font-bold" : ""
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-5 h-5 transition-transform group-hover:scale-105",
                                        isParentActive ? "stroke-[2.5px]" : "stroke-[2px]"
                                    )}
                                />
                                <span className={cn("text-base relative z-10", isParentActive ? "font-bold" : "font-normal")}>
                                    {item.name}
                                </span>
                            </Link>

                            {item.subItems && isParentActive && (
                                <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-2">
                                    {item.subItems.map((sub) => {
                                        const SubIcon = sub.icon;
                                        const isActiveSub = currentTab === sub.id || (!currentTab && sub.id === "search");

                                        return (
                                            <Link
                                                key={sub.name}
                                                href={sub.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 text-sm",
                                                    isActiveSub
                                                        ? "text-[#667eea] bg-white/5 font-semibold border-l-2 border-[#667eea]"
                                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <SubIcon className="w-4 h-4" />
                                                <span>{sub.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* More Options / Footer */}
            <div className="px-4 mt-auto">
                <button className="flex items-center gap-4 text-left w-full hover:bg-zinc-900 p-3 rounded-md transition-colors">
                    <div className="w-6 h-6 rounded-full bg-zinc-800" />
                    <span className="text-base">More</span>
                </button>
            </div>
        </div>
    );
}
