"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import MusicSection, { MusicSectionData } from "@/components/music/MusicSection";
import { Loader2 } from "lucide-react";

export default function ExplorePage() {
    const [sections, setSections] = useState<MusicSectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHome() {
            try {
                setLoading(true);
                setError(null);

                // Fetch home data from API
                const data = await api.music.home(100, "US", "en");

                // The API returns an array of sections
                if (Array.isArray(data)) {
                    setSections(data);
                } else {
                    setError("Unexpected data format");
                }
            } catch (err) {
                console.error("Failed to fetch home:", err);
                setError("Failed to load music. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchHome();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#667eea] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="py-6">
            {/* Page Title */}
            <h1 className="text-2xl font-bold text-white mb-6 px-4">
                Explore Music
            </h1>

            {/* Music Sections */}
            {sections.map((section, index) => (
                <MusicSection
                    key={`${section.title}-${index}`}
                    section={section}
                />
            ))}

            {sections.length === 0 && !loading && (
                <div className="text-center text-zinc-500 py-20">
                    No music sections available
                </div>
            )}
        </div>
    );
}
