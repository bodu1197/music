"use client";

import { useEffect, useState } from "react";
import { Play, Globe } from "lucide-react";

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
    const [loading, setLoading] = useState(true);
    const [country, setCountry] = useState("US");

    const fetchMusic = async (countryCode: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/music/charts?country=${countryCode}`);
            if (res.ok) {
                const json = await res.json();
                setData(json.charts);
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
        <div className="max-w-[936px] mx-auto py-8 px-4 pb-20 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold">Music Exploration</h1>

                {/* Country Selector */}
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-md border border-zinc-800">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    <select
                        value={country}
                        onChange={handleCountryChange}
                        className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer max-w-[200px]"
                    >
                        {ALL_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                            <option key={c.code} value={c.code} className="bg-zinc-900">
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center pt-20 text-zinc-500 animate-pulse">
                    Fetcing data for {ALL_COUNTRIES.find(c => c.code === country)?.name}...
                </div>
            ) : (
                <div className="space-y-12">
                    {(!data || data.length === 0) && (
                        <div className="text-center py-20 text-zinc-500">
                            No content available for this region. Try another country.
                        </div>
                    )}

                    {Array.isArray(data) && data.map((shelf: any, sIndex: number) => {
                        const title = shelf.title || "Recommended";
                        const contents = shelf.contents || [];

                        if (!Array.isArray(contents) || contents.length === 0) return null;

                        return (
                            <div key={sIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">{title}</h2>
                                    <button className="text-xs font-bold text-zinc-400 hover:text-white uppercase">See All</button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {contents.slice(0, 10).map((item: any, i: number) => {
                                        const itemTitle = item.title || "Unknown";
                                        const itemArtist = item.artists ? item.artists.map((a: any) => a.name).join(", ") : "";
                                        const itemImg = item.thumbnails ? item.thumbnails[Math.max(0, item.thumbnails.length - 1)].url : null;

                                        if (!itemImg) return null;

                                        return (
                                            <div key={i} className="group cursor-pointer">
                                                <div className="aspect-square bg-zinc-800 rounded-md mb-2 relative overflow-hidden">
                                                    <img src={itemImg} alt={itemTitle} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Play className="w-10 h-10 text-white fill-current" />
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-bold truncate">{itemTitle}</h3>
                                                <p className="text-xs text-zinc-400 truncate">{itemArtist}</p>
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
