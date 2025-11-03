// 대한민국은, 지금 - 정책브리핑 정책뉴스 연동 (versioned)

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

    // 기본은 정적 JSON을 우선 사용 (CORS 이슈 회피)
    loadStaticNewsJson();

    // 카테고리 탭 이벤트
    const categoryTabs = document.querySelectorAll('#categoryTabs .nav-link');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // 카테고리별 필터링 로직 추가 가능
        });
    });
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
        
        if (!res.ok) throw new Error('JSON not found');
        const data = await res.json();
        
        const items = (data && Array.isArray(data.items)) ? data.items : [];
        
        renderNewsListFromJson(items, container);
        renderSimpleCount(items.length);
    } catch (e) {
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
        let link = row.link || '#';
        const summary = row.summary || '';
        const pubDate = row.pub_date || '';
        const author = row.author || '대한민국 정책브리핑';
        const thumbnailUrl = row.thumbnail_url || '';
        const dateText = pubDate ? new Date(pubDate).toLocaleDateString('ko-KR') : '';
        
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

        // 이미지 상단, 텍스트 하단 (초기 구현), 썸네일 깨짐 방지
        const imageHtml = finalThumbnailUrl 
            ? `<img src="${finalThumbnailUrl}" alt="${escapeHtml(title)}" class="post-card-image" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400?text=%EC%9D%B4%EB%AF%B8%EC%A7%80+%EC%97%86%EC%9D%8C';">`
            : `<div class="post-card-image d-flex align-items-center justify-content-center">
                 <i class="fas fa-newspaper fa-4x text-muted"></i>
               </div>`;

        html += `
            <article class="post-card">
                ${imageHtml}
                <div class="post-card-body">
                    <a href="${link}" target="_blank" rel="noopener" class="post-title">
                        ${escapeHtml(title)}
                    </a>
                    <div class="post-meta">
                        <i class="fas fa-user"></i> ${escapeHtml(author)}
                        ${dateText ? `<span class="mx-2">|</span><i class=\"fas fa-calendar\"></i> ${dateText}` : ''}
                    </div>
                    <p class="post-excerpt">${escapeHtml(trimSummary(stripHtml(summary)))}</p>
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

