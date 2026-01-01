from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # 1. Location & Setup
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        yt = YTMusic(language="en", location=target_country)
        
        # 2. Get Home Data (limit=100 to fetch ALL sections, default is only 3!)
        home_data = yt.get_home(limit=100)
        original_count = len(home_data) if home_data else 0
        
        # 3. PURE API MODE (No Augmentation)
        # Verify Cloud Run capability without artificial fillers.
        
        
        # Debug titles again
        debug_titles = [shelf.get('title', 'No Title') for shelf in home_data]
        
        return {
            "charts": home_data, 
            "meta": {
                "country": target_country, 
                "total_sections": len(home_data),
                "section_titles": debug_titles,
                "source": "Pure API (Cloud Run)"
            }
        }
        
    except Exception as e:
        print(f"Error in hybrid get_home: {e}")
        raise HTTPException(status_code=500, detail=str(e))
