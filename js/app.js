/**
 * ROKEY NEWS - AI 뉴스 요약 애플리케이션
 */

// 샘플 뉴스 데이터 (실제로는 API에서 가져옴)
const sampleNewsData = [
    {
        id: 1,
        category: '기술/IT',
        categoryCode: 'tech',
        title: 'OpenAI, GPT-5 개발 박차... 인공지능 새 시대 예고',
        summary: 'OpenAI가 차세대 인공지능 모델 GPT-5 개발에 속도를 내고 있다. 업계 전문가들은 GPT-5가 현재 모델 대비 획기적인 성능 향상을 보일 것으로 예상하며, 특히 복잡한 추론 능력과 멀티모달 처리 능력이 크게 개선될 것으로 전망했다.',
        source: '테크크런치',
        time: '2시간 전',
        url: '#',
        keywords: ['AI', 'GPT-5', 'OpenAI']
    },
    {
        id: 2,
        category: '경제',
        categoryCode: 'economy',
        title: '한국은행, 기준금리 동결 결정... 물가 안정 우선',
        summary: '한국은행 금융통화위원회가 기준금리를 현 수준에서 동결하기로 결정했다. 이창용 한은 총재는 물가 안정을 최우선 과제로 삼고 있으며, 향후 경제 상황을 면밀히 모니터링하겠다고 밝혔다.',
        source: '한국경제',
        time: '3시간 전',
        url: '#',
        keywords: ['금리', '한국은행', '통화정책']
    },
    {
        id: 3,
        category: '정치',
        categoryCode: 'politics',
        title: '국회, 2026년도 예산안 본회의 통과',
        summary: '국회 본회의에서 2026년도 예산안이 최종 통과됐다. 총 규모는 약 680조원으로, 복지와 교육 분야 예산이 증가했으며, R&D 투자도 확대됐다. 여야는 막판 협상을 통해 주요 쟁점에 합의했다.',
        source: '연합뉴스',
        time: '4시간 전',
        url: '#',
        keywords: ['예산', '국회', '2026']
    },
    {
        id: 4,
        category: '국제',
        categoryCode: 'world',
        title: 'EU, 새로운 AI 규제법 시행... 글로벌 기준 제시',
        summary: '유럽연합이 세계 최초로 포괄적인 AI 규제법을 시행했다. 이 법안은 고위험 AI 시스템에 대한 엄격한 규제를 포함하며, 글로벌 AI 거버넌스의 새로운 기준이 될 것으로 전망된다.',
        source: 'BBC',
        time: '5시간 전',
        url: '#',
        keywords: ['EU', 'AI규제', '법안']
    },
    {
        id: 5,
        category: '스포츠',
        categoryCode: 'sports',
        title: '손흥민, 시즌 20호골 달성... EPL 득점왕 경쟁',
        summary: '토트넘의 손흥민이 시즌 20번째 골을 기록하며 득점왕 경쟁에서 선두권을 유지하고 있다. 이번 골은 왼발 중거리슛으로, 손흥민 특유의 기술을 보여줬다는 평가다.',
        source: 'ESPN',
        time: '6시간 전',
        url: '#',
        keywords: ['손흥민', 'EPL', '득점']
    },
    {
        id: 6,
        category: '기술/IT',
        categoryCode: 'tech',
        title: '삼성전자, 차세대 폴더블폰 공개... 새로운 폼팩터 선보여',
        summary: '삼성전자가 새로운 폴더블 스마트폰을 공개했다. 이번 제품은 3단 접이식 디자인을 채택해 태블릿 수준의 화면 크기를 구현하면서도 휴대성을 높였다. 업계는 폴더블폰 시장의 새 지평을 열 것으로 기대하고 있다.',
        source: '조선비즈',
        time: '7시간 전',
        url: '#',
        keywords: ['삼성', '폴더블', '스마트폰']
    },
    {
        id: 7,
        category: '경제',
        categoryCode: 'economy',
        title: '코스피, 사상 최고치 경신... 외국인 매수세 지속',
        summary: '코스피 지수가 사상 최고치를 경신하며 3,200선을 돌파했다. 외국인 투자자들의 지속적인 매수세와 반도체 업종의 강세가 상승을 이끌었다. 전문가들은 추가 상승 여력이 있다고 분석했다.',
        source: '매일경제',
        time: '8시간 전',
        url: '#',
        keywords: ['코스피', '주식', '외국인']
    },
    {
        id: 8,
        category: '국제',
        categoryCode: 'world',
        title: '미중 정상회담, 무역 갈등 완화 합의',
        summary: '미국과 중국 정상이 회담을 갖고 양국 간 무역 갈등 완화에 합의했다. 양측은 관세 인하와 기술 협력 확대 방안을 논의했으며, 향후 실무 협상을 통해 구체적인 이행 방안을 마련하기로 했다.',
        source: '로이터',
        time: '9시간 전',
        url: '#',
        keywords: ['미중', '무역', '정상회담']
    },
    {
        id: 9,
        category: '기술/IT',
        categoryCode: 'tech',
        title: '네이버, 하이퍼클로바X 업그레이드... 한국어 AI 선도',
        summary: '네이버가 자체 개발한 초거대 AI 하이퍼클로바X의 대규모 업그레이드를 발표했다. 새 버전은 한국어 이해와 생성 능력이 크게 향상됐으며, 다양한 산업 분야에서의 활용도가 높아질 전망이다.',
        source: '디지털데일리',
        time: '10시간 전',
        url: '#',
        keywords: ['네이버', 'AI', '하이퍼클로바']
    }
];

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
    navLinks: document.querySelectorAll('.nav-link')
};

