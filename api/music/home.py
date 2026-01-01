from fastapi import APIRouter, Request, HTTPException
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_home(request: Request):
    try:
        # PURE GET_HOME IMPLEMENTATION
        # 1. Detect User Location (e.g., JP, KR, US) from Vercel Header
        user_country = request.headers.get("x-vercel-ip-country", "US")
        
        # 2. Init YTMusic with English UI but Local Content
        yt = YTMusic(language="en", location=user_country)
        
        # 3. Call get_home() exactly as requested
        home_data = yt.get_home()
        
        return {"home": home_data}

    except Exception as e:
        print(f"Error checking home ({user_country}): {e}")
        # Return error details so we can debug if Vercel blocks it
        raise HTTPException(status_code=500, detail=str(e))
