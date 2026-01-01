# ============================================
# /api/music/charts - YouTube Music Charts
# ============================================
# Returns chart data for the specified country

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(country: str = "US"):
    """
    Get music charts for a specific country.
    Returns songs, videos, artists charts.
    """
    try:
        # Initialize YTMusic (unauthenticated)
        yt = YTMusic(language="en", location=country)
        
        sections = []
        
        # 1. Get Charts data (without country param - let location handle it)
        try:
            charts = yt.get_charts()
            
            if charts and charts.get("songs") and charts["songs"].get("items"):
                sections.append({
                    "title": f"Top Songs - {country}",
                    "contents": charts["songs"]["items"]
                })
            
            if charts and charts.get("videos") and charts["videos"].get("items"):
                sections.append({
                    "title": f"Top Videos - {country}",
                    "contents": charts["videos"]["items"]
                })
            
            if charts and charts.get("artists") and charts["artists"].get("items"):
                sections.append({
                    "title": f"Top Artists - {country}",
                    "contents": charts["artists"]["items"]
                })
            
            if charts and charts.get("trending") and charts["trending"].get("items"):
                sections.append({
                    "title": "Trending Now",
                    "contents": charts["trending"]["items"]
                })
        except Exception as e:
            print(f"get_charts error: {e}")
        
        # 2. Get home data for additional sections
        try:
            home_data = yt.get_home(limit=10)
            if home_data and isinstance(home_data, list):
                sections.extend(home_data)
        except Exception as e:
            print(f"get_home error: {e}")
        
        return {
            "charts": sections,
            "meta": {
                "country": country,
                "total_sections": len(sections),
                "source": "YTMusic API (Unauthenticated)"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
