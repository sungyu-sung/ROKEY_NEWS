"""
ROKEY NEWS API Server
- NewsAPI 프록시 서버
- OpenAI 요약 및 감성 분석
- 뉴스 자동 한국어 번역
- CORS 지원
- 기본 API 키 제공 + 사용자 키 지원
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import asyncio
import json
import os
import re
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

app = FastAPI(title="ROKEY NEWS API", version="2.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 기본 API 키 (환경변수에서 로드)
DEFAULT_NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
DEFAULT_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# 카테고리 매핑 (한글 -> 영어 키워드)
CATEGORY_KEYWORDS = {
    "all": "",
    "tech": "technology OR AI OR software OR startup",
    "economy": "economy OR finance OR stock OR business",
    "politics": "politics OR government OR election",
    "world": "international OR global OR world news",
    "sports": "sports OR football OR baseball OR soccer"
}


class NewsResponse(BaseModel):
    success: bool
    data: list
    message: str = ""


class AnalysisRequest(BaseModel):
    title: str
    content: str
    openai_key: str = ""


class AnalysisResponse(BaseModel):
    success: bool
    summary_ko: str = ""
    summary_original: str = ""
    positive: int = 50
    negative: int = 50
    sentiment: str = "중립"
    message: str = ""


@app.get("/")
async def root():
    """정적 HTML 페이지 서빙"""
    return FileResponse("index.html")


@app.get("/api/news")
async def get_news(
    q: str = Query(default="", description="검색 키워드"),
    category: str = Query(default="all", description="카테고리"),
    language: str = Query(default="en", description="언어 코드"),
    page_size: int = Query(default=10, ge=1, le=20, description="결과 수"),
    api_key: str = Query(default="", description="사용자 API 키 (선택)"),
    translate: bool = Query(default=True, description="한국어 번역 여부")
):
    """
    뉴스 검색 API
    - 사용자 키가 없으면 기본 키 사용
    - NewsAPI의 everything 엔드포인트 사용
    - 자동 한국어 번역 지원
    """
    # API 키 결정
    news_api_key = api_key if api_key else DEFAULT_NEWS_API_KEY

    if not news_api_key:
        raise HTTPException(
            status_code=400,
            detail="API 키가 설정되지 않았습니다. 설정에서 NewsAPI 키를 입력해주세요."
        )

    # 검색어 구성
    search_query = q
    if category != "all" and category in CATEGORY_KEYWORDS:
        category_keywords = CATEGORY_KEYWORDS[category]
        if search_query:
            search_query = f"({search_query}) AND ({category_keywords})"
        else:
            search_query = category_keywords

    if not search_query:
        search_query = "news"  # 기본 검색어

    # 날짜 범위 (최근 7일)
    from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

    # NewsAPI 호출
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": search_query,
        "language": language,
        "sortBy": "publishedAt",
        "pageSize": page_size,
        "from": from_date,
        "apiKey": news_api_key
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            data = response.json()

            if data.get("status") == "ok":
                articles = data.get("articles", [])

                # 응답 데이터 가공
                processed_articles = []
                for idx, article in enumerate(articles):
                    processed_articles.append({
                        "id": idx + 1,
                        "title": article.get("title", ""),
                        "summary": article.get("description", "") or article.get("content", "")[:200] if article.get("content") else "",
                        "content": article.get("content", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "url": article.get("url", ""),
                        "image": article.get("urlToImage", ""),
                        "publishedAt": article.get("publishedAt", ""),
                        "category": category,
                        "keywords": extract_keywords(article.get("title", ""))
                    })

                # 한국어 번역 적용
                if translate and DEFAULT_OPENAI_API_KEY:
                    processed_articles = await translate_articles(
                        processed_articles,
                        DEFAULT_OPENAI_API_KEY
                    )

                return NewsResponse(
                    success=True,
                    data=processed_articles,
                    message=f"{len(processed_articles)}개의 뉴스를 찾았습니다."
                )
            else:
                error_msg = data.get("message", "뉴스를 가져오는데 실패했습니다.")
                raise HTTPException(status_code=400, detail=error_msg)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="뉴스 서버 응답 시간 초과")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"네트워크 오류: {str(e)}")


@app.post("/api/analyze")
async def analyze_news(request: AnalysisRequest):
    """
    뉴스 AI 분석 API
    - OpenAI GPT-4o-mini를 사용
    - 한국어 요약 + 감성 분석
    """
    openai_key = request.openai_key if request.openai_key else DEFAULT_OPENAI_API_KEY

    if not openai_key:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API 키가 설정되지 않았습니다. 설정에서 입력해주세요."
        )

    # 분석할 텍스트 준비
    text = f"{request.title}. {request.content}"[:2000]

    if len(text.strip()) < 50:
        return AnalysisResponse(
            success=False,
            message="분석할 내용이 충분하지 않습니다."
        )

    prompt = f"""다음 뉴스 기사를 분석해주세요.

