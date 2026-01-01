# VibeStation 개발 계획 (인스타그램 클론 + YouTube Music)

## 목표 설명
**"인스타그램 UI 100% 복사 + 음악 기능 + 쇼핑몰"**
VibeStation은 인스타그램의 UX/UI를 그대로 차용하여 사용자에게 친숙함을 주되, YouTube Music의 방대한 음악 데이터와 개인 쇼핑몰 기능을 통합한 글로벌 플랫폼입니다.

## 기술 스택 (User Defined)
- **Frontend**: Next.js (App Router), Tailwind CSS (Vercel 배포)
- **Backend API**: Python (Vercel Serverless Functions) - `ytmusicapi` 활용
- **Database**: Supabase
- **Storage/Auth**: Supabase

## 주요 변경 및 구현 계획

### 1. UI/UX: 인스타그램 100% 클론
- **레이아웃 전략**:
    - **Mobile**: 상단 헤더, 하단 탭 바 (홈, 검색, 업로드, 릴스/음악, 프로필).
    - **Desktop**: 좌측 사이드바 네비게이션, 중앙 피드, 우측 추천 패널 (반응형 웹앱).
- **디자인 디테일**:
    - 인스타그램 특유의 아이콘, 폰트 스타일, 여백, 인터랙션 모방.
    - **Dark Mode** 기본 (음악 앱 특성 고려하되 인스타그램 다크모드 참조).

### 2. Backend: Vercel Python Runtime
- `api/` 디렉토리에 Python 스크립트 배치.
- `requirements.txt`: `ytmusicapi`, `fastapi` (선택적) 등 명시.
- `vercel.json`: Python 런타임 설정.
- **API Endpoints**:
    - `/api/music/search`: 음악 검색 (ytmusicapi)
    - `/api/music/home`: 홈 피드 데이터

### 3. Database: Supabase Integration
- `lib/supabase.ts`: Supabase 클라이언트 설정.
- 환경 변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 검증 계획
- **UI 일치도**: 인스타그램 모바일/웹 UI와 비교.
- **API 기능**: Vercel 배포 후 Python API 정상 동작 확인 (Logs).
- **데이터 보존**: `ytmusicapi` 응답 데이터 전체가 프론트엔드까지 전달되는지 확인.
