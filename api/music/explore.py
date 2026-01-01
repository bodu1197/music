from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("")
def get_explore():
    try:
        data = yt.get_charts(country="US") # Explore usually maps to charts/new releases
        # Note: ytmusicapi's 'get_explore' might be different or deprecated, using get_charts/new releases as standard 'explore'
        # Or specifically get_mood_categories logic if that's what is meant by explore in V1
        return {"explore": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
