"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Heart, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Search", href: "/explore", icon: Search },
        { name: "Create", href: "/create", icon: PlusSquare },
        { name: "Shop", href: "/shop", icon: ShoppingBag },
        { name: "Profile", href: "/profile", icon: User },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-black border-t border-zinc-800 z-50 pb-safe">
            <div className="flex justify-around items-center h-12">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-center w-full h-full"
                        >
                            <Icon
                                className={cn(
                                    "w-6 h-6 transition-transform active:scale-95",
                                    isActive ? "stroke-[3px] text-white" : "stroke-[2px] text-zinc-400"
                                )}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
