from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_explore(request: Request, country: str = None):
    try:
        # Dynamic Location for Explore as well
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        yt = YTMusic(language="en", location=target_country)
        
        # Explore typically implies "Charts" and "New Releases" in many apps if not using Home.
        # We fetch charts for the specific country.
        data = yt.get_charts(country=target_country)
        
        return {"explore": data, "meta": {"country": target_country}}
    except Exception as e:
        # Fallback or error report
        print(f"Explore error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
