from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # USER REQUEST: MUST USE get_home() FOR THIS PAGE TO GET RICH DATA (14+ SECTIONS)
        # Replacing get_charts() logic with get_home() logic.
        
        # 1. Dynamic Location
        detected_country = request.headers.get("x-vercel-ip-country", country)
        
        # 2. Use JP/KR/US based on detection
        yt = YTMusic(language="en", location=detected_country)
        
        # 3. Call get_home() instead of get_charts()
        # This returns the full dashboard (New Releases, Charts, Moods, etc.)
        # providing much more content than the specific chart endpoint.
        data = yt.get_home()
        
        return {"charts": data, "meta": {"src": "get_home_proxy", "country": detected_country}}
        
    except Exception as e:
        print(f"Error fetching music page data via get_home: {e}")
        raise HTTPException(status_code=500, detail=str(e))
