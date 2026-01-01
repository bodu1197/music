from ytmusicapi import YTMusic
import traceback

def test_crash():
    print("Initializing YTMusic(location='ID', language='id')...")
    try:
        yt = YTMusic(location="ID", language="id")
        print("Initialization successful.")
        
        print("Calling get_home(limit=100)...")
        data = yt.get_home(limit=100)
        print(f"Success! Got {len(data)} items.")
        
    except Exception:
        print("CRASHED:")
        traceback.print_exc()

if __name__ == "__main__":
    test_crash()
