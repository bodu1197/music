from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # PURE IMPLEMENTATION
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        yt = YTMusic(language="en", location=target_country)
        home_data = yt.get_home()
        
        # DEBUG INFO
        # Create a list of titles to verify what the server actually sees
        debug_titles = [shelf.get('title', 'No Title') for shelf in home_data]
        
        return {
            "charts": home_data,
            "meta": {
                "country": target_country,
                "total_sections": len(home_data),
                "section_titles": debug_titles,
                "source": "api_debug_mode"
            }
        }
        
    except Exception as e:
        print(f"Error in pure get_home: {e}")
        raise HTTPException(status_code=500, detail=str(e))
