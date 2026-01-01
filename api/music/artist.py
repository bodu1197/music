# ============================================
# /api/music/artist - Artist Details
# ============================================

from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("/{artist_id}")
def get_artist(artist_id: str):
    """
    Get detailed information about an artist.
    
    Args:
        artist_id: YouTube Music artist channel ID
    """
    try:
        yt = YTMusic(language="en")
        artist = yt.get_artist(artist_id)
        return {"artist": artist}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{artist_id}/albums")
def get_artist_albums(artist_id: str):
    """Get all albums by an artist."""
    try:
        yt = YTMusic(language="en")
        artist = yt.get_artist(artist_id)
        
        albums = []
        if artist.get("albums", {}).get("browseId"):
            albums = yt.get_artist_albums(
                artist["albums"]["browseId"],
                artist["albums"].get("params")
            )
        
        return {"albums": albums}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
