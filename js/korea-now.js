// 대한민국은, 지금 - 정책브리핑 정책뉴스 연동 (페이지네이션 포함)

let allNewsItems = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

document.addEventListener('DOMContentLoaded', function() {
    
    // 카테고리 사이드바는 main.js에서 렌더링
    loadCategoriesSidebar();

    // 검색과 초기 로드
    const form = document.getElementById('newsSearchForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const q = document.getElementById('newsQuery').value.trim();
            searchNews(q);
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
        const res = await fetch('data/korea_now.json?v=' + Date.now());
        
        if (!res.ok) {
            console.error('[ERROR] JSON 로드 실패:', res.status, res.statusText);
            throw new Error(`JSON not found: ${res.status}`);
        }
        const data = await res.json();
        
        allNewsItems = (data && Array.isArray(data.items)) ? data.items : [];
        console.log(`[INFO] ${allNewsItems.length}개 뉴스 로드 완료`);
        
        if (allNewsItems.length === 0) {
            console.warn('[WARN] 뉴스 아이템이 없습니다');
        }
        
        currentPage = 1;
        renderPage();
    } catch (e) {
        console.error('[ERROR] 뉴스 로드 에러:', e);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-circle-info me-1"></i>
                    아직 뉴스 데이터가 준비되지 않았습니다. 잠시 후 새로고침해주세요.
                    <br><small class="text-muted">에러: ${e.message}</small>
                </div>
            `;
        }
    }
}

function renderPage() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    // 현재 페이지에 표시할 아이템 계산
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageItems = allNewsItems.slice(startIndex, endIndex);
    
    if (pageItems.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 표시할 뉴스가 없습니다.
            </div>
        `;
        return;
    }
    
    // 뉴스 카드 렌더링
    renderNewsListFromJson(pageItems, container);
    
    // 페이지네이션 렌더링
    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(allNewsItems.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';
    
    // 이전 버튼
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i> 이전
            </a>
        </li>
    `;
    
    // 페이지 번호 버튼 (최대 10개만 표시)
    const maxButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // 시작 페이지 조정
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                다음 <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    html += '</ul></nav>';
    html += `<p class="text-center text-muted mt-2">전체 ${allNewsItems.length}개 중 ${startIndex + 1}-${Math.min(endIndex, allNewsItems.length)}개 표시</p>`;
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(allNewsItems.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderPage();
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchNews(query) {
    if (!query) {
        currentPage = 1;
        renderPage();
        return;
    }
    
    // 검색 필터링
    const filtered = allNewsItems.filter(item => 
        item.title.includes(query) || 
        (item.summary && item.summary.includes(query))
    );
    
    // 임시로 필터링된 결과 표시
    const container = document.getElementById('newsContainer');
    if (filtered.length > 0) {
        renderNewsListFromJson(filtered, container);
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.innerHTML = `<p class="text-center text-muted">검색 결과: ${filtered.length}개</p>`;
        }
    } else {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> "${escapeHtml(query)}"에 대한 검색 결과가 없습니다.
            </div>
        `;
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
    items.forEach((row, index) => {
        const title = row.title || '';
        let link = row.link || '#';
        const summary = row.summary || '';
        const pubDate = row.pub_date || '';
        const author = row.author || '대한민국 정책브리핑';
        const thumbnailUrl = row.thumbnail_url || '';
        const dateText = pubDate ? new Date(pubDate).toLocaleDateString('ko-KR') : '';
        
        // 자체 뉴스 상세 페이지로 연결 (인덱스 기반)
        const actualIndex = allNewsItems.indexOf(row);
        const detailLink = `news-detail.html?id=${actualIndex}`;
        
        // 썸네일 이미지 URL 결정: summary HTML에서 첫 이미지 우선 사용
        let finalThumbnailUrl = thumbnailUrl;
        if (!finalThumbnailUrl && summary) {
            // summary HTML에서 첫 번째 이미지 URL 추출
            const imgMatch = summary.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
                finalThumbnailUrl = imgMatch[1];
            }
        }
        
        // HTTPS 강제 (혼합 콘텐츠 방지)
        if (typeof finalThumbnailUrl === 'string' && finalThumbnailUrl.startsWith('http://')) {
            finalThumbnailUrl = finalThumbnailUrl.replace('http://', 'https://');
        }
        if (typeof link === 'string' && link.startsWith('http://')) {
            link = link.replace('http://', 'https://');
        }

        // 원본 이미지 직접 사용 (프록시 제거로 고품질 유지)
        let imageUrlToUse = finalThumbnailUrl;

        // 이미지 상단, 텍스트 하단 - 가로 100% 고정 높이 300px
        const imageHtml = imageUrlToUse 
            ? `<div style="width: 100%; height: 300px; background: #f8f9fa; overflow: hidden; position: relative;">
                 <img 
                    src="${imageUrlToUse}" 
                    alt="${escapeHtml(title)}" 
                    loading="lazy" 
                    decoding="async"
                    style="width: 100%; height: 300px; object-fit: cover; object-position: center; display: block;"
                    referrerpolicy="no-referrer"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'d-flex align-items-center justify-content-center\\' style=\\'width:100%;height:300px;background:#f8f9fa;\\'><i class=\\'fas fa-newspaper fa-4x text-muted\\'></i></div>';"
                    onload="this.style.opacity='1';">
               </div>`
            : `<div style="width: 100%; height: 300px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                 <i class="fas fa-newspaper fa-4x text-muted"></i>
               </div>`;

        html += `
            <article class="post-card">
                ${imageHtml}
                <div class="post-card-body">
                    <a href="${detailLink}" class="post-title">
                        ${escapeHtml(title)}
                    </a>
                    <div class="post-meta">
                        <i class="fas fa-user"></i> ${escapeHtml(author)}
                        ${dateText ? `<span class="mx-2">|</span><i class=\"fas fa-calendar\"></i> ${dateText}` : ''}
                    </div>
                    <p class="post-excerpt">${escapeHtml(trimSummary(stripHtml(summary)))}</p>
                    <a href="${detailLink}" class="read-more">
                        자세히 보기 <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    });
    container.innerHTML = html;
}


function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
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


