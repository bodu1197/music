# ============================================
# /api/music/home - YouTube Music Home Feed
# ============================================
# Returns combined data from multiple YTMusic sources
# to provide a rich, full homepage experience

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_home_feed(country: str = "US"):
    """
    Get rich home feed data by combining multiple YTMusic sources.
    Since unauthenticated get_home() returns limited sections,
    we combine it with other data sources for a complete experience.
    """
    try:
        # Initialize YTMusic for unauthenticated access
        yt = YTMusic(language="en", location=country)
        
        sections = []
        
        # 1. Get Home sections (whatever YouTube gives us)
        try:
            home_data = yt.get_home(limit=10)
            if home_data and isinstance(home_data, list):
                sections.extend(home_data)
        except Exception as e:
            print(f"get_home error: {e}")
        
        # 2. Get Charts - Top songs, videos, artists (no country param)
        try:
            charts = yt.get_charts()
            
            if charts and charts.get("songs") and charts["songs"].get("items"):
                items = charts["songs"]["items"]
                sections.append({
                    "title": f"Top Songs ({country})",
                    "contents": items[:20] if len(items) > 20 else items
                })
            
            if charts and charts.get("videos") and charts["videos"].get("items"):
                items = charts["videos"]["items"]
                sections.append({
                    "title": f"Top Music Videos ({country})",
                    "contents": items[:20] if len(items) > 20 else items
                })
            
            if charts and charts.get("artists") and charts["artists"].get("items"):
                items = charts["artists"]["items"]
                sections.append({
                    "title": f"Trending Artists ({country})",
                    "contents": items[:15] if len(items) > 15 else items
                })
        except Exception as e:
            print(f"get_charts error: {e}")
        
        # 3. Get New Releases
        try:
            new_releases = yt.get_new_releases()
            if new_releases and isinstance(new_releases, list) and len(new_releases) > 0:
                sections.append({
                    "title": "New Releases",
                    "contents": new_releases[:20] if len(new_releases) > 20 else new_releases
                })
        except Exception as e:
            print(f"get_new_releases error: {e}")
        
        # 4. Get Moods & Genres categories (simplified - just categories)
        try:
            moods = yt.get_mood_categories()
            if moods and isinstance(moods, list) and len(moods) > 0:
                sections.append({
                    "title": "Moods & Genres",
                    "contents": moods[:10] if len(moods) > 10 else moods
                })
        except Exception as e:
            print(f"get_mood_categories error: {e}")
        
        return {
            "sections": sections,
            "meta": {
                "country": country,
                "total_sections": len(sections),
                "source": "YTMusic API (Unauthenticated)"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
