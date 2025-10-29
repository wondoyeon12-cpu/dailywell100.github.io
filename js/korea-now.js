// 대한민국은, 지금 - 정책브리핑 정책뉴스 연동

document.addEventListener('DOMContentLoaded', function() {
    // 카테고리 사이드바는 main.js에서 렌더링
    loadCategoriesSidebar();

    // 검색과 초기 로드
    const form = document.getElementById('newsSearchForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const q = document.getElementById('newsQuery').value.trim();
            fetchPolicyNews(1, 12, q);
        });
    }

    fetchPolicyNews(1, 12, '');
});

function loadCategoriesSidebar() {
    fetch('data/categories.json')
        .then(resp => resp.json())
        .then(categories => {
            const categoryList = document.getElementById('categoryList');
            if (!categoryList) return;
            let html = '';
            categories.forEach(category => {
                html += `
                    <li class="mb-2">
                        <a href="${category.slug}.html" class="text-decoration-none">
                            <i class="fas ${category.icon} me-2"></i>
                            ${category.name}
                            <span class="float-end badge bg-secondary">${category.count}</span>
                        </a>
                    </li>
                `;
            });
            categoryList.innerHTML = html;
        })
        .catch(() => {});
}

// 정책브리핑 정책뉴스 API 호출 및 표시
async function fetchPolicyNews(pageNo = 1, numOfRows = 12, query = '') {
    const container = document.getElementById('newsContainer');
    const pagination = document.getElementById('newsPagination');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">정책뉴스를 불러오는 중...</p>
            </div>
        `;
    }

    try {
        const serviceKey = '4c32274bc908fe60086aea657eedb85f5eceb4b45186fe1e9e570ec12e554528';
        const baseUrl = 'https://apis.data.go.kr/1371000/policyNewsService/policyNewsList';
        const params = new URLSearchParams({
            serviceKey: serviceKey,
            pageNo: String(pageNo),
            numOfRows: String(numOfRows)
        });
        if (query) params.set('searchTxt', query);

        const url = `${baseUrl}?${params.toString()}`;
        const res = await fetch(url);
        const text = await res.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'application/xml');

        const items = Array.from(xml.getElementsByTagName('item'));
        const totalCountNode = xml.getElementsByTagName('totalCount')[0];
        const totalCount = totalCountNode ? parseInt(totalCountNode.textContent || '0') : items.length;

        renderNewsList(items, container);
        renderPagination(pageNo, numOfRows, totalCount, query, pagination);
    } catch (e) {
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-triangle-exclamation me-1"></i>
                    정책뉴스를 불러오는 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
}

function getXmlText(parent, tagNames) {
    if (!parent) return '';
    const tryTags = Array.isArray(tagNames) ? tagNames : [tagNames];
    for (const t of tryTags) {
        const n = parent.getElementsByTagName(t)[0];
        if (n && n.textContent) return n.textContent.trim();
    }
    return '';
}

function renderNewsList(items, container) {
    if (!container) return;
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 표시할 뉴스가 없습니다.
            </div>
        `;
        return;
    }

    let html = '';
    items.forEach(item => {
        const title = getXmlText(item, ['title', 'nttSj']);
        const link = getXmlText(item, ['url', 'orgLink', 'linkUrl']);
        const summary = getXmlText(item, ['summary', 'cn', 'nttCn']);
        const pubDate = getXmlText(item, ['pbdSttDate', 'regDate', 'pubDate', 'createdDate']);
        // 저작자/제공자 표기: writer, orgName, deptName 등 후보에서 우선순위로 선택
        const author = getXmlText(item, ['writer', 'orgName', 'deptName', 'source', 'dept']);

        const safeLink = link || '#';
        const dateText = pubDate ? new Date(pubDate).toLocaleDateString('ko-KR') : '';
        const authorText = author ? author : '대한민국 정책브리핑';

        html += `
            <article class="post-card">
                <div class="post-card-body">
                    <a href="${safeLink}" target="_blank" rel="noopener" class="post-title">
                        ${escapeHtml(title)}
                    </a>
                    <div class="post-meta">
                        <i class="fas fa-user"></i> ${escapeHtml(authorText)}
                        ${dateText ? `<span class="mx-2">|</span><i class=\"fas fa-calendar\"></i> ${dateText}` : ''}
                    </div>
                    <p class="post-excerpt">${escapeHtml(trimSummary(summary))}</p>
                    <a href="${safeLink}" target="_blank" rel="noopener" class="read-more">
                        원문 보기 <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    });

    container.innerHTML = html;
}

function renderPagination(pageNo, numOfRows, totalCount, query, paginationEl) {
    if (!paginationEl) return;
    const totalPages = Math.max(1, Math.ceil(totalCount / numOfRows));
    const current = Math.min(pageNo, totalPages);

    let html = '';
    const makePage = (p, label, disabled = false, active = false) => {
        return `
            <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${p}">${label}</a>
            </li>
        `;
    };

    html += makePage(1, '&laquo;', current === 1);
    html += makePage(Math.max(1, current - 1), '&lsaquo;', current === 1);

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);
    for (let p = start; p <= end; p++) {
        html += makePage(p, String(p), false, p === current);
    }

    html += makePage(Math.min(totalPages, current + 1), '&rsaquo;', current === totalPages);
    html += makePage(totalPages, '&raquo;', current === totalPages);

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('a.page-link').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const p = parseInt(a.getAttribute('data-page'));
            fetchPolicyNews(p, numOfRows, query);
        });
    });
}

function trimSummary(text) {
    if (!text) return '';
    const t = text.replace(/\s+/g, ' ').trim();
    return t.length > 160 ? t.substring(0, 160) + '...' : t;
}

function escapeHtml(s) {
    if (s == null) return '';
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


