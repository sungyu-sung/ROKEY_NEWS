# ROKEY NEWS

AI 기반 뉴스 요약 및 감성 분석 웹 서비스

## Live Demo

- **Streamlit App**: [https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app](https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app)
- **Static Dashboard**: `index.html` (로컬 실행)

## 주요 기능

| 기능 | Streamlit App | Static Dashboard |
|------|--------------|------------------|
| 뉴스 검색 | NewsAPI 연동 | 샘플 데이터 |
| AI 요약 | GPT-4o-mini | 정적 요약 |
| 감성 분석 | 긍정/부정 % | - |
| 카테고리 필터 | 언어별 | 기술/경제/정치/국제/스포츠 |
| 반응형 UI | Streamlit | Desktop First |

## 프로젝트 구조

```
ROKEY_NEWS/
├── app.py              # Streamlit 메인 앱
├── requirements.txt    # Python 의존성
├── .env.example        # 환경 변수 템플릿
├── index.html          # 정적 대시보드 UI
├── css/
│   └── style.css       # UI 스타일시트
├── js/
│   └── app.js          # 대시보드 JavaScript
├── CLAUDE.md           # 개발 가이드
└── README.md
```

## UI 디자인 시스템

### 컴포넌트 스타일
- **Minimal Flat**: border 1px solid #e2e8f0, transparent 배경
- **Rounded Soft**: border-radius 12px, box-shadow 0 4px 6px

### 타이포그래피
- **영문**: Roboto (300-700)
- **한글**: Noto Sans KR (300-700)
- **행간**: 1.4-1.5

### 애니메이션
- **Smooth Slide**: transform translateX, 0.3s ease-in-out
- GPU 가속 활용
- prefers-reduced-motion 접근성 고려

### 레이아웃
- **그리드**: Bootstrap 12컬럼 호환
- **컨테이너**: max-width 1200px
- **사이드바**: 280px 고정
- **반응형**: Desktop First (768px 브레이크포인트)

## 기술 스택

### Streamlit App
- Python Streamlit
- NewsAPI (80,000+ 글로벌 뉴스 소스)
- OpenAI GPT-4o-mini

### Static Dashboard
- HTML5 / CSS3 (Variables, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Google Fonts

## 설치 및 실행

### Streamlit App

```bash
# 저장소 클론
git clone https://github.com/sungyu-sung/ROKEY_NEWS.git
cd ROKEY_NEWS

# 가상환경 설정
python -m venv venv
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 앱 실행
streamlit run app.py
```

### Static Dashboard

```bash
# Live Server 또는
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

## API 키 발급

| API | 발급 URL | 비용 |
|-----|----------|------|
| NewsAPI | https://newsapi.org | 무료 (100요청/일) |
| OpenAI | https://platform.openai.com | 유료 |

## 향후 계획

- [ ] 한국어 뉴스 지원 (네이버 API 연동)
- [ ] Static Dashboard에 실제 API 연동
- [ ] 감성 분석 시각화 개선
- [ ] 뉴스 북마크/저장 기능
- [ ] 다크 모드 지원
- [ ] PWA 지원

## 라이선스

MIT License
