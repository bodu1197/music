export interface Country {
    code: string;
    name: string;
    lang: string;
}

// ytmusicapi supported languages: ko, hi, it, de, tr, en, pt, cs, zh_CN, ja, es, ru, fr, nl, ar, ur, zh_TW
// Unsupported languages fallback to "en"

export const SUPPORTED_COUNTRIES: Country[] = [
    // A
    { code: "AE", name: "United Arab Emirates", lang: "ar" },
    { code: "AR", name: "Argentina", lang: "es" },
    { code: "AT", name: "Austria", lang: "de" },
    { code: "AU", name: "Australia", lang: "en" },
    { code: "AZ", name: "Azerbaijan", lang: "en" },

    // B
    { code: "BA", name: "Bosnia and Herzegovina", lang: "en" },
    { code: "BD", name: "Bangladesh", lang: "en" },
    { code: "BE", name: "Belgium", lang: "fr" },
    { code: "BG", name: "Bulgaria", lang: "en" },
    { code: "BH", name: "Bahrain", lang: "ar" },
    { code: "BO", name: "Bolivia", lang: "es" },
    { code: "BR", name: "Brazil", lang: "pt" },
    { code: "BY", name: "Belarus", lang: "ru" },

    // C
    { code: "CA", name: "Canada", lang: "en" },
    { code: "CH", name: "Switzerland", lang: "de" },
    { code: "CL", name: "Chile", lang: "es" },
    { code: "CO", name: "Colombia", lang: "es" },
    { code: "CR", name: "Costa Rica", lang: "es" },
    { code: "CY", name: "Cyprus", lang: "en" },
    { code: "CZ", name: "Czech Republic", lang: "cs" },

    // D
    { code: "DE", name: "Germany", lang: "de" },
    { code: "DK", name: "Denmark", lang: "en" },
    { code: "DO", name: "Dominican Republic", lang: "es" },
    { code: "DZ", name: "Algeria", lang: "ar" },

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
    { code: "GE", name: "Georgia", lang: "en" },
    { code: "GH", name: "Ghana", lang: "en" },
    { code: "GR", name: "Greece", lang: "en" },
    { code: "GT", name: "Guatemala", lang: "es" },

    // H
    { code: "HK", name: "Hong Kong", lang: "zh_TW" },
    { code: "HN", name: "Honduras", lang: "es" },
    { code: "HR", name: "Croatia", lang: "en" },
    { code: "HU", name: "Hungary", lang: "en" },

    // I
    { code: "ID", name: "Indonesia", lang: "en" },
    { code: "IE", name: "Ireland", lang: "en" },
    { code: "IL", name: "Israel", lang: "en" },
    { code: "IN", name: "India", lang: "hi" },
    { code: "IQ", name: "Iraq", lang: "ar" },
    { code: "IS", name: "Iceland", lang: "en" },
    { code: "IT", name: "Italy", lang: "it" },

    // J
    { code: "JM", name: "Jamaica", lang: "en" },
    { code: "JO", name: "Jordan", lang: "ar" },
    { code: "JP", name: "Japan", lang: "ja" },

    // K
    { code: "KE", name: "Kenya", lang: "en" },
    { code: "KH", name: "Cambodia", lang: "en" },
    { code: "KR", name: "South Korea", lang: "ko" },
    { code: "KW", name: "Kuwait", lang: "ar" },
    { code: "KZ", name: "Kazakhstan", lang: "ru" },

    // L
    { code: "LA", name: "Laos", lang: "en" },
    { code: "LB", name: "Lebanon", lang: "ar" },
    { code: "LI", name: "Liechtenstein", lang: "de" },
    { code: "LK", name: "Sri Lanka", lang: "en" },
    { code: "LT", name: "Lithuania", lang: "en" },
    { code: "LU", name: "Luxembourg", lang: "fr" },
    { code: "LV", name: "Latvia", lang: "en" },
    { code: "LY", name: "Libya", lang: "ar" },

    // M
    { code: "MA", name: "Morocco", lang: "ar" },
    { code: "ME", name: "Montenegro", lang: "en" },
    { code: "MK", name: "North Macedonia", lang: "en" },
    { code: "MT", name: "Malta", lang: "en" },
    { code: "MX", name: "Mexico", lang: "es" },
    { code: "MY", name: "Malaysia", lang: "en" },

    // N
    { code: "NG", name: "Nigeria", lang: "en" },
    { code: "NI", name: "Nicaragua", lang: "es" },
    { code: "NL", name: "Netherlands", lang: "nl" },
    { code: "NO", name: "Norway", lang: "en" },
    { code: "NP", name: "Nepal", lang: "en" },
    { code: "NZ", name: "New Zealand", lang: "en" },

    // O
    { code: "OM", name: "Oman", lang: "ar" },

    // P
    { code: "PA", name: "Panama", lang: "es" },
    { code: "PE", name: "Peru", lang: "es" },
    { code: "PG", name: "Papua New Guinea", lang: "en" },
    { code: "PH", name: "Philippines", lang: "en" },
    { code: "PK", name: "Pakistan", lang: "ur" },
    { code: "PL", name: "Poland", lang: "en" },
    { code: "PR", name: "Puerto Rico", lang: "es" },
    { code: "PT", name: "Portugal", lang: "pt" },
    { code: "PY", name: "Paraguay", lang: "es" },

    // Q
    { code: "QA", name: "Qatar", lang: "ar" },

    // R
    { code: "RO", name: "Romania", lang: "en" },
    { code: "RS", name: "Serbia", lang: "en" },
    { code: "RU", name: "Russia", lang: "ru" },

    // S
    { code: "SA", name: "Saudi Arabia", lang: "ar" },
    { code: "SE", name: "Sweden", lang: "en" },
    { code: "SG", name: "Singapore", lang: "en" },
    { code: "SI", name: "Slovenia", lang: "en" },
    { code: "SK", name: "Slovakia", lang: "en" },
    { code: "SN", name: "Senegal", lang: "fr" },
    { code: "SV", name: "El Salvador", lang: "es" },

    // T
    { code: "TH", name: "Thailand", lang: "en" },
    { code: "TN", name: "Tunisia", lang: "ar" },
    { code: "TR", name: "Turkey", lang: "tr" },
    { code: "TW", name: "Taiwan", lang: "zh_TW" },
    { code: "TZ", name: "Tanzania", lang: "en" },

    // U
    { code: "UA", name: "Ukraine", lang: "en" },
    { code: "UG", name: "Uganda", lang: "en" },
    { code: "US", name: "United States", lang: "en" },
    { code: "UY", name: "Uruguay", lang: "es" },

    // V
    { code: "VE", name: "Venezuela", lang: "es" },
    { code: "VN", name: "Vietnam", lang: "en" },

    // Y
    { code: "YE", name: "Yemen", lang: "ar" },

    // Z
    { code: "ZA", name: "South Africa", lang: "en" },
    { code: "ZW", name: "Zimbabwe", lang: "en" },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES.find(c => c.code === "US") || SUPPORTED_COUNTRIES[0];
