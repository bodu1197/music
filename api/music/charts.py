from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("")
def get_charts(country: str = "US"):
    charts = {}
    new_releases = []

    try:
        # Try genuine get_charts
        charts = yt.get_charts(country=country)
    except Exception as e:
        print(f"get_charts failed: {e}")
        # If get_charts fails, try a search for 'Top 100' so we still get REAL data, not hardcoded
        try:
             search_results = yt.search(f"Top 100 songs {country}", filter="songs", limit=20)
             # Mimic chart structure for frontend compatibility
             charts = {
                 "videos": {"items": search_results}, # mapping search results to video items
                 "trending": {"items": search_results[:5]}
             }
        except Exception:
            charts = {}

    try:
        # Try genuine new_releases
        new_releases = yt.get_new_releases()
    except Exception as e:
         print(f"new_releases failed: {e}")
         # If new_releases fails, search for 'New Albums'
         try:
             new_releases = yt.search("New Released Albums", filter="albums", limit=10)
         except Exception:
             new_releases = []

    return {
        "charts": charts,
        "new_releases": new_releases
    }
