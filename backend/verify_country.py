import requests
import json

API_URL = "https://sori-music-backend-322455104824.us-central1.run.app/home"

def check_region():
    print(f"Fetching home data from {API_URL}...")
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        data = response.json()
        
        print(f"\nResponse received. Found {len(data)} sections.")
        
        print("\n--- Section Titles ---")
        regions_found = []
        for section in data:
            title = section.get('title', 'No Title')
            print(f"- {title}")
            
            # Simple keyword check
            lower_title = title.lower()
            if "us" in lower_title or "united states" in lower_title:
                regions_found.append("US")
            if "korea" in lower_title or "k-pop" in lower_title:
                regions_found.append("KR")
            if "japan" in lower_title:
                regions_found.append("JP")
            if "global" in lower_title:
                regions_found.append("Global")

        print("\n--- Analysis ---")
        if regions_found:
            print(f"Potential Regions Detected from Titles: {set(regions_found)}")
        else:
            print("No explicit country names found in section titles.")
            
        # Check first item content language/script if possible (heuristic)
        if data and 'contents' in data[0]:
            first_item = data[0]['contents'][0]
            print(f"\nExample Item: {first_item.get('title')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_region()
