from fastapi import FastAPI
from api.music.search import router as search_router
from api.music.home import router as home_router
from api.music.explore import router as explore_router
from api.music.charts import router as charts_router
from api.music.artist import router as artist_router
from api.music.album import router as album_router

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ... imports ...

app = FastAPI()

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router, prefix="/api/music/search", tags=["search"])
app.include_router(home_router, prefix="/api/music/home", tags=["home"])
app.include_router(explore_router, prefix="/api/music/explore", tags=["explore"])
app.include_router(charts_router, prefix="/api/music/charts", tags=["charts"])
app.include_router(artist_router, prefix="/api/music/artist", tags=["artist"])
app.include_router(album_router, prefix="/api/music", tags=["album"]) # prefixes handle sub-routes

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "VibeStation API is running"}
