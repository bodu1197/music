from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("/")
def get_charts(country: str = "US"):
    try:
        charts = yt.get_charts(country=country)
        return {"charts": charts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
