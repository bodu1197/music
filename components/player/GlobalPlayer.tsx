"use client";

import { usePathname } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function GlobalPlayer() {
    const pathname = usePathname();
    const [isPlaying, setIsPlaying] = useState(false);

    // Hide player on login/signup pages if they somehow wrap this (but they don't, they have different layout)
    // However, if we put this in RootLayout, we need to hide it. 
    // But we decided to put it in MainLayout.

    return (
        <div className="fixed bottom-[49px] md:bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 z-50 h-16 flex items-center px-4 md:pl-[245px] md:pr-[320px]">
            {/* Song Info */}
            <div className="flex items-center gap-3 w-1/3">
                <div className="w-10 h-10 bg-zinc-700 rounded-md" />
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Song Title</span>
                    <span className="text-[10px] text-zinc-400">Artist Name</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center justify-center flex-1">
                <div className="flex items-center gap-6">
                    <SkipBack className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer fill-current" />
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ?
                            <Pause className="w-5 h-5 text-black fill-current" /> :
                            <Play className="w-5 h-5 text-black fill-current ml-0.5" />
                        }
                    </button>
                    <SkipForward className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer fill-current" />
                </div>
                {/* Progress Bar */}
                <div className="w-full max-w-sm mt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <span>0:00</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full">
                        <div className="w-1/3 h-full bg-white rounded-full" />
                    </div>
                    <span>3:45</span>
                </div>
            </div>

            {/* Volume */}
            <div className="w-1/3 flex justify-end">
                <Volume2 className="w-5 h-5 text-zinc-400" />
            </div>
        </div>
    );
}
