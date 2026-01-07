"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_COUNTRIES, Country } from "@/lib/constants";

interface CountrySelectorProps {
    value: Country;
    onChange: (country: Country) => void;
}

// Convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
    if (countryCode === "ZZ") return "🌍";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

export function CountrySelector({ value, onChange }: Readonly<CountrySelectorProps>) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCountries = SUPPORTED_COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (country: Country) => {
        onChange(country);
        setOpen(false);
        setSearch("");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0f3460] text-[#e94560] rounded-lg hover:bg-[#e94560] hover:text-white transition-colors duration-300 min-w-[160px] justify-between"
            >
                <span className="flex items-center gap-2">
                    <span className="text-xl">{getFlagEmoji(value.code)}</span>
                    <span className="font-medium">{value.name}</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute top-full right-0 mt-1 w-[300px] bg-[#1a1a2e] border border-[#0f3460] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2.5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-9 pr-3 py-2.5 bg-[#16213e] border border-[#0f3460] rounded-lg text-[#e0e0e0] placeholder:text-[#6b7280] focus:outline-none focus:border-[#e94560] text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Countries List */}
                    <div className="max-h-[300px] overflow-y-auto px-2.5 pb-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#0f3460] [&::-webkit-scrollbar-thumb]:rounded-full">
                        {filteredCountries.length === 0 ? (
                            <div className="py-4 text-center text-[#a0a0a0] text-sm">No country found</div>
                        ) : (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                        value.code === country.code
                                            ? "bg-[#0f3460] text-white"
                                            : "text-[#e0e0e0] hover:bg-[#0f3460]/50"
                                    )}
                                >
                                    <span className="text-xl">{getFlagEmoji(country.code)}</span>
                                    <span className="flex-1 text-sm">{country.name}</span>
                                    {value.code === country.code && (
                                        <Check className="w-4 h-4 text-[#e94560]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
