"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RightSidebar() {
    const suggestions = [
        { username: "newjeans_official", subtitle: "New to Instagram" },
        { username: "taylorswift", subtitle: "Suggested for you" },
        { username: "theweeknd", subtitle: "Followed by post_malone + 3 more" },
        { username: "billieeilish", subtitle: "Suggested for you" },
        { username: "brunomars", subtitle: "Suggested for you" },
    ];

    return (
        <div className="hidden lg:block w-[320px] pl-10 pr-4 py-8 fixed right-0 top-0 h-screen">
            {/* User Profile Teaser */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-700" />
                    <div className="text-sm">
                        <div className="font-bold">my_username</div>
                        <div className="text-zinc-400">My Name</div>
                    </div>
                </div>
                <button className="text-xs font-bold text-blue-400 hover:text-white">Switch</button>
            </div>

            {/* Suggestions Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-400 font-bold text-sm">Suggested for you</span>
                <button className="text-xs font-bold text-white hover:opacity-50">See All</button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {suggestions.map((user, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800" />
                            <div className="text-xs">
                                <div className="font-bold hover:underline cursor-pointer">{user.username}</div>
                                <div className="text-zinc-400 truncate w-40">{user.subtitle}</div>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-blue-400 hover:text-white">Follow</button>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-10 text-xs text-zinc-500 space-y-4">
                <p className="leading-5">
                    About • Help • Press • API • Jobs • Privacy • Terms • Locations • Language • Meta Verified
                </p>
                <p>© 2026 VIBESTATION FROM DEEPMIND</p>
            </div>
        </div>
    );
}
