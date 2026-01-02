# CLAUDE.md - 프로젝트 개발 가이드

## 프로젝트 개요

**ROKEY NEWS** - AI 기반 뉴스 요약 및 감성 분석 웹 서비스

FastAPI 백엔드 + 정적 프론트엔드 아키텍처

## 배포 URL

- **Streamlit (레거시)**: https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app
- **FastAPI (로컬)**: http://localhost:8000

## 기술 스택

- **Backend**: FastAPI, httpx, python-dotenv
- **Frontend**: HTML5, CSS3 (Variables), Vanilla JS (ES6+)
- **뉴스 수집**: NewsAPI
- **AI 분석**: OpenAI GPT-4o-mini

## 디렉토리 구조

```
ROKEY_NEWS/
├── api_server.py       # FastAPI 메인 서버
├── index.html          # 대시보드 HTML
├── css/
│   └── style.css       # 스타일시트 (CSS Variables)
├── js/
│   └── app.js          # 프론트엔드 로직
├── .env                # API 키 (gitignore)
├── .env.example        # 환경 변수 템플릿
├── app.py              # Streamlit 앱 (레거시)
├── requirements.txt    # Python 의존성
├── CLAUDE.md           # 개발 가이드 (이 파일)
└── README.md           # 프로젝트 설명
```

## 주요 함수 (api_server.py)

| 함수 | 라인 | 역할 |
|------|------|------|
| `get_news()` | :80 | 뉴스 검색 + 자동 번역 |
| `analyze_news()` | :164 | AI 감성 분석 |
| `translate_articles()` | :453 | OpenAI 한국어 번역 |
| `parse_analysis_result()` | :259 | AI 응답 파싱 |
| `get_headlines()` | :313 | 헤드라인 뉴스 |
| `check_status()` | :374 | API 키 상태 확인 |
| `extract_keywords()` | :428 | 제목에서 키워드 추출 |

## 주요 함수 (js/app.js)

| 함수 | 역할 |
|------|------|
| `init()` | 앱 초기화 |
| `loadNews()` | 뉴스 API 호출 |
| `renderNewsGrid()` | 뉴스 카드 렌더링 |
| `openModal()` | 뉴스 상세 모달 |
| `runAiAnalysis()` | AI 분석 호출 |
| `displayAiResult()` | 감성 분석 결과 표시 |

## API 엔드포인트

### GET /api/news
뉴스 검색 (자동 한국어 번역)

```
파라미터:
- q: 검색 키워드
- category: all|tech|economy|politics|world|sports
- language: en|ko|ja|zh
- page_size: 1-20
- translate: true|false (기본: true)
```

### POST /api/analyze
AI 감성 분석

```json
{
  "title": "뉴스 제목",
  "content": "뉴스 내용"
}
```

응답:
```json
{
  "success": true,
  "summary_ko": "한국어 3줄 요약",
  "positive": 70,
  "negative": 30,
  "sentiment": "긍정적"
}
```

### GET /api/status
API 키 상태 확인

## 개발 명령어

```bash
# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install fastapi uvicorn httpx python-dotenv

# 서버 실행
python api_server.py

# 또는 uvicorn으로 실행 (자동 리로드)
uvicorn api_server:app --reload --port 8000
```

## 환경 변수 (.env)

```
NEWS_API_KEY=your_newsapi_key
OPENAI_API_KEY=your_openai_key
```

## API 설정

### NewsAPI
- 발급: https://newsapi.org
- 무료 플랜: 하루 100 요청
- 사용: 뉴스 검색, 헤드라인

### OpenAI API
- 발급: https://platform.openai.com
- 모델: gpt-4o-mini
- 사용: 한국어 번역, 감성 분석

## UI 디자인 시스템

### CSS Variables (style.css)
```css
--primary: #2563eb
--secondary: #64748b
--background: #f8fafc
--card-bg: #ffffff
--border: #e2e8f0
--radius-sm: 8px
--radius-md: 12px
--shadow: 0 4px 6px -1px rgba(0,0,0,0.1)
```

### 반응형 브레이크포인트
- Desktop: > 768px
- Mobile: <= 768px

## 알려진 제한사항

1. **NewsAPI 무료 플랜**: 하루 100 요청 제한
2. **번역 비용**: OpenAI API 호출 비용 발생
3. **CORS**: 브라우저에서 직접 NewsAPI 호출 불가 (프록시 필요)

## 버전 히스토리

### v2.0.0 - 2025-01-03
- FastAPI 백엔드 구현
- 실시간 NewsAPI 연동
- OpenAI 자동 한국어 번역
- AI 감성 분석 (긍정/부정)
- 모던 대시보드 UI

### v1.0.0 - 2024-12-31
- Streamlit MVP 릴리스
- NewsAPI 연동
- OpenAI 요약/감성분석
