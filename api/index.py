# ============================================
# VibeStation Backend - Main Entry Point
# ============================================
# Clean rewrite for Cloud Run deployment
# Uses ytmusicapi for unauthenticated YouTube Music access

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.music.home import router as home_router
from api.music.charts import router as charts_router
from api.music.search import router as search_router
from api.music.explore import router as explore_router
from api.music.artist import router as artist_router
from api.music.album import router as album_router

app = FastAPI(
    title="VibeStation API",
    description="YouTube Music data API for VibeStation",
    version="2.0.0"
)

# CORS - Allow all origins for now (can restrict to Vercel domain later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(home_router, prefix="/api/music/home", tags=["home"])
app.include_router(charts_router, prefix="/api/music/charts", tags=["charts"])
app.include_router(search_router, prefix="/api/music/search", tags=["search"])
app.include_router(explore_router, prefix="/api/music/explore", tags=["explore"])
app.include_router(artist_router, prefix="/api/music/artist", tags=["artist"])
app.include_router(album_router, prefix="/api/music/album", tags=["album"])

@app.get("/")
def root():
    return {"status": "ok", "message": "VibeStation API v2.0 is running"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "version": "2.0.0"}
