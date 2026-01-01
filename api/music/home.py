from fastapi import APIRouter
from ytmusicapi import YTMusic
import random

router = APIRouter()

@router.get("")
def get_home():
    # Use explicit language/location to stabilize results
    yt = YTMusic(language="en", location="US")
    
    # We construct a "Home Feed" using multiple specific searches.
    # This guarantees REAL data and bypasses complex structure parsing issues of raw get_home().
    home_sections = []
    
    # Define dynamic queries to keep the feed fresh
    queries = [
        {"title": "Global Trending", "q": "Global Top 100", "filter": "songs"},
        {"title": "Fresh K-Pop", "q": "New K-Pop Songs 2025", "filter": "songs"},
        {"title": "Hip-Hop Essentials", "q": "Trending Hip Hop", "filter": "songs"},
        {"title": "Chill Vibes", "q": "Lo-Fi and Chill music", "filter": "songs"}
    ]
    
    for query in queries:
        try:
            # Real API call
            results = yt.search(query["q"], filter=query["filter"], limit=10)
            
            # Filter checks
            cleaned = []
            if results:
                for item in results:
                    if item.get('thumbnails') and item.get('title') and item.get('videoId'):
                         cleaned.append(item)
            
            if cleaned:
                home_sections.append({
                    "title": query["title"],
                    "contents": cleaned
                })
        except Exception as e:
            print(f"Failed to fetch section {query['title']}: {e}")
            continue

    # Return whatever we managed to fetch. 
    # If empty, frontend handles it. NO HARDCODED FALLBACKS.
    return {"home": home_sections}
