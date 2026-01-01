from ytmusicapi import YTMusic

def test_locations():
    # Test cases: (Location Code, Language Code, Expected Title Keyword)
    tests = [
        ("US", "en", "Quick picks"),
        ("KR", "ko", "빠른 선곡"), # Quick picks in Korean
        ("JP", "ja", "クイック"), # Quick (picks) in Japanese
        ("FR", "fr", "Sélections"), # Quick picks in French
        ("ES", "es", "Selecciones"), # Quick picks in Spanish
    ]

    print("Testing YTMusic(location=..., language=...) without Proxy...\n")

    for loc, lang, keyword in tests:
        try:
            print(f"--- Init YTMusic(location='{loc}', language='{lang}') ---")
            yt = YTMusic(location=loc, language=lang)
            home = yt.get_home(limit=10)
            
            # Check first few titles
            titles = [section['title'] for section in home if 'title' in section]
            print(f"found {len(titles)} sections.")
            print(f"Top 3 titles: {titles[:3]}")
            
            # Check for localized keyword
            is_localized = any(keyword in t for t in titles)
            if is_localized:
                print(f"✅ SUCCESS: Found localized content for {loc}")
            else:
                print(f"❌ FAIL: Content appears to default to server region (likely US)")
                
        except Exception as e:
            print(f"Error for {loc}: {e}")
        print("\n")

if __name__ == "__main__":
    test_locations()
