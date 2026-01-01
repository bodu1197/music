# ============================================
# /api/music/search - YouTube Music Search
# ============================================

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def search(query: str, filter: str = None, limit: int = 20):
    """
    Search YouTube Music for songs, albums, artists, videos, playlists.
    
    Args:
        query: Search query string
        filter: Optional filter (songs, albums, artists, videos, playlists)
        limit: Maximum number of results (default 20)
    """
    try:
        yt = YTMusic(language="en")
        
        results = yt.search(query, filter=filter, limit=limit)
        
        return {
            "results": results,
            "meta": {
                "query": query,
                "filter": filter,
                "count": len(results)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
