/**
 * ROKEY NEWS - AI 뉴스 요약 애플리케이션
 * 실제 NewsAPI 연동 버전
 */

// API 설정
const API_BASE_URL = window.location.origin;

// 카테고리 한글 매핑
const CATEGORY_NAMES = {
    all: '전체',
    tech: '기술/IT',
    economy: '경제',
    politics: '정치',
    world: '국제',
    sports: '스포츠'
};

// DOM 요소들
const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    currentDate: document.getElementById('currentDate'),
    lastUpdate: document.getElementById('lastUpdate'),
    headlineCard: document.getElementById('headlineCard'),
    newsGrid: document.getElementById('newsGrid'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    viewBtns: document.querySelectorAll('.view-btn'),
    navLinks: document.querySelectorAll('.nav-link'),
    // 설정 관련
    settingsBtn: document.getElementById('settingsBtn'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    settingsClose: document.getElementById('settingsClose'),
    settingsStatus: document.getElementById('settingsStatus'),
    userApiKey: document.getElementById('userApiKey'),
    newsLanguage: document.getElementById('newsLanguage'),
    toggleKeyVisibility: document.getElementById('toggleKeyVisibility'),
    clearApiKey: document.getElementById('clearApiKey'),
    saveSettings: document.getElementById('saveSettings'),
    apiStatus: document.getElementById('apiStatus')
};

// 상태 관리
let state = {
    currentCategory: 'all',
    currentView: 'grid',
    newsData: [],
    filteredData: [],
    searchQuery: '',
    userApiKey: localStorage.getItem('newsApiKey') || '',
    userOpenAIKey: localStorage.getItem('openaiApiKey') || '',
    language: localStorage.getItem('newsLanguage') || 'en',
    isLoading: false,
    hasDefaultKey: false
};

// 초기화
async function init() {
    setCurrentDate();
    loadSettings();
    await checkApiStatus();
    await loadNews();
    bindEvents();
}

// 설정 로드
function loadSettings() {
    state.userApiKey = localStorage.getItem('newsApiKey') || '';
    state.language = localStorage.getItem('newsLanguage') || 'en';

    if (elements.userApiKey) {
        elements.userApiKey.value = state.userApiKey;
    }
    if (elements.newsLanguage) {
        elements.newsLanguage.value = state.language;
    }
}

// API 상태 확인
async function checkApiStatus() {
    const apiStatusEl = elements.apiStatus;
    const settingsStatusEl = elements.settingsStatus;

    try {
        const response = await fetch(`${API_BASE_URL}/api/status?api_key=${encodeURIComponent(state.userApiKey)}`);
        const data = await response.json();

        state.hasDefaultKey = data.hasDefaultKey;

        if (apiStatusEl) {
            const statusDot = apiStatusEl.querySelector('.status-dot');
            const statusText = apiStatusEl.querySelector('.status-text');

            if (data.valid || data.hasDefaultKey) {
                apiStatusEl.className = 'api-status connected';
                statusText.textContent = '연결됨';
            } else {
                apiStatusEl.className = 'api-status error';
                statusText.textContent = 'API 키 필요';
            }
        }

        if (settingsStatusEl) {
            updateSettingsStatus(data);
        }

        return data;
    } catch (error) {
        console.error('API 상태 확인 실패:', error);

        if (apiStatusEl) {
            apiStatusEl.className = 'api-status error';
            apiStatusEl.querySelector('.status-text').textContent = '서버 오류';
        }

        return { valid: false, hasDefaultKey: false };
    }
}

// 설정 상태 업데이트
function updateSettingsStatus(data) {
    const statusEl = elements.settingsStatus;
    if (!statusEl) return;

    const iconEl = statusEl.querySelector('.status-icon');
    const msgEl = statusEl.querySelector('.status-message');

    if (data.valid) {
        statusEl.className = 'settings-status success';
        iconEl.textContent = '●';
        msgEl.textContent = data.hasUserKey ? '사용자 API 키 활성' : '기본 API 키 사용 중';
    } else if (data.hasDefaultKey) {
        statusEl.className = 'settings-status success';
        iconEl.textContent = '●';
        msgEl.textContent = '기본 API 키 사용 중';
    } else {
        statusEl.className = 'settings-status warning';
        iconEl.textContent = '●';
        msgEl.textContent = 'API 키를 입력해주세요';
    }
}

// 현재 날짜 설정
function setCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    if (elements.currentDate) {
        elements.currentDate.textContent = now.toLocaleDateString('ko-KR', options);
    }
}

