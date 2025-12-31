# CLAUDE.md - 프로젝트 개발 가이드

## 프로젝트 개요

**뉴스 요약 및 감성 분석 웹 서비스** - Streamlit 기반 MVP

## 🚀 배포 URL

**Production**: https://rokeynewsgit-knceenigwbke39s2wu4o2k.streamlit.app

## 기술 스택

- **Frontend/Backend**: Streamlit (Python)
- **뉴스 수집**: NewsAPI (newsapi-python)
- **AI 분석**: OpenAI GPT-4o-mini
- **배포**: Streamlit Cloud

## 디렉토리 구조

```
news-summary-app/
├── app.py              # 메인 애플리케이션
├── requirements.txt    # 의존성 패키지
├── .env.example        # 환경 변수 템플릿
├── .gitignore          # Git 무시 파일
├── CLAUDE.md           # 개발 가이드 (이 파일)
└── README.md           # 프로젝트 설명
```

## 주요 함수

| 함수 | 위치 | 역할 |
|------|------|------|
| `fetch_news()` | app.py:47 | NewsAPI로 뉴스 수집 |
| `summarize_and_analyze()` | app.py:82 | OpenAI로 요약 + 감성분석 |
| `parse_analysis_result()` | app.py:133 | AI 응답 파싱 |
| `display_news_card()` | app.py:175 | 뉴스 카드 UI 렌더링 |
| `main()` | app.py:250 | 앱 진입점 |

## 개발 명령어

```bash
# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 앱 실행
streamlit run app.py

# 특정 포트로 실행
streamlit run app.py --server.port 8501
```

## API 설정

### NewsAPI
- 발급: https://newsapi.org
- 무료 플랜: 하루 100 요청
- **주의**: 무료 플랜에서 한국어(ko) 뉴스 소스 제한적

### OpenAI API
- 발급: https://platform.openai.com
- 모델: gpt-4o-mini (비용 효율적)

## 알려진 제한사항

1. **한국어 뉴스 미지원**: NewsAPI 무료 플랜에서 한국어 소스 거의 없음
2. **뉴스 기간**: 최근 1개월 이내 뉴스만 검색 가능
3. **요청 제한**: 무료 플랜 하루 100회

## 향후 개선 사항

- [ ] 한국어 뉴스 지원 (네이버 뉴스 API 또는 크롤링)
- [ ] 뉴스 북마크 기능
- [ ] 감성 분석 결과 시각화 (차트)
- [ ] 키워드 트렌드 분석
- [ ] 다크 모드 지원

## 버전 히스토리

### v0.1.0 (MVP) - 2024-12-31
- 초기 MVP 릴리스
- NewsAPI 연동
- OpenAI GPT-4o-mini 요약/감성분석
- Streamlit UI 구현