[뉴스 내용]
{text}

[요청사항]
1. 핵심 내용을 한국어로 3줄 요약해주세요.
2. 감성 분석을 수행하여 긍정/부정 비율(%)을 알려주세요. (합계 100%)

[응답 형식] (정확히 이 형식으로 응답해주세요)
요약:
- (첫 번째 요약)
- (두 번째 요약)
- (세 번째 요약)

감성분석:
긍정: (숫자)%
부정: (숫자)%
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "당신은 뉴스 분석 전문가입니다. 한국어로 명확하고 간결하게 응답해주세요."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500
                },
                timeout=30.0
            )

            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get("error", {}).get("message", "OpenAI API 오류")
                raise HTTPException(status_code=response.status_code, detail=error_msg)

            data = response.json()
            result_text = data["choices"][0]["message"]["content"]

            # 결과 파싱
            analysis = parse_analysis_result(result_text)

            return AnalysisResponse(
                success=True,
                summary_ko=analysis["summary"],
                positive=analysis["positive"],
                negative=analysis["negative"],
                sentiment=analysis["sentiment"]
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI 분석 시간 초과")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"네트워크 오류: {str(e)}")


def parse_analysis_result(text: str) -> dict:
    """AI 응답을 파싱하여 구조화된 데이터로 변환"""
    result = {
        "summary": "",
        "positive": 50,
        "negative": 50,
        "sentiment": "중립"
    }

    lines = text.strip().split('\n')
    summary_lines = []

    for line in lines:
        line = line.strip()

        # 요약 라인 추출
        if line.startswith('-') or line.startswith('•'):
            summary_lines.append(line)

        # 긍정 비율 추출
        if '긍정' in line and '%' in line:
            try:
                num = ''.join(filter(lambda x: x.isdigit(), line.split('%')[0].split(':')[-1]))
                if num:
                    result['positive'] = int(num)
            except:
                pass

        # 부정 비율 추출
        if '부정' in line and '%' in line:
            try:
                num = ''.join(filter(lambda x: x.isdigit(), line.split('%')[0].split(':')[-1]))
                if num:
                    result['negative'] = int(num)
            except:
                pass

    # 요약 조합
    if summary_lines:
        result['summary'] = '\n'.join(summary_lines[:3])
    else:
        result['summary'] = text[:500]

    # 감성 판정
    if result['positive'] > result['negative']:
        result['sentiment'] = "긍정적"
    elif result['negative'] > result['positive']:
        result['sentiment'] = "부정적"
    else:
        result['sentiment'] = "중립"

    return result


@app.get("/api/headlines")
async def get_headlines(
    country: str = Query(default="us", description="국가 코드"),
    category: str = Query(default="general", description="카테고리"),
    page_size: int = Query(default=5, ge=1, le=10, description="결과 수"),
    api_key: str = Query(default="", description="사용자 API 키 (선택)")
):
    """헤드라인 뉴스 API"""
    news_api_key = api_key if api_key else DEFAULT_NEWS_API_KEY

    if not news_api_key:
        raise HTTPException(status_code=400, detail="API 키가 설정되지 않았습니다.")

    api_category = {
        "tech": "technology",
        "economy": "business",
        "politics": "politics",
        "world": "general",
        "sports": "sports",
        "all": "general"
    }.get(category, "general")

    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "country": country,
        "category": api_category,
        "pageSize": page_size,
        "apiKey": news_api_key
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            data = response.json()

            if data.get("status") == "ok":
                articles = data.get("articles", [])
                processed_articles = []
                for idx, article in enumerate(articles):
                    processed_articles.append({
                        "id": idx + 1,
                        "title": article.get("title", ""),
                        "summary": article.get("description", "") or "",
                        "content": article.get("content", ""),
                        "source": article.get("source", {}).get("name", "Unknown"),
                        "url": article.get("url", ""),
                        "image": article.get("urlToImage", ""),
                        "publishedAt": article.get("publishedAt", ""),
                        "category": category,
                        "keywords": extract_keywords(article.get("title", ""))
                    })
                return NewsResponse(success=True, data=processed_articles)
            else:
                raise HTTPException(status_code=400, detail=data.get("message", "실패"))

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="시간 초과")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"네트워크 오류: {str(e)}")


