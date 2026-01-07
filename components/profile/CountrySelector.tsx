"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_COUNTRIES, Country } from "@/lib/constants";

interface CountrySelectorProps {
    value: Country;
    onChange: (country: Country) => void;
}

// Get flag icon URL from flagcdn.com
function getFlagUrl(countryCode: string): string {
    if (countryCode === "ZZ") return "";
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
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
        <div className="relative w-full md:w-[320px]" ref={dropdownRef}>
            {/* Trigger Button - same width as dropdown */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#0f3460] text-[#e94560] rounded-lg hover:bg-[#e94560] hover:text-white transition-colors duration-300 justify-between"
            >
                <span className="flex items-center gap-3">
                    {value.code === "ZZ" ? (
                        <span className="text-xl">🌍</span>
                    ) : (
                        <img
                            src={getFlagUrl(value.code)}
                            alt={value.code}
                            className="w-6 h-4 object-cover rounded-sm"
                        />
                    )}
                    <span className="font-medium truncate">{value.name}</span>
                </span>
                <ChevronDown className={cn("w-5 h-5 transition-transform flex-shrink-0", open && "rotate-180")} />
            </button>

            {/* Dropdown Panel - same width as button */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-[#0f3460] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-10 pr-3 py-2.5 bg-[#16213e] border border-[#0f3460] rounded-lg text-[#e0e0e0] placeholder:text-[#6b7280] focus:outline-none focus:border-[#e94560] text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Countries List */}
                    <div className="max-h-[300px] overflow-y-auto px-3 pb-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#0f3460] [&::-webkit-scrollbar-thumb]:rounded-full">
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
                                    {country.code === "ZZ" ? (
                                        <span className="text-xl w-6 text-center">🌍</span>
                                    ) : (
                                        <img
                                            src={getFlagUrl(country.code)}
                                            alt={country.code}
                                            className="w-6 h-4 object-cover rounded-sm"
                                        />
                                    )}
                                    <span className="flex-1 text-sm">{country.name}</span>
                                    {value.code === country.code && (
                                        <Check className="w-4 h-4 text-[#e94560] flex-shrink-0" />
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

