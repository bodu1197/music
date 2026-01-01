# ============================================
# /api/music/charts - YouTube Music Home Feed
# ============================================
# PURE MODE: Unauthenticated YTMusic with minimal params

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(country: str = "US"):
    """
    Get YouTube Music home feed.
    Pure unauthenticated mode - YTMusic() with no params.
    """
    try:
        # PURE Unauthenticated - no language, no location
        yt = YTMusic()
        
        # Get home data
        home_data = yt.get_home(limit=100)
        
        return {
            "charts": home_data if home_data else [],
            "meta": {
                "country": country,
                "total_sections": len(home_data) if home_data else 0,
                "source": "Pure Unauthenticated YTMusic()"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
