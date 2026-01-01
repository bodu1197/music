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
        
        # Get charts data
        charts = yt.get_charts(country=country)
        
        sections = []
        
        # Songs chart
        if charts.get("songs", {}).get("items"):
            sections.append({
                "title": f"Top Songs - {country}",
                "contents": charts["songs"]["items"]
            })
        
        # Videos chart
        if charts.get("videos", {}).get("items"):
            sections.append({
                "title": f"Top Videos - {country}",
                "contents": charts["videos"]["items"]
            })
        
        # Artists chart
        if charts.get("artists", {}).get("items"):
            sections.append({
                "title": f"Top Artists - {country}",
                "contents": charts["artists"]["items"]
            })
        
        # Trending
        if charts.get("trending", {}).get("items"):
            sections.append({
                "title": "Trending Now",
                "contents": charts["trending"]["items"]
            })
        
        # Also get home data for additional sections
        try:
            home_data = yt.get_home(limit=10)
            if home_data:
                sections.extend(home_data)
        except:
            pass
        
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
