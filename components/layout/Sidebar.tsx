"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User, ShoppingBag, Send, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Shop", href: "/shop", icon: ShoppingBag },
        { name: "Messages", href: "/messages", icon: Send },
        { name: "Create", href: "/create", icon: PlusSquare },
        { name: "Music", href: "/search", icon: Music2 },
        { name: "Profile", href: "/profile", icon: User },
    ];

    return (
        <div className="hidden md:flex flex-col w-[245px] h-screen fixed left-0 top-0 border-r border-zinc-800 bg-black px-4 py-8 z-50">
            <Link href="/" className="mb-10 px-4">
                <h1 className="text-2xl font-bold font-heading bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">VibeStation</h1>
            </Link>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group hover:bg-zinc-900",
                                isActive && "font-bold"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-6 h-6 transition-transform group-hover:scale-105",
                                    isActive ? "stroke-[3px]" : "stroke-[2px]"
                                )}
                            />
                            <span className={cn("text-base", isActive ? "font-bold" : "font-normal")}>
                                {item.name}
                            </span>
                        </Link>
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
