from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = None):
    try:
        # PRIORITY: User selected country > Vercel Header > Default US
        # This allows the user to manually switch countries via the dropdown as requested.
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        # Init YTMusic with the targeted location
        # language is fixed to english for UI consistency, or could match country if needed.
        # usually users prefer English UI but Local Content.
        yt = YTMusic(language="en", location=target_country)
        
        # User reported getting only 2 sections. 
        # Unauthenticated get_home() can be limited, but changing location often helps.
        # We return the exact raw response.
        data = yt.get_home()
        
        return {
            "charts": data, 
            "meta": {
                "country": target_country, 
                "source": "get_home_proxy",
                "length": len(data) if data else 0 
            }
        }
        
    except Exception as e:
        print(f"Error fetching music home for {country}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
