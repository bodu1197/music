from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("/{channel_id}")
def get_artist(channel_id: str):
    try:
        artist = yt.get_artist(channel_id)
        return {"artist": artist}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{channel_id}/albums")
def get_artist_albums(channel_id: str, params: str = None):
    try:
        albums = yt.get_artist_albums(channel_id, params=params)
        return {"albums": albums}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
