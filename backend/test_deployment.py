import requests

def test_endpoint():
    url = "https://sori-music-backend-322455104824.us-central1.run.app/home"
    params = {"limit": 100, "country": "ID", "language": "id"}
    
    print(f"Testing {url} with params {params}...")
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! Backend handled 'id' language gracefully.")
            data = response.json()
            print(f"Got {len(data)} items.")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_endpoint()
