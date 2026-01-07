"use client";

import { Settings, Grid, Bookmark, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("posts");

    const tabs = [
        { id: "posts", icon: Grid, label: "POSTS" },
        { id: "saved", icon: Bookmark, label: "SAVED" },
        { id: "tagged", icon: UserSquare2, label: "TAGGED" },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 mb-12">
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-zinc-800 flex-shrink-0 relative overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                            <span className="text-4xl">👤</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        <h1 className="text-xl font-normal">{user?.user_metadata?.username || "username"}</h1>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="h-8 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white">
                                Edit profile
                            </Button>
                            <Button variant="secondary" className="h-8 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white">
                                View archive
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-white p-0">
                                <Settings className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-8 mb-4 text-sm">
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> posts
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> followers
                        </div>
                        <div className="text-center md:text-left">
                            <span className="font-bold">0</span> following
                        </div>
                    </div>

                    <div className="text-center md:text-left text-sm">
                        <div className="font-bold">{user?.user_metadata?.full_name || "Full Name"}</div>
                        <div className="text-zinc-300 whitespace-pre-wrap">
                            Music Lover 🎵
                            Global Vibe 🌍
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlights */}
            <div className="flex gap-4 mb-12 overflow-x-auto pb-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700" />
                        <span className="text-xs">Highlight</span>
                    </div>
                ))}
                <div className="flex flex-col items-center gap-1 min-w-[70px]">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                        <span className="text-2xl">+</span>
                    </div>
                    <span className="text-xs">New</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-zinc-800">
                <div className="flex justify-center gap-12">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 h-12 text-xs font-semibold tracking-widest border-t transition-colors",
                                    isActive ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <Icon className="w-3 h-3" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {activeTab === "posts" && (
                    <div className="grid grid-cols-3 gap-1">
                        <div className="col-span-3 py-20 flex flex-col items-center justify-center text-zinc-500">
                            <div className="w-16 h-16 border-2 border-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Grid className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Share Photos</h2>
                            <p className="mb-4">When you share photos, they will appear on your profile.</p>
                            <Button variant="ghost" className="text-blue-400 font-bold p-0 hover:bg-transparent hover:text-blue-300">
                                Share your first photo
                            </Button>
                        </div>
                    </div>
                )}

                {(activeTab === "saved" || activeTab === "tagged") && (
                    <div className="py-20 text-center text-zinc-500">
                        <p>No content yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
