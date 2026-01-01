from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # 1. Location & Setup
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        yt = YTMusic(language="en", location=target_country)
        yt.headers.update({
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
             "Accept-Language": "en-US,en;q=0.9",
        })
        
        # 2. Get Home Data
        home_data = yt.get_home()
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
