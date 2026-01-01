from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("")
def get_charts(country: str = "US"):
    try:
        # Fetch Charts (Top songs, Top videos, Trending)
        charts = yt.get_charts(country=country)
        
        # Fetch New Releases
        new_releases = yt.get_new_releases()
        
        return {
            "charts": charts,
            "new_releases": new_releases
        }
    except Exception as e:
        print(f"Error fetching music data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
