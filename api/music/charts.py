# ============================================
# /api/music/charts - YouTube Music Home Feed
# ============================================
# PURE MODE: Returns only get_home() data as-is
# Respects ytmusicapi library output without modification

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(country: str = "US"):
    """
    Get YouTube Music home feed for a specific country.
    PURE MODE: Returns only what get_home() provides.
    Section count varies by country (can be 2-16+ sections).
    """
    try:
        # Initialize YTMusic (unauthenticated, location-based)
        yt = YTMusic(language="en", location=country)
        
        # PURE get_home() - no additional data mixing
        home_data = yt.get_home(limit=100)
        
        # Return exactly what ytmusicapi gives us
        return {
            "charts": home_data if home_data else [],
            "meta": {
                "country": country,
                "total_sections": len(home_data) if home_data else 0,
                "source": "Pure get_home() - ytmusicapi"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
