"use client";

import { useEffect, useState } from "react";
import { Play, Globe, ChevronRight } from "lucide-react";

// Extensive list of YouTube Music supported locations (100+)
const ALL_COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "KR", name: "South Korea" },
    { code: "JP", name: "Japan" },
    { code: "GB", name: "United Kingdom" },
    { code: "AR", name: "Argentina" },
    { code: "AU", name: "Australia" },
    { code: "AT", name: "Austria" },
    { code: "BE", name: "Belgium" },
    { code: "BO", name: "Bolivia" },
    { code: "BR", name: "Brazil" },
    { code: "BG", name: "Bulgaria" },
    { code: "CA", name: "Canada" },
    { code: "CL", name: "Chile" },
    { code: "CO", name: "Colombia" },
    { code: "CR", name: "Costa Rica" },
    { code: "HR", name: "Croatia" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "EE", name: "Estonia" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "GR", name: "Greece" },
    { code: "GT", name: "Guatemala" },
    { code: "HN", name: "Honduras" },
    { code: "HK", name: "Hong Kong" },
    { code: "HU", name: "Hungary" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IT", name: "Italy" },
    { code: "LV", name: "Latvia" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MY", name: "Malaysia" },
    { code: "MT", name: "Malta" },
    { code: "MX", name: "Mexico" },
    { code: "NL", name: "Netherlands" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "MK", name: "North Macedonia" },
    { code: "NO", name: "Norway" },
    { code: "PA", name: "Panama" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "RU", name: "Russia" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "RS", name: "Serbia" },
    { code: "SG", name: "Singapore" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "ZA", name: "South Africa" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "TW", name: "Taiwan" },
    { code: "TH", name: "Thailand" },
    { code: "TR", name: "Turkey" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "UY", name: "Uruguay" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" }
];

export default function MusicPage() {
    const [data, setData] = useState<any>(null);
    const [meta, setMeta] = useState<any>(null); // New Meta State
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState("US");

    const fetchMusic = async (countryCode: string) => {
        setLoading(true);
        setData(null);
        setMeta(null);
        try {
            const res = await fetch(`/api/music/charts?country=${countryCode}`);
            if (res.ok) {
                const json = await res.json();
                console.log("Full data:", json);
                setData(json.charts);
                setMeta(json.meta); // Capture meta
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMusic(country);
    }, []);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setCountry(newCountry);
        fetchMusic(newCountry);
    };

    return (
        <div className="max-w-full pb-20 md:pb-8 overflow-hidden">
            {/* Header Section */}
            <div className="px-4 py-8 max-w-[936px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Music Exploration
                    </h1>

                    {/* Country Selector */}
                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <Globe className="w-4 h-4 text-zinc-400" />
                        <select
                            value={country}
                            onChange={handleCountryChange}
                            className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer max-w-[200px] text-zinc-200"
                        >
                            {ALL_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                                <option key={c.code} value={c.code} className="bg-zinc-900">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center pt-20 animate-pulse gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                        <p className="text-zinc-500">Fetching live data from {ALL_COUNTRIES.find(c => c.code === country)?.name}...</p>
                    </div>
                )}

                {/* DEBUG PANEL */}
                {meta && (
                    <div className="mb-8 p-4 bg-zinc-900/80 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300">
                        <div className="flex justify-between items-center mb-2 border-b border-zinc-700 pb-2">
                            <p className="font-bold text-green-400">⚡ API RESPONSE STATUS</p>
                            <span className="bg-zinc-800 px-2 py-1 rounded text-[10px]">VERCEL DEBUG</span>
                        </div>
                        <p className="mb-1">Detected Country: <span className="text-white">{meta.country}</span></p>
                        <p className="mb-1">Total Sections Received: <span className="text-white font-bold text-lg">{meta.total_sections}</span></p>
                        {meta.section_titles && (
                            <div className="mt-2">
                                <p className="text-zinc-500 mb-1">Received Metadata Titles:</p>
                                <div className="flex flex-wrap gap-2">
                                    {meta.section_titles.map((t: string, i: number) => (
                                        <span key={i} className="bg-zinc-800 px-2 py-1 rounded text-[10px] border border-zinc-700">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(!data || data.length === 0) && !loading && (
                    <div className="text-center py-20 text-zinc-500">
                        <p className="text-lg mb-2">No content available for this region.</p>
                        <p className="text-sm">Try switching to a major region like United States or South Korea.</p>
                    </div>
                )}
            </div>

            {/* Content Sections (Stacks) */}
            {!loading && Array.isArray(data) && (
                <div className="space-y-12 pl-4">
                    {data.map((shelf: any, sIndex: number) => {
                        const title = shelf.title || "Recommended";
                        const contents = shelf.contents || [];

                        if (!Array.isArray(contents) || contents.length === 0) return null;

                        return (
                            <div key={sIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[100ms] fill-mode-backwards" style={{ animationDelay: `${sIndex * 100}ms` }}>
                                <div className="flex items-center justify-between mb-4 pr-4 max-w-[936px] mx-auto md:mx-0 md:max-w-none md:ml-[max(0px,calc(50vw-468px))]">
                                    <h2 className="text-xl font-bold text-white/90">{title}</h2>
                                    <button className="text-xs font-bold text-zinc-400 hover:text-white uppercase flex items-center gap-1">
                                        More <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Horizontal Scroll Container (Carousel) */}
                                <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory pr-4 md:pl-[max(0px,calc(50vw-468px))]">
                                    {contents.map((item: any, i: number) => {
                                        const itemTitle = item.title || "Unknown";
                                        const itemArtist = item.artists ? item.artists.map((a: any) => a.name).join(", ") :
                                            item.description ? item.description : "";
                                        const itemImg = item.thumbnails ? item.thumbnails[Math.max(0, item.thumbnails.length - 1)].url : null;

                                        if (!itemImg) return null;

                                        return (
                                            <div key={i} className="min-w-[160px] w-[160px] md:min-w-[180px] md:w-[180px] snap-start group cursor-pointer flex-shrink-0">
                                                <div className="aspect-square bg-zinc-800 rounded-md mb-3 relative overflow-hidden shadow-lg group-hover:shadow-2xl transition-all border border-white/5">
                                                    <img
                                                        src={itemImg}
                                                        alt={itemTitle}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform shadow-xl hover:bg-zinc-200">
                                                            <Play className="w-5 h-5 fill-current ml-1" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-bold truncate text-zinc-100 group-hover:text-white transition-colors" title={itemTitle}>
                                                        {itemTitle}
                                                    </h3>
                                                    <p className="text-xs text-zinc-400 truncate hover:text-zinc-300 transition-colors">
                                                        {itemArtist}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
