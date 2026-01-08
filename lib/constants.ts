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

// All 109 countries supported by ytmusicapi (for Home, Moods, Genres - not Charts)
// Charts only supports 62 countries (SUPPORTED_COUNTRIES above)
export const YTMUSICAPI_SUPPORTED_LOCATIONS = new Set([
    "AE", "AR", "AT", "AU", "AZ", "BA", "BD", "BE", "BG", "BH", "BO", "BR", "BY", "CA", "CH",
    "CL", "CO", "CR", "CY", "CZ", "DE", "DK", "DO", "DZ", "EC", "EE", "EG", "ES", "FI", "FR",
    "GB", "GE", "GH", "GR", "GT", "HK", "HN", "HR", "HU", "ID", "IE", "IL", "IN", "IQ", "IS",
    "IT", "JM", "JO", "JP", "KE", "KH", "KR", "KW", "KZ", "LA", "LB", "LI", "LK", "LT", "LU",
    "LV", "LY", "MA", "ME", "MK", "MT", "MX", "MY", "NG", "NI", "NL", "NO", "NP", "NZ", "OM",
    "PA", "PE", "PG", "PH", "PK", "PL", "PR", "PT", "PY", "QA", "RO", "RS", "RU", "SA", "SE",
    "SG", "SI", "SK", "SN", "SV", "TH", "TN", "TR", "TW", "TZ", "UA", "UG", "US", "UY", "VE",
    "VN", "YE", "ZA", "ZW"
]);

// Additional country info for countries not in SUPPORTED_COUNTRIES (for ytmusicapi)
// These are the 47 extra countries beyond the 62 Charts-supported countries
export const ADDITIONAL_COUNTRIES: Record<string, { name: string; lang: string }> = {
    "AZ": { name: "Azerbaijan", lang: "en" },
    "BA": { name: "Bosnia and Herzegovina", lang: "en" },
    "BD": { name: "Bangladesh", lang: "en" },
    "BG": { name: "Bulgaria", lang: "en" },
    "BH": { name: "Bahrain", lang: "ar" },
    "BY": { name: "Belarus", lang: "ru" },
    "CY": { name: "Cyprus", lang: "en" },
    "DZ": { name: "Algeria", lang: "ar" },
    "GE": { name: "Georgia", lang: "en" },
    "GH": { name: "Ghana", lang: "en" },
    "GR": { name: "Greece", lang: "en" },
    "HK": { name: "Hong Kong", lang: "zh_TW" },
    "HR": { name: "Croatia", lang: "en" },
    "IQ": { name: "Iraq", lang: "ar" },
    "JM": { name: "Jamaica", lang: "en" },
    "JO": { name: "Jordan", lang: "ar" },
    "KH": { name: "Cambodia", lang: "en" },
    "KW": { name: "Kuwait", lang: "ar" },
    "KZ": { name: "Kazakhstan", lang: "ru" },
    "LA": { name: "Laos", lang: "en" },
    "LB": { name: "Lebanon", lang: "ar" },
    "LI": { name: "Liechtenstein", lang: "de" },
    "LK": { name: "Sri Lanka", lang: "en" },
    "LT": { name: "Lithuania", lang: "en" },
    "LV": { name: "Latvia", lang: "en" },
    "LY": { name: "Libya", lang: "ar" },
    "MA": { name: "Morocco", lang: "ar" },
    "ME": { name: "Montenegro", lang: "en" },
    "MK": { name: "North Macedonia", lang: "en" },
    "MT": { name: "Malta", lang: "en" },
    "MY": { name: "Malaysia", lang: "en" },
    "NP": { name: "Nepal", lang: "en" },
    "OM": { name: "Oman", lang: "ar" },
    "PG": { name: "Papua New Guinea", lang: "en" },
    "PH": { name: "Philippines", lang: "en" },
    "PK": { name: "Pakistan", lang: "ur" },
    "PR": { name: "Puerto Rico", lang: "es" },
    "QA": { name: "Qatar", lang: "ar" },
    "SG": { name: "Singapore", lang: "en" },
    "SI": { name: "Slovenia", lang: "en" },
    "SK": { name: "Slovakia", lang: "en" },
    "SN": { name: "Senegal", lang: "fr" },
    "TH": { name: "Thailand", lang: "en" },
    "TN": { name: "Tunisia", lang: "ar" },
    "TW": { name: "Taiwan", lang: "zh_TW" },
    "VE": { name: "Venezuela", lang: "es" },
    "VN": { name: "Vietnam", lang: "en" },
    "YE": { name: "Yemen", lang: "ar" },
};

// Helper function to get country info from any supported country code
export function getCountryInfo(code: string): Country | null {
    // First check SUPPORTED_COUNTRIES (Charts-compatible)
    const found = SUPPORTED_COUNTRIES.find(c => c.code === code);
    if (found) return found;

    // Then check additional ytmusicapi countries
    const additional = ADDITIONAL_COUNTRIES[code];
    if (additional) {
        return { code, name: additional.name, lang: additional.lang };
    }

    return null;
}
