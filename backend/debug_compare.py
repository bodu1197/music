from ytmusicapi import YTMusic

def compare_locations():
    # 1. Indonesia Test
    print("\n--- Testing Indonesia (ID) ---")
    try:
        yt_id = YTMusic(location="ID", language="id")
        home_id = yt_id.get_home(limit=10)
        for shelf in home_id:
            print(f"[ID] {shelf.get('title', 'No Title')}")
    except Exception as e:
        print(f"ID Error: {e}")

    # 2. Korea Test
    print("\n--- Testing Korea (KR) ---")
    try:
        yt_kr = YTMusic(location="KR", language="ko")
        home_kr = yt_kr.get_home(limit=10)
        for shelf in home_kr:
            print(f"[KR] {shelf.get('title', 'No Title')}")
    except Exception as e:
        print(f"KR Error: {e}")

if __name__ == "__main__":
    compare_locations()
