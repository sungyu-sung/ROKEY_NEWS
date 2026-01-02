# ROKEY NEWS

AI 기반 뉴스 요약 및 감성 분석 웹 서비스

## Live Demo

- **Streamlit App**: [https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app](https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app)
- **FastAPI Dashboard**: `http://localhost:8000` (로컬 실행)

## 주요 기능

| 기능 | 설명 |
|------|------|
| 실시간 뉴스 | NewsAPI 연동 (80,000+ 글로벌 소스) |
| 자동 한국어 번역 | OpenAI GPT-4o-mini로 제목/요약 번역 |
| AI 감성 분석 | 긍정/부정 비율 분석 |
| 한국어 요약 | 뉴스 내용 3줄 요약 |
| 카테고리 필터 | 기술/경제/정치/국제/스포츠 |
| 반응형 UI | Desktop First 대시보드 |

## 프로젝트 구조

```
ROKEY_NEWS/
├── api_server.py       # FastAPI 백엔드 서버
├── index.html          # 대시보드 UI
├── css/
│   └── style.css       # UI 스타일시트
├── js/
│   └── app.js          # 프론트엔드 JavaScript
├── .env                # API 키 (gitignore)
├── .env.example        # 환경 변수 템플릿
├── app.py              # Streamlit 앱 (레거시)
├── requirements.txt    # Python 의존성
├── CLAUDE.md           # 개발 가이드
└── README.md
```

## 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   FastAPI   │────▶│  NewsAPI    │
│  (index.html)│     │  (Proxy)    │     │  (뉴스 수집) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   OpenAI    │
                    │ (번역/분석)  │
                    └─────────────┘
```

## UI 디자인 시스템

### 컴포넌트 스타일
- **Minimal Flat**: border 1px solid #e2e8f0, transparent 배경
- **Rounded Soft**: border-radius 12px, box-shadow 0 4px 6px

### 타이포그래피
- **영문**: Roboto (300-700)
- **한글**: Noto Sans KR (300-700)

### 레이아웃
- **그리드**: Bootstrap 12컬럼 호환
- **컨테이너**: max-width 1200px
- **사이드바**: 280px 고정
- **반응형**: Desktop First (768px 브레이크포인트)

## 기술 스택

### Backend
- **FastAPI**: 비동기 API 서버
- **httpx**: 비동기 HTTP 클라이언트
- **python-dotenv**: 환경 변수 관리

### Frontend
- **HTML5 / CSS3**: Variables, Flexbox, Grid
- **Vanilla JavaScript**: ES6+
- **Google Fonts**: Roboto, Noto Sans KR

### External APIs
- **NewsAPI**: 글로벌 뉴스 수집
- **OpenAI GPT-4o-mini**: 번역 및 감성 분석

## 설치 및 실행

### 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/sungyu-sung/ROKEY_NEWS.git
cd ROKEY_NEWS

# 가상환경 설정
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install fastapi uvicorn httpx python-dotenv

# 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 서버 실행
python api_server.py

# 브라우저에서 http://localhost:8000 접속
```

### 환경 변수 (.env)

```
NEWS_API_KEY=your_newsapi_key_here
OPENAI_API_KEY=your_openai_key_here
```

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/` | GET | 대시보드 UI |
| `/api/news` | GET | 뉴스 검색 (자동 번역) |
| `/api/headlines` | GET | 헤드라인 뉴스 |
| `/api/analyze` | POST | AI 감성 분석 |
| `/api/status` | GET | API 상태 확인 |

## API 키 발급

| API | 발급 URL | 비용 |
|-----|----------|------|
| NewsAPI | https://newsapi.org | 무료 (100요청/일) |
| OpenAI | https://platform.openai.com | 유료 (GPT-4o-mini) |

## 스크린샷

### 메인 대시보드
- 사이드바 카테고리 네비게이션
- 헤드라인 뉴스 카드
- 뉴스 그리드 (자동 한국어 번역)

### AI 분석 모달
- 한국어 3줄 요약
- 긍정/부정 감성 바 차트
- 원문 링크

## 향후 계획

- [x] ~~실시간 뉴스 API 연동~~
- [x] ~~자동 한국어 번역~~
- [x] ~~AI 감성 분석~~
- [ ] 다크 모드 지원
- [ ] 뉴스 북마크/저장 기능
- [ ] PWA 지원
- [ ] 클라우드 배포 (Render/Vercel)

## 라이선스

MIT License
