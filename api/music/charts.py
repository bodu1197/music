from fastapi import APIRouter, HTTPException, Request
from ytmusicapi import YTMusic
import json

router = APIRouter()

@router.get("")
def get_charts(request: Request, country: str = "US"):
    try:
        # ANALYSIS OF "ONLY 2 SECTIONS" ISSUE:
        # YouTube Music returns a restricted "Guest" view (usually just Charts & New Releases)
        # when it detects requests coming from Datacenter IPs (like Vercel/AWS) without proper browser headers.
        
        # FIX ATTEMPT: HEADER SPOOFING
        # We inject real Chrome headers to trick YouTube into treating this as a residential browser request.
        
        target_country = country if country else request.headers.get("x-vercel-ip-country", "US")
        
        # 1. Setup YTMusic with explicit language/location
        yt = YTMusic(language="en", location=target_country)
        
        # 2. INJECT HEADERS (The Fix)
        # Overwrite the default user-agent which might be 'python-requests/x.y.z'
        yt.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://music.youtube.com/",
            "Origin": "https://music.youtube.com"
        })
        
        # 3. Call get_home() with the spoofed headers
        home_data = yt.get_home()
        
        # DEBUG METADATA (Preserved for verification)
        debug_titles = [shelf.get('title', 'No Title') for shelf in home_data]
        
        return {
            "charts": home_data, 
            "meta": {
                "country": target_country, 
                "total_sections": len(home_data),
                "section_titles": debug_titles,
                "note": "Header spoofing applied"
            }
        }
        
    except Exception as e:
        print(f"Error fetching music home: {e}")
        raise HTTPException(status_code=500, detail=str(e))
