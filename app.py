"""
뉴스 요약 및 감성 분석 웹 서비스
- Streamlit 기반 웹 UI
- NewsAPI로 뉴스 수집
- OpenAI GPT-4o-mini로 요약 및 감성 분석
"""

import streamlit as st
import os
from datetime import datetime, timedelta
from newsapi import NewsApiClient
from openai import OpenAI


# ============================================
# 페이지 설정
# ============================================
st.set_page_config(
    page_title="뉴스 요약 & 감성 분석",
    page_icon="📰",
    layout="wide"
)


# ============================================
# CSS 스타일링
# ============================================
st.markdown("""
<style>
    .news-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin: 10px 0;
        border-left: 4px solid #1f77b4;
    }
    .positive {
        color: #28a745;
        font-weight: bold;
    }
    .negative {
        color: #dc3545;
        font-weight: bold;
    }
    .neutral {
        color: #6c757d;
        font-weight: bold;
    }
    .summary-box {
        background-color: #e8f4f8;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)


# ============================================
# 유틸리티 함수
# ============================================
def fetch_news(api_key: str, keyword: str, language: str = "ko",
               sort_by: str = "publishedAt", page_size: int = 5) -> list:
    """
    NewsAPI를 사용하여 뉴스 기사를 가져옵니다.

    Args:
        api_key: NewsAPI 키
        keyword: 검색 키워드
        language: 언어 코드 (ko, en 등)
        sort_by: 정렬 기준 (publishedAt, relevancy, popularity)
        page_size: 가져올 기사 수

    Returns:
        뉴스 기사 리스트
    """
    try:
        newsapi = NewsApiClient(api_key=api_key)

        # 최근 7일간의 뉴스 검색
        from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        response = newsapi.get_everything(
            q=keyword,
            language=language,
            sort_by=sort_by,
            page_size=page_size,
            from_param=from_date
        )

        if response['status'] == 'ok':
            return response['articles']
        else:
            st.error("뉴스를 가져오는데 실패했습니다.")
            return []

    except Exception as e:
        st.error(f"NewsAPI 오류: {str(e)}")
        return []


def summarize_and_analyze(client: OpenAI, text: str) -> dict:
    """
    OpenAI를 사용하여 텍스트를 요약하고 감성 분석을 수행합니다.

    Args:
        client: OpenAI 클라이언트
        text: 분석할 텍스트

    Returns:
        요약 및 감성 분석 결과 딕셔너리
    """
    if not text or len(text.strip()) < 50:
        return {
            "summary": "분석할 내용이 충분하지 않습니다.",
            "positive": 50,
            "negative": 50,
            "sentiment": "중립"
        }

    prompt = f"""
다음 뉴스 기사를 분석해주세요.

[뉴스 내용]
{text[:2000]}

[요청사항]
1. 핵심 내용을 3줄로 요약해주세요.
2. 감성 분석을 수행하여 긍정/부정 비율(%)을 알려주세요.

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
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 뉴스 분석 전문가입니다. 요청받은 형식대로 정확하게 응답해주세요."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        result_text = response.choices[0].message.content

        # 결과 파싱
        return parse_analysis_result(result_text)

    except Exception as e:
        st.error(f"OpenAI API 오류: {str(e)}")
        return {
            "summary": "분석 중 오류가 발생했습니다.",
            "positive": 50,
            "negative": 50,
            "sentiment": "분석 실패"
        }


def parse_analysis_result(text: str) -> dict:
    """
    AI 응답을 파싱하여 구조화된 데이터로 변환합니다.

    Args:
        text: AI 응답 텍스트

    Returns:
        파싱된 결과 딕셔너리
    """
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


def display_news_card(article: dict, index: int, openai_client=None):
    """
    뉴스 카드를 화면에 표시합니다.

    Args:
        article: 뉴스 기사 데이터
        index: 기사 인덱스
        openai_client: OpenAI 클라이언트 (분석용)
    """
    title = article.get('title', '제목 없음')
    description = article.get('description', '')
    content = article.get('content', '')
    source = article.get('source', {}).get('name', '알 수 없음')
    url = article.get('url', '#')
    published_at = article.get('publishedAt', '')
    image_url = article.get('urlToImage', '')

    # 날짜 포맷팅
    if published_at:
        try:
            date_obj = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            formatted_date = date_obj.strftime('%Y-%m-%d %H:%M')
        except:
            formatted_date = published_at
    else:
        formatted_date = ""

    # 분석할 텍스트 준비
    full_text = f"{title}. {description or ''} {content or ''}"

    # 카드 UI
    with st.container():
        st.markdown("---")

        col1, col2 = st.columns([1, 2])

        with col1:
            if image_url:
                st.image(image_url, use_container_width=True)
            else:
                st.markdown("🖼️ *이미지 없음*")

        with col2:
            st.markdown(f"### {index + 1}. {title}")
            st.markdown(f"**📰 {source}** | 🕐 {formatted_date}")

            if description:
                st.markdown(f"> {description[:200]}...")

            st.markdown(f"[🔗 원문 보기]({url})")

        # AI 분석 버튼
        if openai_client:
            with st.expander("🤖 AI 분석 보기", expanded=False):
                if st.button(f"분석 시작", key=f"analyze_{index}"):
                    with st.spinner("AI가 분석 중입니다..."):
                        analysis = summarize_and_analyze(openai_client, full_text)

                        # 요약 표시
                        st.markdown("#### 📝 3줄 요약")
                        st.markdown(f"""
                        <div class="summary-box">
                        {analysis['summary']}
                        </div>
                        """, unsafe_allow_html=True)

                        # 감성 분석 결과 표시
                        st.markdown("#### 📊 감성 분석")

                        col_pos, col_neg = st.columns(2)

                        with col_pos:
                            st.metric(
                                label="😊 긍정",
                                value=f"{analysis['positive']}%"
                            )
                            st.progress(analysis['positive'] / 100)

                        with col_neg:
                            st.metric(
                                label="😔 부정",
                                value=f"{analysis['negative']}%"
                            )
                            st.progress(analysis['negative'] / 100)

                        # 종합 판정
                        sentiment_class = {
                            "긍정적": "positive",
                            "부정적": "negative",
                            "중립": "neutral"
                        }.get(analysis['sentiment'], "neutral")

                        st.markdown(f"""
                        <p>종합 판정: <span class="{sentiment_class}">{analysis['sentiment']}</span></p>
                        """, unsafe_allow_html=True)


# ============================================
# 메인 앱
# ============================================
def main():
    """메인 앱 실행 함수"""

    # 제목
    st.title("📰 뉴스 요약 & 감성 분석")
    st.markdown("최신 뉴스를 검색하고, AI로 요약 및 감성 분석을 수행합니다.")

    # ========================================
    # 사이드바 설정
    # ========================================
    with st.sidebar:
        st.header("⚙️ 설정")

        # API 키 입력
        st.subheader("🔑 API Keys")

        news_api_key = st.text_input(
            "NewsAPI Key",
            type="password",
            help="https://newsapi.org 에서 무료 API 키를 발급받으세요.",
            value=os.getenv("NEWS_API_KEY", "")
        )

        openai_api_key = st.text_input(
            "OpenAI API Key",
            type="password",
            help="https://platform.openai.com 에서 API 키를 발급받으세요.",
            value=os.getenv("OPENAI_API_KEY", "")
        )

        st.markdown("---")

        # 검색 필터
        st.subheader("🔍 검색 필터")

        keyword = st.text_input(
            "검색 키워드",
            value="인공지능",
            help="검색하고 싶은 키워드를 입력하세요."
        )

        language = st.selectbox(
            "언어",
            options=["ko", "en", "ja", "zh"],
            format_func=lambda x: {
                "ko": "🇰🇷 한국어",
                "en": "🇺🇸 영어",
                "ja": "🇯🇵 일본어",
                "zh": "🇨🇳 중국어"
            }.get(x, x)
        )

        sort_by = st.selectbox(
            "정렬 기준",
            options=["publishedAt", "relevancy", "popularity"],
            format_func=lambda x: {
                "publishedAt": "📅 최신순",
                "relevancy": "🎯 관련성순",
                "popularity": "🔥 인기순"
            }.get(x, x)
        )

        page_size = st.slider(
            "뉴스 개수",
            min_value=1,
            max_value=10,
            value=5,
            help="가져올 뉴스 기사 수"
        )

        st.markdown("---")

        # 검색 버튼
        search_button = st.button("🔎 뉴스 검색", type="primary", use_container_width=True)

        # 안내 메시지
        st.markdown("---")
        st.markdown("""
        ### 📖 사용 방법
        1. API 키를 입력하세요
        2. 검색 키워드를 입력하세요
        3. 필터를 설정하세요
        4. '뉴스 검색' 버튼을 클릭하세요
        5. 각 뉴스의 'AI 분석 보기'로 요약 및 감성분석을 확인하세요
        """)

    # ========================================
    # 메인 화면
    # ========================================

    # API 키 확인
    if not news_api_key:
        st.warning("⚠️ 사이드바에서 NewsAPI Key를 입력해주세요.")
        st.info("""
        **NewsAPI 키 발급 방법:**
        1. [https://newsapi.org](https://newsapi.org) 접속
        2. 'Get API Key' 클릭
        3. 회원가입 후 API 키 복사
        """)
        return

    # OpenAI 클라이언트 초기화
    openai_client = None
    if openai_api_key:
        try:
            openai_client = OpenAI(api_key=openai_api_key)
        except Exception as e:
            st.warning(f"OpenAI 클라이언트 초기화 실패: {e}")
    else:
        st.info("💡 OpenAI API Key를 입력하면 AI 요약 및 감성 분석 기능을 사용할 수 있습니다.")

    # 뉴스 검색
    if search_button:
        if not keyword:
            st.error("검색 키워드를 입력해주세요.")
            return

        with st.spinner(f"'{keyword}' 관련 뉴스를 검색 중..."):
            articles = fetch_news(
                api_key=news_api_key,
                keyword=keyword,
                language=language,
                sort_by=sort_by,
                page_size=page_size
            )

        if articles:
            st.success(f"✅ {len(articles)}개의 뉴스를 찾았습니다!")

            # 세션에 저장
            st.session_state['articles'] = articles
            st.session_state['openai_client'] = openai_client
        else:
            st.warning("검색 결과가 없습니다. 다른 키워드를 시도해보세요.")

    # 저장된 뉴스 표시
    if 'articles' in st.session_state:
        articles = st.session_state['articles']
        client = st.session_state.get('openai_client')

        for idx, article in enumerate(articles):
            display_news_card(article, idx, client)


# ============================================
# 앱 실행
# ============================================
if __name__ == "__main__":
    main()
