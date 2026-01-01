# Sori Music - Implementation Walkthrough & Records

## Overview
We have successfully integrated a robust music feed into the User Profile page, featuring automatic country detection, manual country selection, and performance optimization.

## Technical Implementation Reference

### 1. Backend Enhancement (`sori-music-backend`)

#### Localization Support
- **Endpoint**: Modified `/home` (GET) to accept `country` (e.g., 'KR', 'US') and `language` (e.g., 'ko', 'en') query parameters.
- **Client Logic**: Updated `get_ytmusic()` to dynamically initialize `YTMusic(location=..., language=...)` based on these requests. This allows extracting locale-specific data without needing a new server instance.

#### Stability & Robustness
- **Retry Logic**: Implemented `run_with_retry` decorator.
    - **Backoff**: Exponential backoff (1s, 2s, 4s...) to handle transient Google 500/503 errors.
    - **Effect**: Drastically reduced "Internal Server Error" caused by rate limiting or temporary blocking.

### 2. Frontend Personalization (`Next.js`)

#### Intelligent Country Detection (`ProfilePage.tsx`)
We implemented a 3-layer detection strategy to ensure a seamless user experience:
1.  **LocalStorage Check**: First, checking `user_country_code` in the browser. If found, we use it immediately (Zero Latency).
2.  **IP Geolocation**: If no preference is saved, we call `https://ipapi.co/json/` to detect the user's real physical location.
3.  **Fallback**: Default to 'US' (United States) only if both methods fail.

**User Experience Fix**: Originally, the app defaulted to US content while detecting, causing a "flash" of incorrect content. We fixed this by blocking the Music tab rendering until the detection is complete (`currentCountry` state is set), showing a "Detecting..." placeholder instead.

#### Performance Optimization (`SWR` & `Prefetching`)
- **Library**: Replaced standard `useEffect` usage with **SWR** (Stale-While-Revalidate).
- **Strategy**:
    - **Prefetch**: The moment `ProfilePage` mounts, we start fetching music data in the background (`preload(...)`).
    - **Cache**: Data is cached by keys `['/music/home', 'KR', 'ko']`. Switching countries and coming back is instant.
    - **No Spinners**: Users rarely see a loading spinner because data is fetched before they even click the "MUSIC" tab.

#### UI Components
- **`CountrySelector.tsx`**: A controlled component using `popover` and `command`.
    - **Searchable**: Users can type "Korea" or "Japan" to filter the list.
    - **Controlled**: Now purely controlled by parent state to prevent sync issues.
- **`MusicTab.tsx`**: The main display component.
    - **Crash Prevention**: Added strict null-checks throughout the rendering loop. This prevented the app from crashing when `ytmusicapi` returns partial/null data for certain song items.

### 3. Cleanup & Polish
- **Route Removal**: Completely deleted the old `/music` page and removed its link from the Sidebar to unify the experience into the Profile page.
- **Dark Mode Fix**: Restored global CSS variables to force Dark Mode (`#000000` background), fixing a regression where the screen turned white.
- **Visibility Fix**: Added missing Shadcn CSS variables to ensure the Dropdown menu is visible and styled correctly.

### 4. Critical Bug Fixes
- **Language Parameter Regression & Crash Fix**:
    - **Issue**: Users reported Korean content appeared as US content (English titles) when language wasn't passed. However, passing `language='id'` for Indonesia caused a 500 Error because `ytmusicapi` rejects unsupported language codes.
    - **Fix**: Implemented a "Safe Language Fallback" in the backend. 
    - **Logic**: If the requested language (e.g., `ko`, `ja`) is supported by `ytmusicapi`, we use it. If not (e.g., `id`, `th`), we default to `en`. This ensures Korea gets Korean titles, while Indonesia works without crashing (relying on `location` for content).
    - **Result**: Solved the 500 Error for Indonesia and maintained correct localization for Korea.

## Verification Checklist
- [x] Auto-detects KR (or local country) on first visit.
- [x] "Detecting..." message shows briefly instead of flashing US content.
- [x] Switching to US/JP instantly updates the list.
- [x] No white screen or invisible dropdowns.
- [x] No crash on null song titles.
- [x] **Verified International**: Indonesia (ID) and Korea (KR) show correct local content/language.
