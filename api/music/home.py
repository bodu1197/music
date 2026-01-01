from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()
yt = YTMusic()

@router.get("/")
def get_home():
    try:
        # Note: language and location should ideally be dynamic based on request headers
        home_data = yt.get_home()
        return {"home": home_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
