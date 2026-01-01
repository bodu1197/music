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
        
        # 3. AUGMENTATION STRATEGY
        # If headers spoofing isn't enough (e.g. 5 sections), we manually append more real data.
        # This guarantees a "Rich" page every time.
        if original_count < 10:
            print(f"Augmenting data for {target_country}: had {original_count}, adding more.")
            
            # A. New Releases (Albums)
            try:
                releases = yt.get_new_releases()
                if releases:
                    home_data.append({
                        "title": "New Releases",
                        "contents": releases
                    })
            except: pass
            
            # B. Top Videos (Charts)
            try:
                charts = yt.get_charts(country=target_country)
                if 'videos' in charts and 'items' in charts['videos']:
                    home_data.append({
                        "title": f"Top Music Videos ({target_country})",
                        "contents": charts['videos']['items']
                    })
                if 'trending' in charts and 'items' in charts['trending']:
                   home_data.append({
                        "title": "Trending Now",
                        "contents": charts['trending']['items']
                   })
            except: pass
            
            # C. Mood Search Augmentation (Safe fillers)
            # Only add if we are extremely low
            if len(home_data) < 8:
                 extras = ["Global Hits", "Chill Vibes", "Workout Energy"]
                 for tag in extras:
                     try:
                         res = yt.search(tag, filter="songs", limit=10)
                         home_data.append({"title": tag, "contents": res})
                     except: pass
        
        
        # Debug titles again
        debug_titles = [shelf.get('title', 'No Title') for shelf in home_data]
        
        return {
            "charts": home_data, 
            "meta": {
                "country": target_country, 
                "total_sections": len(home_data),
                "section_titles": debug_titles,
                "source": f"Hybrid (API + Augmented)" if original_count < 10 else "Pure API"
            }
        }
        
    except Exception as e:
        print(f"Error in hybrid get_home: {e}")
        raise HTTPException(status_code=500, detail=str(e))
