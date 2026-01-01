from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("/album/{browse_id}")
def get_album(browse_id: str):
    try:
        album = yt.get_album(browse_id)
        return {"album": album}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/song/{video_id}")
def get_song(video_id: str):
    try:
        song = yt.get_song(video_id)
        return {"song": song}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lyrics/{browse_id}")
def get_lyrics(browse_id: str):
    try:
        lyrics = yt.get_lyrics(browse_id)
        return {"lyrics": lyrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
