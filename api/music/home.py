from fastapi import APIRouter, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_home():
    try:
        # GLOBAL PLATFORM SETTING
        # We use US/English to retrieve the standard global content.
        # This returns the full set of shelves (New Releases, Charts, Moods, etc.)
        yt = YTMusic(language="en", location="US")
        
        home_data = yt.get_home()
        
        return {"home": home_data}

    except Exception as e:
        # If it fails (e.g. Vercel IP block), we report the error honestly.
        # No fake data.
        print(f"Error fetching global home data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
