// 대한민국은, 지금 - 정책브리핑 정책뉴스 연동

console.log('korea-now.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('korea-now.js DOMContentLoaded fired');
    
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

    // 기본은 정적 JSON을 우선 사용 (CORS 이슈 회피)
    loadStaticNewsJson();
});

function loadCategoriesSidebar() {
    fetch('data/categories.json?v=' + Date.now())
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

async function loadStaticNewsJson() {
    const container = document.getElementById('newsContainer');
    console.log('loadStaticNewsJson called, container:', container);
    
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
        console.log('Fetching korea_now.json...');
        const res = await fetch('data/korea_now.json?v=' + Date.now());
        console.log('Response status:', res.status);
        
        if (!res.ok) throw new Error('JSON not found');
        const data = await res.json();
        console.log('Data received:', data);
        
        const items = (data && Array.isArray(data.items)) ? data.items : [];
        console.log('Items count:', items.length);
        
        renderNewsListFromJson(items, container);
        renderSimpleCount(items.length);
    } catch (e) {
        console.error('Error loading news:', e);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-circle-info me-1"></i>
                    아직 뉴스 데이터가 준비되지 않았습니다. 잠시 후 새로고침해주세요.
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

function renderNewsListFromJson(items, container) {
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
    items.forEach(row => {
        const title = row.title || '';
        const link = row.link || '#';
        const summary = row.summary || '';
        const pubDate = row.pub_date || '';
        const author = row.author || '대한민국 정책브리핑';
        const dateText = pubDate ? new Date(pubDate).toLocaleDateString('ko-KR') : '';

        html += `
            <article class="post-card">
                <div class="post-card-body">
                    <a href="${link}" target="_blank" rel="noopener" class="post-title">
                        ${escapeHtml(title)}
                    </a>
                    <div class="post-meta">
                        <i class="fas fa-user"></i> ${escapeHtml(author)}
                        ${dateText ? `<span class="mx-2">|</span><i class=\"fas fa-calendar\"></i> ${dateText}` : ''}
                    </div>
                    <p class="post-excerpt">${escapeHtml(trimSummary(summary))}</p>
                    <a href="${link}" target="_blank" rel="noopener" class="read-more">
                        원문 보기 <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    });
    container.innerHTML = html;
}

function renderSimpleCount(count) {
    const pagination = document.getElementById('newsPagination');
    if (!pagination) return;
    pagination.innerHTML = `
        <li class="page-item disabled"><span class="page-link">총 ${count}건</span></li>
    `;
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


