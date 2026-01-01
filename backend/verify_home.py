import requests
import json

URL = "https://sori-music-backend-322455104824.us-central1.run.app/home"

try:
    print(f"Fetching {URL}...")
    response = requests.get(URL)
    response.raise_for_status()
    data = response.json()
    
    if isinstance(data, list):
        count = len(data)
        print(f"Total Sections: {count}")
        print("-" * 20)
        for i, section in enumerate(data):
            title = section.get('title', 'No Title')
            print(f"{i+1}. {title}")
    else:
        print("Error: Response is not a list")
        print(type(data))

except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
    print("Response Body:", response.text)
except Exception as e:
    print(f"Error: {e}")
