"use client";

import { Play, Heart, MoreHorizontal, Clock } from "lucide-react";

export default function AlbumPage({ params }: Readonly<{ params: { id: string } }>) {
    return (
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-48 h-48 md:w-60 md:h-60 bg-zinc-800 shadow-xl mx-auto md:mx-0">
                    {/* Cover Placeholder */}
                </div>
                <div className="flex flex-col justify-end text-center md:text-left">
                    <span className="text-xs font-bold uppercase text-zinc-400 mb-2">Album</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-4">Album Title</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold">
                        <div className="w-6 h-6 rounded-full bg-zinc-700" />
                        <span>Artist Name</span>
                        <span className="text-zinc-400">• 2023 • 12 songs, 45 min</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-8">
                <button className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center hover:scale-105 transition-transform text-black">
                    <Play className="w-7 h-7 fill-current ml-1" />
                </button>
                <Heart className="w-8 h-8 text-zinc-400 hover:text-white cursor-pointer" />
                <MoreHorizontal className="w-8 h-8 text-zinc-400 hover:text-white cursor-pointer" />
            </div>

            {/* Tracklist */}
            <div className="border-t border-zinc-800">
                <div className="grid grid-cols-[16px_1fr_auto] gap-4 px-4 py-2 text-zinc-400 text-xs border-b border-zinc-900 uppercase">
                    <span>#</span>
                    <span>Title</span>
                    <Clock className="w-4 h-4" />
                </div>
                {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="grid grid-cols-[16px_1fr_auto] gap-4 px-4 py-3 hover:bg-zinc-900/50 rounded-sm cursor-pointer group items-center">
                        <span className="text-zinc-500 group-hover:text-white">{i + 1}</span>
                        <div>
                            <div className="text-base text-white font-medium">Song Title {i + 1}</div>
                            <div className="text-xs text-zinc-400 group-hover:text-white">Artist Name</div>
                        </div>
                        <span className="text-sm text-zinc-500">3:45</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
