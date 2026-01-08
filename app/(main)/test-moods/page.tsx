"use client";

import { useState } from "react";

interface RawMoodData {
    country: string;
    language: string;
    timestamp: string;
    raw_response: unknown;
}

const TEST_COUNTRIES = [
    { code: "US", lang: "en", name: "United States" },
    { code: "KR", lang: "ko", name: "South Korea" },
    { code: "JP", lang: "ja", name: "Japan" },
    { code: "TW", lang: "zh_TW", name: "Taiwan" },
    { code: "VN", lang: "en", name: "Vietnam" },
    { code: "TH", lang: "en", name: "Thailand" },
    { code: "PH", lang: "en", name: "Philippines" },
    { code: "SG", lang: "en", name: "Singapore" },
    { code: "MY", lang: "en", name: "Malaysia" },
    { code: "HK", lang: "zh_TW", name: "Hong Kong" },
    { code: "DE", lang: "de", name: "Germany" },
    { code: "BR", lang: "pt", name: "Brazil" },
    { code: "IN", lang: "hi", name: "India" },
    { code: "FR", lang: "fr", name: "France" },
];

export default function TestMoodsPage() {
    const [selectedCountry, setSelectedCountry] = useState(TEST_COUNTRIES[0]);
    const [data, setData] = useState<RawMoodData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRawMoods = async () => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            // Call the raw test API endpoint
            const res = await fetch(
                `/api/test/raw-moods?country=${selectedCountry.code}&language=${selectedCountry.lang}`
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-white mb-2">
                Raw ytmusicapi Moods Test
            </h1>
            <p className="text-zinc-400 mb-6">
                Pure ytmusicapi get_mood_categories() response - no caching, no processing
            </p>

            {/* Country Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {TEST_COUNTRIES.map((c) => (
                    <button
                        key={c.code}
                        onClick={() => setSelectedCountry(c)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedCountry.code === c.code
                                ? "bg-purple-600 text-white"
                                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                    >
                        {c.code} - {c.name}
                    </button>
                ))}
            </div>

            {/* Fetch Button */}
            <button
                onClick={fetchRawMoods}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 mb-6"
            >
                {loading ? "Fetching..." : `Fetch Raw Moods for ${selectedCountry.code}`}
            </button>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 mb-6">
                    Error: {error}
                </div>
            )}

            {/* Raw Response Display */}
            {data && (
                <div className="space-y-4">
                    {/* Metadata */}
                    <div className="p-4 bg-zinc-800 rounded-lg">
                        <h2 className="text-lg font-semibold text-white mb-2">Request Info</h2>
                        <div className="text-sm text-zinc-300 space-y-1">
                            <p><span className="text-zinc-500">Country:</span> {data.country}</p>
                            <p><span className="text-zinc-500">Language:</span> {data.language}</p>
                            <p><span className="text-zinc-500">Timestamp:</span> {data.timestamp}</p>
                        </div>
                    </div>

                    {/* Raw JSON Response */}
                    <div className="p-4 bg-zinc-900 rounded-lg">
                        <h2 className="text-lg font-semibold text-white mb-2">
                            Raw ytmusicapi Response
                        </h2>
                        <pre className="text-xs text-green-400 overflow-auto max-h-[600px] whitespace-pre-wrap">
                            {JSON.stringify(data.raw_response, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
