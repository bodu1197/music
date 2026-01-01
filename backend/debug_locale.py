from ytmusicapi import YTMusic
import json

def test_location(code, lang):
    print(f"\n--- Testing Location: {code} ({lang}) ---")
    try:
        # Initialize with location and language
        yt = YTMusic(location=code, language=lang)
        home_data = yt.get_home(limit=5)
        
        print(f"Sections found: {len(home_data)}")
        for shelf in home_data[:5]:
            title = shelf.get('title', 'No Title')
            print(f"Section: {title}")
            if 'contents' in shelf and len(shelf['contents']) > 0:
                first_item = shelf['contents'][0]
                item_title = first_item.get('title', 'Unknown')
                print(f"  - Example Item: {item_title}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_location("KR", "ko")
    test_location("US", "en")