// 마지막 업데이트 시간 설정
function setLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    if (elements.lastUpdate) {
        elements.lastUpdate.textContent = timeStr;
    }
}

// 뉴스 로드
async function loadNews() {
    if (state.isLoading) return;

    state.isLoading = true;
    showLoading(true);

    try {
        const params = new URLSearchParams({
            category: state.currentCategory,
            language: state.language,
            page_size: '12'
        });

        if (state.searchQuery) {
            params.set('q', state.searchQuery);
        }

        if (state.userApiKey) {
            params.set('api_key', state.userApiKey);
        }

        const response = await fetch(`${API_BASE_URL}/api/news?${params}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '뉴스를 불러오는데 실패했습니다.');
        }

        const data = await response.json();

        if (data.success && data.data.length > 0) {
            state.newsData = data.data.map(article => ({
                ...article,
                category: CATEGORY_NAMES[article.category] || article.category,
                categoryCode: article.category,
                time: formatTime(article.publishedAt)
            }));
            state.filteredData = [...state.newsData];

            setLastUpdate();
            renderHeadline();
            renderNewsGrid();
        } else {
            showError('검색 결과가 없습니다.', '다른 키워드나 카테고리를 시도해보세요.');
        }
    } catch (error) {
        console.error('뉴스 로드 실패:', error);
        showError('뉴스를 불러올 수 없습니다.', error.message);
    } finally {
        state.isLoading = false;
        showLoading(false);
    }
}

// 시간 포맷
function formatTime(isoString) {
    if (!isoString) return '';

    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // 분 단위

    if (diff < 60) {
        return `${diff}분 전`;
    } else if (diff < 1440) {
        return `${Math.floor(diff / 60)}시간 전`;
    } else {
        return `${Math.floor(diff / 1440)}일 전`;
    }
}

// 에러 표시
function showError(title, message) {
    elements.newsGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1;">
            <h3>${title}</h3>
            <p>${message}</p>
            <button onclick="window.location.reload()">새로고침</button>
        </div>
    `;

    elements.headlineCard.innerHTML = `
        <div class="headline-content">
            <span class="headline-category">알림</span>
            <h3 class="headline-title">${title}</h3>
            <p class="headline-summary">${message}</p>
        </div>
    `;
}

// 로딩 표시
function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.classList.toggle('show', show);
    }
    if (elements.newsGrid) {
        elements.newsGrid.style.display = show ? 'none' : 'grid';
    }
}

// 헤드라인 렌더링
function renderHeadline() {
    const headline = state.filteredData[0];
    if (!headline) return;

    const imageHtml = headline.image ?
        `<img src="${headline.image}" alt="" class="headline-image" onerror="this.style.display='none'" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:16px;">` : '';

    elements.headlineCard.innerHTML = `
        <div class="headline-content">
            ${imageHtml}
            <span class="headline-category">${headline.category}</span>
            <h3 class="headline-title">${headline.title}</h3>
            <p class="headline-summary">${headline.summary || ''}</p>
            <div class="headline-meta">
                <span class="headline-source">${headline.source}</span>
                <span class="headline-time">${headline.time}</span>
            </div>
        </div>
    `;

    elements.headlineCard.onclick = () => openModal(headline);
}

