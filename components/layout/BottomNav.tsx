"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User, ShoppingBag, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Create", href: "/create", icon: PlusSquare },
        { name: "Shop", href: "/shop", icon: ShoppingBag },
        { name: "Music", href: "/search", icon: Music2 },
        { name: "Profile", href: "/profile", icon: User },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-[60px] bg-[#0c0c1a] border-t border-white/10 z-[1002] flex justify-around items-stretch">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col justify-center items-center flex-1 gap-1 text-[10px] font-medium transition-colors",
                            isActive ? "text-white" : "text-white/60"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
