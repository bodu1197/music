"use client";

import useSWR from "swr";
import { api } from "@/lib/api";

interface MusicTabProps {
    country: { code: string; name: string; lang: string };
}

export function MusicTab({ country }: MusicTabProps) {
    const { data, error, isLoading } = useSWR(
        ["/music/home", country.code, country.lang],
        () => api.music.home(100, country.code, country.lang),
        {
            revalidateOnFocus: false, // Don't refetch just by clicking window
            dedupingInterval: 60000, // Cache for 1 minute
            keepPreviousData: true, // Keep showing old data while fetching new country
        }
    );

    if (isLoading && !data) return <div className="py-20 text-center text-zinc-500 animate-pulse">Loading vibes for {country.name || country.code}...</div>;
    if (error) return <div className="py-20 text-center text-red-500">Error: {error.message || "Failed to load"}</div>;

    const sections = Array.isArray(data) ? data : [];

    if (sections.length === 0) {
        return (
            <div className="py-20 text-center">
                <p className="text-zinc-400 mb-2">No music data found.</p>
                <p className="text-xs text-zinc-600">Try again later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {sections.map((shelf: any, sIndex: number) => {
                if (!shelf || !shelf.contents || !Array.isArray(shelf.contents)) return null;

                return (
                    <div key={sIndex} className="mb-8 pl-1">
                        {/* Section Title */}
                        {shelf.title && <h2 className="mb-3 text-lg font-bold text-zinc-100">{shelf.title}</h2>}

                        {/* Horizontal Scroll Container */}
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-4">
                            {shelf.contents.map((item: any, i: number) => {
                                if (!item) return null;
                                const title = item.title || "No Title";
                                const subtitle = item.artists ? item.artists.map((a: any) => a.name).join(", ") : "Unknown";
                                const image = item.thumbnails ? item.thumbnails[item.thumbnails.length - 1].url : null;
                                const key = item.videoId || item.browseId || `item-${sIndex}-${i}`;

                                if (!image) return null;

                                return (
                                    <div key={key} className="flex-none w-[140px] group cursor-pointer">
                                        {/* Image */}
                                        <div className="relative aspect-square w-full mb-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                                            <img
                                                src={image}
                                                alt={title}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Text Info */}
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">{title}</h3>
                                            <p className="text-xs text-zinc-400 truncate">{subtitle}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