// 뉴스 그리드 렌더링
function renderNewsGrid() {
    const newsToRender = state.filteredData.slice(1);

    if (newsToRender.length === 0) {
        elements.newsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <p>표시할 뉴스가 없습니다.</p>
            </div>
        `;
        return;
    }

    elements.newsGrid.innerHTML = newsToRender.map(news => {
        const imageHtml = news.image ?
            `<img src="${news.image}" alt="" class="news-image" onerror="this.style.display='none'">` : '';

        return `
            <article class="news-card" data-id="${news.id}">
                ${imageHtml}
                <div class="news-card-header">
                    <span class="news-category">${news.category}</span>
                    <span class="news-time">${news.time}</span>
                </div>
                <h3 class="news-title">${news.title}</h3>
                <p class="news-summary">${news.summary || ''}</p>
                <div class="news-footer">
                    <span class="news-source">${news.source}</span>
                    <div class="news-keywords">
                        ${(news.keywords || []).slice(0, 2).map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // 카드 클릭 이벤트
    document.querySelectorAll('.news-card').forEach(card => {
        card.onclick = () => {
            const id = parseInt(card.dataset.id);
            const news = state.newsData.find(n => n.id === id);
            if (news) openModal(news);
        };
    });
}

// 현재 모달에 표시된 뉴스
let currentModalNews = null;

// 모달 열기
function openModal(news) {
    currentModalNews = news;

    document.getElementById('modalCategory').textContent = news.category;
    document.getElementById('modalTitle').textContent = news.title;
    document.getElementById('modalSource').textContent = news.source;
    document.getElementById('modalTime').textContent = news.time;
    document.getElementById('modalSummary').textContent = news.summary || '요약 정보가 없습니다.';
    document.getElementById('modalLink').href = news.url || '#';

    document.getElementById('modalKeywords').innerHTML =
        (news.keywords || []).map(k => `<span class="keyword-tag">${k}</span>`).join('');

    // AI 분석 결과 초기화
    resetAiAnalysis();

    elements.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// AI 분석 결과 초기화
function resetAiAnalysis() {
    const aiResult = document.getElementById('aiResult');
    const aiLoading = document.getElementById('aiLoading');
    const aiContent = document.getElementById('aiContent');
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');

    if (aiResult) aiResult.style.display = 'none';
    if (aiLoading) aiLoading.style.display = 'flex';
    if (aiContent) aiContent.style.display = 'none';
    if (aiAnalyzeBtn) {
        aiAnalyzeBtn.disabled = false;
        aiAnalyzeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6v6l4 2"/>
            </svg>
            AI 분석 (한국어 요약 + 감성분석)
        `;
    }
}

// AI 분석 실행
async function runAiAnalysis() {
    if (!currentModalNews) return;

    const aiResult = document.getElementById('aiResult');
    const aiLoading = document.getElementById('aiLoading');
    const aiContent = document.getElementById('aiContent');
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');

    // UI 상태 변경
    aiResult.style.display = 'block';
    aiLoading.style.display = 'flex';
    aiContent.style.display = 'none';
    aiAnalyzeBtn.disabled = true;
    aiAnalyzeBtn.innerHTML = `
        <div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>
        분석 중...
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: currentModalNews.title || '',
                content: currentModalNews.content || currentModalNews.summary || '',
                openai_key: state.userOpenAIKey || ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'AI 분석 실패');
        }

        const data = await response.json();

        if (data.success) {
            // 결과 표시
            displayAiResult(data);
        } else {
            throw new Error(data.message || 'AI 분석 실패');
        }
    } catch (error) {
        console.error('AI 분석 오류:', error);
        aiLoading.innerHTML = `
            <span style="color: #ef4444;">분석 실패: ${error.message}</span>
            <button onclick="runAiAnalysis()" style="margin-top:8px;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;">
                다시 시도
            </button>
        `;
    }
}

// AI 분석 결과 표시
function displayAiResult(data) {
    const aiLoading = document.getElementById('aiLoading');
    const aiContent = document.getElementById('aiContent');
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');

    // 로딩 숨기고 결과 표시
    aiLoading.style.display = 'none';
    aiContent.style.display = 'block';

    // 한국어 요약
    document.getElementById('aiSummary').textContent = data.summary_ko || '요약 정보가 없습니다.';

    // 감성 분석 바
    const positiveBar = document.getElementById('positiveBar');
    const negativeBar = document.getElementById('negativeBar');
    const positiveValue = document.getElementById('positiveValue');
    const negativeValue = document.getElementById('negativeValue');

    positiveBar.style.width = `${data.positive}%`;
    negativeBar.style.width = `${data.negative}%`;
    positiveValue.textContent = `${data.positive}%`;
    negativeValue.textContent = `${data.negative}%`;

    // 감성 결과 배지
    const sentimentResult = document.getElementById('sentimentResult');
    let badgeClass = 'neutral';
    if (data.sentiment === '긍정적') badgeClass = 'positive';
    else if (data.sentiment === '부정적') badgeClass = 'negative';

    sentimentResult.innerHTML = `<span class="sentiment-badge ${badgeClass}">${data.sentiment}</span>`;

    // 버튼 업데이트
    aiAnalyzeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        분석 완료
    `;
}

// 모달 닫기
function closeModal() {
    elements.modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    currentModalNews = null;
}

// 설정 모달 열기
function openSettings() {
    checkApiStatus();
    elements.settingsOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 설정 모달 닫기
function closeSettings() {
    elements.settingsOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// 설정 저장
async function saveSettingsHandler() {
    const apiKey = elements.userApiKey.value.trim();
    const language = elements.newsLanguage.value;

    // 저장
    if (apiKey) {
        localStorage.setItem('newsApiKey', apiKey);
        state.userApiKey = apiKey;
    } else {
        localStorage.removeItem('newsApiKey');
        state.userApiKey = '';
    }

    localStorage.setItem('newsLanguage', language);
    state.language = language;

    // 상태 확인 및 새로고침
    await checkApiStatus();
    closeSettings();
    await loadNews();
}

// API 키 초기화
function clearApiKeyHandler() {
    elements.userApiKey.value = '';
    localStorage.removeItem('newsApiKey');
    state.userApiKey = '';
    checkApiStatus();
}

// 카테고리 필터
async function filterByCategory(category) {
    state.currentCategory = category;
    state.searchQuery = '';
    elements.searchInput.value = '';
    await loadNews();
}

// 검색 처리
async function handleSearch(query) {
    state.searchQuery = query;
    await loadNews();
}

// 뷰 변경
function changeView(view) {
    state.currentView = view;
    elements.newsGrid.classList.toggle('list-view', view === 'list');
}

// 사이드바 토글
function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
}

// 이벤트 바인딩
function bindEvents() {
    // 사이드바 토글
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.onclick = toggleSidebar;
    }
    if (elements.sidebarToggle) {
        elements.sidebarToggle.onclick = toggleSidebar;
    }

    // 뉴스 모달 닫기
    if (elements.modalClose) {
        elements.modalClose.onclick = closeModal;
    }
    if (elements.modalOverlay) {
        elements.modalOverlay.onclick = (e) => {
            if (e.target === elements.modalOverlay) closeModal();
        };
    }

    // 설정 모달
    if (elements.settingsBtn) {
        elements.settingsBtn.onclick = openSettings;
    }
    if (elements.settingsClose) {
        elements.settingsClose.onclick = closeSettings;
    }
    if (elements.settingsOverlay) {
        elements.settingsOverlay.onclick = (e) => {
            if (e.target === elements.settingsOverlay) closeSettings();
        };
    }
    if (elements.saveSettings) {
        elements.saveSettings.onclick = saveSettingsHandler;
    }
    if (elements.clearApiKey) {
        elements.clearApiKey.onclick = clearApiKeyHandler;
    }
    if (elements.toggleKeyVisibility) {
        elements.toggleKeyVisibility.onclick = () => {
            const input = elements.userApiKey;
            input.type = input.type === 'password' ? 'text' : 'password';
        };
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeSettings();
        }
    });

    // 새로고침
    if (elements.refreshBtn) {
        elements.refreshBtn.onclick = () => loadNews();
    }

    // 검색
    let searchTimeout;
    if (elements.searchInput) {
        elements.searchInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                handleSearch(e.target.value);
            }
        };

        elements.searchInput.oninput = (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.length >= 2 || e.target.value.length === 0) {
                    handleSearch(e.target.value);
                }
            }, 500);
        };
    }

    // 뷰 변경
    elements.viewBtns.forEach(btn => {
        btn.onclick = () => {
            elements.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            changeView(btn.dataset.view);
        };
    });

    // 카테고리 네비게이션
    elements.navLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();

            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            link.parentElement.classList.add('active');

            filterByCategory(link.dataset.category);

            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        };
    });

    // AI 분석 버튼
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
    if (aiAnalyzeBtn) {
        aiAnalyzeBtn.onclick = runAiAnalysis;
    }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', init);
