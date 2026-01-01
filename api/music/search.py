from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("")
def search(query: str):
    try:
        # User requested NO LIMITS.
        # Default is usually 20. We increase to 100 to provide maximum data.
        results = yt.search(query, limit=100)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
