// 뉴스 상세 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // URL에서 뉴스 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('id');
    
    if (!newsId) {
        showError('뉴스 ID가 없습니다.');
        return;
    }
    
    // 뉴스 로드
    loadNewsDetail(newsId);
    
    // 카테고리 로드
    loadCategories();
});

// 뉴스 상세 로드
async function loadNewsDetail(newsId) {
    try {
        console.log(`[INFO] 뉴스 ${newsId} 상세 정보 로드 중...`);
        
        // korea_now.json에서 뉴스 찾기
        const response = await fetch('data/korea_now.json?v=' + Date.now());
        const data = await response.json();
        
        const newsIndex = parseInt(newsId);
        const news = data.items[newsIndex];
        
        if (!news) {
            showError('뉴스를 찾을 수 없습니다.');
            return;
        }
        
        // 뉴스 상세 표시
        displayNewsDetail(news);
        
    } catch (error) {
        console.error('[ERROR] 뉴스 로드 오류:', error);
        showError('뉴스를 불러오는 중 오류가 발생했습니다.');
    }
}

// 뉴스 상세 표시
function displayNewsDetail(news) {
    const newsDetail = document.getElementById('newsDetail');
    
    const pubDate = news.pub_date ? new Date(news.pub_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
    
    newsDetail.innerHTML = `
        <article class="news-detail-article">
            <div class="news-header mb-4">
                <div class="news-meta mb-3">
                    <span class="post-category">대한민국은, 지금</span>
                    <span class="post-date">
                        <i class="fas fa-calendar-alt me-1"></i>
                        ${pubDate}
                    </span>
                </div>
                <h1 class="news-title">${escapeHtml(news.title)}</h1>
                <div class="news-author">
                    <i class="fas fa-user me-1"></i>
                    ${escapeHtml(news.author || '대한민국 정책브리핑')}
                </div>
            </div>
            
            ${news.thumbnail_url ? `
                <div class="news-featured-image mb-4">
                    <img src="${news.thumbnail_url}" alt="${escapeHtml(news.title)}" 
                         style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 15px;"
                         referrerpolicy="no-referrer">
                </div>
            ` : ''}
            
            <div class="news-content">
                ${news.full_content || news.summary || ''}
            </div>
            
            <div class="news-footer mt-5">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div>
                        <a href="${news.link}" target="_blank" rel="noopener" class="btn btn-outline-primary">
                            <i class="fas fa-external-link-alt me-1"></i>원문 보기 (정책브리핑)
                        </a>
                    </div>
                    <div>
                        <button class="btn btn-outline-secondary" onclick="shareNews()">
                            <i class="fas fa-share-alt me-1"></i>공유하기
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

// 카테고리 로드
async function loadCategories() {
    try {
        const response = await fetch('data/categories.json?v=' + Date.now());
        const categories = await response.json();
        
        const categoryList = document.getElementById('categoryList');
        let html = '';
        
        categories.forEach(category => {
            html += `
                <li class="mb-2">
                    <a href="${category.slug}.html" class="text-decoration-none">
                        <i class="fas ${category.icon} me-2"></i>
                        ${category.name}
                    </a>
                </li>
            `;
        });
        
        categoryList.innerHTML = html;
        
    } catch (error) {
        console.error('[ERROR] 카테고리 로드 오류:', error);
    }
}

// 에러 표시
function showError(message) {
    const newsDetail = document.getElementById('newsDetail');
    newsDetail.innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4>오류가 발생했습니다</h4>
            <p>${message}</p>
            <a href="korea-now.html" class="btn btn-primary">뉴스 목록으로 돌아가기</a>
        </div>
    `;
}

// 뉴스 공유
function shareNews() {
    if (navigator.share) {
        navigator.share({
            title: document.querySelector('.news-title').textContent,
            text: '데일리웰100 - 대한민국은, 지금',
            url: window.location.href
        });
    } else {
        // 클립보드에 URL 복사
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('뉴스 링크가 클립보드에 복사되었습니다!');
        });
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

