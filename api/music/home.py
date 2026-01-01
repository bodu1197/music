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
            if home_data:
                sections.extend(home_data)
        except Exception as e:
            print(f"get_home error: {e}")
        
        # 2. Get Charts - Top songs, videos, artists
        try:
            charts = yt.get_charts(country=country)
            
            if charts.get("songs", {}).get("items"):
                sections.append({
                    "title": f"Top Songs ({country})",
                    "contents": charts["songs"]["items"][:20]
                })
            
            if charts.get("videos", {}).get("items"):
                sections.append({
                    "title": f"Top Music Videos ({country})",
                    "contents": charts["videos"]["items"][:20]
                })
            
            if charts.get("artists", {}).get("items"):
                sections.append({
                    "title": f"Trending Artists ({country})",
                    "contents": charts["artists"]["items"][:15]
                })
        except Exception as e:
            print(f"get_charts error: {e}")
        
        # 3. Get New Releases
        try:
            new_releases = yt.get_new_releases()
            if new_releases:
                sections.append({
                    "title": "New Releases",
                    "contents": new_releases[:20]
                })
        except Exception as e:
            print(f"get_new_releases error: {e}")
        
        # 4. Get Moods & Genres categories
        try:
            moods = yt.get_mood_categories()
            if moods:
                # Flatten all mood playlists into one section
                all_moods = []
                for category in moods[:3]:  # Top 3 categories
                    if "params" in category:
                        try:
                            playlists = yt.get_mood_playlists(category["params"])
                            if playlists:
                                all_moods.extend(playlists[:5])
                        except:
                            pass
                if all_moods:
                    sections.append({
                        "title": "Moods & Genres",
                        "contents": all_moods
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