@app.get("/api/status")
async def check_status(
    news_api_key: str = Query(default="", description="NewsAPI 키"),
    openai_key: str = Query(default="", description="OpenAI 키")
):
    """API 키 상태 확인"""
    news_key = news_api_key if news_api_key else DEFAULT_NEWS_API_KEY
    ai_key = openai_key if openai_key else DEFAULT_OPENAI_API_KEY

    result = {
        "hasDefaultNewsKey": bool(DEFAULT_NEWS_API_KEY),
        "hasDefaultOpenAIKey": bool(DEFAULT_OPENAI_API_KEY),
        "hasUserNewsKey": bool(news_api_key),
        "hasUserOpenAIKey": bool(openai_key),
        "newsKeyValid": False,
        "openaiKeyValid": False,
        "message": ""
    }

    # NewsAPI 키 테스트
    if news_key:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://newsapi.org/v2/top-headlines",
                    params={"country": "us", "pageSize": 1, "apiKey": news_key},
                    timeout=5.0
                )
                data = response.json()
                result["newsKeyValid"] = data.get("status") == "ok"
        except:
            pass

    # OpenAI 키 테스트 (간단한 확인)
    if ai_key:
        result["openaiKeyValid"] = len(ai_key) > 20 and ai_key.startswith("sk-")

    # 메시지 설정
    messages = []
    if result["newsKeyValid"]:
        messages.append("NewsAPI 연결됨")
    else:
        messages.append("NewsAPI 키 필요")

    if result["openaiKeyValid"] or result["hasDefaultOpenAIKey"]:
        messages.append("AI 분석 가능")
    else:
        messages.append("OpenAI 키 필요 (AI 분석)")

    result["message"] = " | ".join(messages)

    return result


def extract_keywords(title: str) -> list:
    """제목에서 키워드 추출"""
    if not title:
        return []

    stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
                 'to', 'for', 'of', 'and', 'or', 'but', 'with', 'as', 'by', 'from',
                 '이', '가', '은', '는', '을', '를', '의', '에', '에서', '로', '으로'}

    words = title.replace('-', ' ').replace(':', ' ').split()
    keywords = []

    for word in words:
        clean_word = ''.join(c for c in word if c.isalnum())
        if len(clean_word) >= 3 and clean_word.lower() not in stopwords:
            keywords.append(clean_word)
            if len(keywords) >= 3:
                break

    return keywords


async def translate_articles(articles: list, openai_key: str) -> list:
    """뉴스 기사들을 한국어로 번역"""
    if not openai_key or not articles:
        return articles

    # 번역할 텍스트 준비
    texts_to_translate = []
    for article in articles:
        texts_to_translate.append({
            "id": article.get("id"),
            "title": article.get("title", ""),
            "summary": article.get("summary", "")
        })

    prompt = f"""다음 뉴스 기사 제목과 요약을 한국어로 번역해주세요.
자연스러운 한국어로 번역하되, 뉴스 헤드라인 스타일을 유지해주세요.

[번역할 내용]
{json.dumps(texts_to_translate, ensure_ascii=False, indent=2)}

[응답 형식]
정확히 다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
[
  {{"id": 1, "title_ko": "번역된 제목", "summary_ko": "번역된 요약"}},
  ...
]
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "당신은 전문 뉴스 번역가입니다. 영어 뉴스를 자연스러운 한국어로 번역합니다. JSON 형식으로만 응답하세요."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2000
                },
                timeout=60.0
            )

            if response.status_code != 200:
                print(f"Translation API error: {response.status_code}")
                return articles

            data = response.json()
            result_text = data["choices"][0]["message"]["content"]

            # JSON 파싱 (마크다운 코드블록 제거)
            result_text = result_text.strip()
            if result_text.startswith("```"):
                result_text = re.sub(r'^```json?\n?', '', result_text)
                result_text = re.sub(r'\n?```$', '', result_text)

            translations = json.loads(result_text)

            # 번역 결과를 기사에 적용
            translation_map = {t["id"]: t for t in translations}

            for article in articles:
                article_id = article.get("id")
                if article_id in translation_map:
                    trans = translation_map[article_id]
                    article["title_original"] = article["title"]
                    article["summary_original"] = article["summary"]
                    article["title"] = trans.get("title_ko", article["title"])
                    article["summary"] = trans.get("summary_ko", article["summary"])

            return articles

    except json.JSONDecodeError as e:
        print(f"Translation JSON parse error: {e}")
        return articles
    except Exception as e:
        print(f"Translation error: {e}")
        return articles


# 정적 파일 서빙
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")


if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("ROKEY NEWS API Server v2.0")
    print("=" * 50)
    print(f"NewsAPI Key: {'설정됨' if DEFAULT_NEWS_API_KEY else '미설정'}")
    print(f"OpenAI Key: {'설정됨' if DEFAULT_OPENAI_API_KEY else '미설정'}")
    print("Server: http://localhost:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
