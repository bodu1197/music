from ytmusicapi import YTMusic
import json

def test_home():
    try:
        # User recommended checking what get_home actually returns
        yt = YTMusic(language="en", location="US")
        home = yt.get_home()
        
        print(f"Total Sections: {len(home)}")
        for idx, shelf in enumerate(home):
            title = shelf.get('title', 'No Title')
            contents = shelf.get('contents', [])
            print(f"Section {idx+1}: {title} (Items: {len(contents)})")
            # Print first item structure to verify keys
            if contents:
                print(f"  - Sample Item keys: {list(contents[0].keys())}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_home()
