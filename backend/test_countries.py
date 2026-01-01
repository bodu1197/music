"""
Test ytmusicapi get_home() function for all countries
"""
from ytmusicapi import YTMusic
import time

# ISO 3166-1 alpha-2 country codes (comprehensive list)
ALL_COUNTRIES = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
    "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
    "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
    "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
    "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
    "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
    "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
    "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
    "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
    "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
]

def test_country(country_code: str) -> dict:
    """Test get_home for a specific country"""
    try:
        yt = YTMusic(location=country_code)
        result = yt.get_home(limit=3)

        if result and len(result) > 0:
            return {
                "code": country_code,
                "success": True,
                "sections": len(result),
                "error": None
            }
        else:
            return {
                "code": country_code,
                "success": False,
                "sections": 0,
                "error": "Empty result"
            }
    except Exception as e:
        return {
            "code": country_code,
            "success": False,
            "sections": 0,
            "error": str(e)[:100]
        }

def main():
    print("=" * 60)
    print("Testing ytmusicapi get_home() for all countries")
    print("=" * 60)

    supported = []
    unsupported = []
    errors = {}

    total = len(ALL_COUNTRIES)

    for i, country in enumerate(ALL_COUNTRIES):
        result = test_country(country)

        if result["success"]:
            supported.append(country)
            status = f"OK - {result['sections']} sections"
        else:
            unsupported.append(country)
            errors[country] = result["error"]
            status = f"FAIL - {result['error'][:50]}"

        print(f"[{i+1:3}/{total}] {country}: {status}")

        time.sleep(0.3)

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    print(f"\nSupported countries: {len(supported)}")
    print(f"Unsupported countries: {len(unsupported)}")
    print(f"\nSuccess rate: {len(supported)/total*100:.1f}%")

    print(f"\nSupported country codes ({len(supported)}):")
    print(", ".join(supported))

    print(f"\nUnsupported country codes ({len(unsupported)}):")
    print(", ".join(unsupported))

    print("\nError breakdown:")
    error_types = {}
    for code, err in errors.items():
        key = err[:40] if err else "Unknown"
        if key not in error_types:
            error_types[key] = []
        error_types[key].append(code)

    for err_type, codes in error_types.items():
        print(f"  - {err_type}: {len(codes)} countries")

if __name__ == "__main__":
    main()
