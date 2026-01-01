# ============================================
# /api/music/album - Album Details
# ============================================

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("/{album_id}")
def get_album(album_id: str):
    """
    Get detailed information about an album.
    
    Args:
        album_id: YouTube Music album browse ID (starts with MPREb_)
    """
    try:
        yt = YTMusic(language="en")
        album = yt.get_album(album_id)
        return {"album": album}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
