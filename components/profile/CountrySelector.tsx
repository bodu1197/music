"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { SUPPORTED_COUNTRIES, Country } from "@/lib/constants";

interface CountrySelectorProps {
    value: Country;
    onChange: (country: Country) => void;
}

export function CountrySelector({ value, onChange }: Readonly<CountrySelectorProps>) {
    const [open, setOpen] = useState(false);

    const handleSelect = (countryCode: string) => {
        const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
        if (country) {
            onChange(country);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="min-w-[150px] justify-between px-5 py-2.5 h-auto bg-[#0f3460] text-[#e94560] border-none rounded-lg hover:bg-[#e94560] hover:text-white transition-colors duration-300"
                >
                    <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{value.name}</span>
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 bg-[#1a1a2e] border border-[#0f3460] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder="Search country..."
                        className="h-10 bg-[#16213e] border border-[#0f3460] rounded-md mx-2.5 my-2.5 text-[#e0e0e0] placeholder:text-[#a0a0a0] focus:border-[#e94560] focus:ring-0"
                    />
                    <CommandEmpty className="text-[#a0a0a0] py-4 text-center">No country found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto px-2.5 pb-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#0f3460] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#e94560]">
                        {SUPPORTED_COUNTRIES.map((country) => (
                            <CommandItem
                                key={country.code}
                                value={country.name}
                                onSelect={() => handleSelect(country.code)}
                                className="py-3 px-4 rounded-lg text-white cursor-pointer hover:bg-[#0f3460] aria-selected:bg-[#0f3460] transition-colors"
                            >
                                <span className="mr-3 text-lg">{country.code === "ZZ" ? "🌍" : ""}</span>
                                <span className="flex-1">{country.name}</span>
                                <Check
                                    className={cn(
                                        "ml-auto h-4 w-4 text-[#e94560]",
                                        value.code === country.code
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

