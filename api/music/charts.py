from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # PURE IMPLEMENTATION AS REQUESTED
        # According to ytmusicapi specs, get_home() works for unauthenticated users
        # and returns a full layout of shelves (~10+ sections).
        
        # 1. Location Strategy
        # Use query param if provided (dropdown), else fallback to Vercel IP header, else US.
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        # 2. Initialization
        # Language is English (UI), Location determines the content (KR, JP, etc.)
        yt = YTMusic(language="en", location=target_country)
        
        # 3. Execution
        # No extra searches. No manual appends. No "smart" logic.
        # Just pure ytmusicapi get_home().
        home_data = yt.get_home()
        
        return {
            "charts": home_data,
            "meta": {
                "country": target_country,
                "note": "Pure get_home response"
            }
        }
        
    except Exception as e:
        print(f"Error in pure get_home: {e}")
        # Return internal server error if the library itself fails
        raise HTTPException(status_code=500, detail=str(e))
