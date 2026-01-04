export interface Country {
    code: string;
    name: string;
    lang: string;
}

// ytmusicapi supported languages: ko, hi, it, de, tr, en, pt, cs, zh_CN, ja, es, ru, fr, nl, ar, ur, zh_TW
// Unsupported languages fallback to "en"

// Only countries with official YouTube Music Charts support (62 countries)
export const SUPPORTED_COUNTRIES: Country[] = [
    // Global
    { code: "ZZ", name: "🌍 Global", lang: "en" },

    // A
    { code: "AR", name: "Argentina", lang: "es" },
    { code: "AT", name: "Austria", lang: "de" },
    { code: "AU", name: "Australia", lang: "en" },
    { code: "AE", name: "United Arab Emirates", lang: "ar" },

    // B
    { code: "BE", name: "Belgium", lang: "fr" },
    { code: "BO", name: "Bolivia", lang: "es" },
    { code: "BR", name: "Brazil", lang: "pt" },

    // C
    { code: "CA", name: "Canada", lang: "en" },
    { code: "CH", name: "Switzerland", lang: "de" },
    { code: "CL", name: "Chile", lang: "es" },
    { code: "CO", name: "Colombia", lang: "es" },
    { code: "CR", name: "Costa Rica", lang: "es" },
    { code: "CZ", name: "Czech Republic", lang: "cs" },

    // D
    { code: "DE", name: "Germany", lang: "de" },
    { code: "DK", name: "Denmark", lang: "en" },
    { code: "DO", name: "Dominican Republic", lang: "es" },

    // E
    { code: "EC", name: "Ecuador", lang: "es" },
    { code: "EE", name: "Estonia", lang: "en" },
    { code: "EG", name: "Egypt", lang: "ar" },
    { code: "ES", name: "Spain", lang: "es" },

    // F
    { code: "FI", name: "Finland", lang: "en" },
    { code: "FR", name: "France", lang: "fr" },

    // G
    { code: "GB", name: "United Kingdom", lang: "en" },
    { code: "GT", name: "Guatemala", lang: "es" },

    // H
    { code: "HN", name: "Honduras", lang: "es" },
    { code: "HU", name: "Hungary", lang: "en" },

    // I
    { code: "ID", name: "Indonesia", lang: "en" },
    { code: "IE", name: "Ireland", lang: "en" },
    { code: "IL", name: "Israel", lang: "en" },
    { code: "IN", name: "India", lang: "hi" },
    { code: "IS", name: "Iceland", lang: "en" },
    { code: "IT", name: "Italy", lang: "it" },

    // J
    { code: "JP", name: "Japan", lang: "ja" },

    // K
    { code: "KE", name: "Kenya", lang: "en" },
    { code: "KR", name: "South Korea", lang: "ko" },

    // L
    { code: "LU", name: "Luxembourg", lang: "fr" },

    // M
    { code: "MX", name: "Mexico", lang: "es" },

    // N
    { code: "NG", name: "Nigeria", lang: "en" },
    { code: "NI", name: "Nicaragua", lang: "es" },
    { code: "NL", name: "Netherlands", lang: "nl" },
    { code: "NO", name: "Norway", lang: "en" },
    { code: "NZ", name: "New Zealand", lang: "en" },

    // P
    { code: "PA", name: "Panama", lang: "es" },
    { code: "PE", name: "Peru", lang: "es" },
    { code: "PL", name: "Poland", lang: "en" },
    { code: "PT", name: "Portugal", lang: "pt" },
    { code: "PY", name: "Paraguay", lang: "es" },

    // R
    { code: "RO", name: "Romania", lang: "en" },
    { code: "RS", name: "Serbia", lang: "en" },
    { code: "RU", name: "Russia", lang: "ru" },

    // S
    { code: "SA", name: "Saudi Arabia", lang: "ar" },
    { code: "SE", name: "Sweden", lang: "en" },
    { code: "SV", name: "El Salvador", lang: "es" },

    // T
    { code: "TR", name: "Turkey", lang: "tr" },
    { code: "TZ", name: "Tanzania", lang: "en" },

    // U
    { code: "UA", name: "Ukraine", lang: "en" },
    { code: "UG", name: "Uganda", lang: "en" },
    { code: "US", name: "United States", lang: "en" },
    { code: "UY", name: "Uruguay", lang: "es" },

    // Z
    { code: "ZA", name: "South Africa", lang: "en" },
    { code: "ZW", name: "Zimbabwe", lang: "en" },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES.find(c => c.code === "US") || SUPPORTED_COUNTRIES[0];