// 상태 관리
let state = {
    currentCategory: 'all',
    currentView: 'grid',
    newsData: [],
    filteredData: [],
    searchQuery: ''
};

// 초기화
function init() {
    setCurrentDate();
    loadNews();
    bindEvents();
}

// 현재 날짜 설정
function setCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    elements.currentDate.textContent = now.toLocaleDateString('ko-KR', options);
}

// 마지막 업데이트 시간 설정
function setLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    elements.lastUpdate.textContent = timeStr;
}

// 뉴스 로드
async function loadNews() {
    showLoading(true);

    // 실제 API 호출 대신 샘플 데이터 사용 (시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 500));

    state.newsData = sampleNewsData;
    state.filteredData = [...state.newsData];

    setLastUpdate();
    renderHeadline();
    renderNewsGrid();
    showLoading(false);
}

// 로딩 표시
function showLoading(show) {
    elements.loadingIndicator.classList.toggle('show', show);
    elements.newsGrid.style.display = show ? 'none' : 'grid';
}

// 헤드라인 렌더링
function renderHeadline() {
    const headline = state.filteredData[0];
    if (!headline) return;

    elements.headlineCard.innerHTML = `
        <div class="headline-content">
            <span class="headline-category">${headline.category}</span>
            <h3 class="headline-title">${headline.title}</h3>
            <p class="headline-summary">${headline.summary}</p>
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
    const newsToRender = state.filteredData.slice(1); // 첫 번째는 헤드라인으로 사용

    elements.newsGrid.innerHTML = newsToRender.map(news => `
        <article class="news-card" data-id="${news.id}">
            <div class="news-card-header">
                <span class="news-category">${news.category}</span>
                <span class="news-time">${news.time}</span>
            </div>
            <h3 class="news-title">${news.title}</h3>
            <p class="news-summary">${news.summary}</p>
            <div class="news-footer">
                <span class="news-source">${news.source}</span>
                <div class="news-keywords">
                    ${news.keywords.slice(0, 2).map(k => `<span class="keyword-tag">${k}</span>`).join('')}
                </div>
            </div>
        </article>
    `).join('');

    // 카드 클릭 이벤트
    document.querySelectorAll('.news-card').forEach(card => {
        card.onclick = () => {
            const id = parseInt(card.dataset.id);
            const news = state.newsData.find(n => n.id === id);
            if (news) openModal(news);
        };
    });
}

// 모달 열기
function openModal(news) {
    document.getElementById('modalCategory').textContent = news.category;
    document.getElementById('modalTitle').textContent = news.title;
    document.getElementById('modalSource').textContent = news.source;
    document.getElementById('modalTime').textContent = news.time;
    document.getElementById('modalSummary').textContent = news.summary;
    document.getElementById('modalLink').href = news.url;

    document.getElementById('modalKeywords').innerHTML =
        news.keywords.map(k => `<span class="keyword-tag">${k}</span>`).join('');

    elements.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal() {
    elements.modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// 카테고리 필터
function filterByCategory(category) {
    state.currentCategory = category;

    if (category === 'all') {
        state.filteredData = [...state.newsData];
    } else {
        state.filteredData = state.newsData.filter(n => n.categoryCode === category);
    }

    applySearchFilter();
    renderHeadline();
    renderNewsGrid();
}

// 검색 필터
function applySearchFilter() {
    if (!state.searchQuery) return;

    state.filteredData = state.filteredData.filter(news =>
        news.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        news.summary.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        news.keywords.some(k => k.toLowerCase().includes(state.searchQuery.toLowerCase()))
    );
}

// 검색 처리
function handleSearch(query) {
    state.searchQuery = query;
    filterByCategory(state.currentCategory);
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
    elements.mobileMenuBtn.onclick = toggleSidebar;
    elements.sidebarToggle.onclick = toggleSidebar;

    // 모달 닫기
    elements.modalClose.onclick = closeModal;
    elements.modalOverlay.onclick = (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    };

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // 새로고침
    elements.refreshBtn.onclick = () => {
        loadNews();
    };

    // 검색
    let searchTimeout;
    elements.searchInput.oninput = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            handleSearch(e.target.value);
        }, 300);
    };

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

            // 활성 상태 변경
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            link.parentElement.classList.add('active');

            // 카테고리 필터 적용
            filterByCategory(link.dataset.category);

            // 모바일에서 사이드바 닫기
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        };
    });
}

// 앱 시작
document.addEventListener('DOMContentLoaded', init);
