"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
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
                    className="w-[180px] justify-between text-xs h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                >
                    <span className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400">{value.code}</span>
                        <span className="truncate">{value.name}</span>
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0 bg-zinc-900 border-zinc-800">
                <Command>
                    <CommandInput placeholder="Search country..." className="h-9" />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                        {SUPPORTED_COUNTRIES.map((country) => (
                            <CommandItem
                                key={country.code}
                                value={country.name}
                                onSelect={() => handleSelect(country.code)}
                                className="text-xs text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white cursor-pointer"
                            >
                                <span className="mr-2 font-mono text-zinc-500 w-6">{country.code}</span>
                                {country.name}
                                <Check
                                    className={cn(
                                        "ml-auto h-3 w-3",
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
