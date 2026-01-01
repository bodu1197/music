# ============================================
# /api/music/explore - YouTube Music Explore
# ============================================

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def explore():
    """
    Get explore page with moods, genres, and new releases.
    """
    try:
        yt = YTMusic(language="en")
        
        result = {
            "moods": [],
            "new_releases": []
        }
        
        # Get mood categories
        try:
            moods = yt.get_mood_categories()
            result["moods"] = moods
        except Exception as e:
            print(f"get_mood_categories error: {e}")
        
        # Get new releases
        try:
            releases = yt.get_new_releases()
            result["new_releases"] = releases
        except Exception as e:
            print(f"get_new_releases error: {e}")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/moods/{params}")
def get_mood_playlists(params: str):
    """Get playlists for a specific mood/genre category."""
    try:
        yt = YTMusic(language="en")
        playlists = yt.get_mood_playlists(params)
        return {"playlists": playlists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
