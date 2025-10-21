// 게시글 상세 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // URL에서 게시글 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        showError('게시글 ID가 없습니다.');
        return;
    }
    
    // 게시글 로드
    loadPostDetail(postId);
    
    // 카테고리 로드
    loadCategories();
    
    // 최근 게시글 로드
    loadRecentPosts();
});

// 게시글 상세 로드
async function loadPostDetail(postId) {
    try {
        console.log(`📖 게시글 ${postId} 상세 정보 로드 중...`);
        
        // posts.json에서 게시글 찾기
        const response = await fetch('data/posts.json');
        const data = await response.json();
        
        const post = data.posts.find(p => p.id == postId);
        
        if (!post) {
            showError('게시글을 찾을 수 없습니다.');
            return;
        }
        
        // 게시글 상세 표시
        displayPostDetail(post);
        
        // 관련 게시글 로드
        loadRelatedPosts(post.category, postId);
        
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
}

// 게시글 상세 표시
function displayPostDetail(post) {
    const postDetail = document.getElementById('postDetail');
    
    // 조회수 증가 (로컬 스토리지 사용)
    incrementViewCount(post.id);
    
    postDetail.innerHTML = `
        <div class="post-header mb-4">
            <div class="post-meta mb-3">
                <span class="post-category">${post.category}</span>
                <span class="post-date">
                    <i class="fas fa-calendar-alt me-1"></i>
                    ${formatDate(post.created_at)}
                </span>
                <span class="post-views">
                    <i class="fas fa-eye me-1"></i>
                    ${getViewCount(post.id)}회 조회
                </span>
            </div>
            <h1 class="post-title">${post.title}</h1>
            <div class="post-author">
                <i class="fas fa-user me-1"></i>
                ${post.author || '시니어 전문 저널리스트 장병희'}
            </div>
        </div>
        
        ${post.featured_image ? `
            <div class="post-image mb-4">
                <img src="${post.featured_image}" 
                     alt="${post.title}" 
                     class="img-fluid rounded"
                     style="width: 100%; height: 400px; object-fit: cover;">
            </div>
        ` : ''}
        
        <div class="post-content">
            ${post.content}
        </div>
        
        <div class="post-footer mt-5">
            <div class="d-flex justify-content-between align-items-center">
                <div class="post-tags">
                    <i class="fas fa-tags me-1"></i>
                    <span class="badge bg-secondary me-1">${post.category}</span>
                    <span class="badge bg-light text-dark">건강정보</span>
                </div>
                <div class="post-share">
                    <button class="btn btn-outline-primary btn-sm" onclick="sharePost()">
                        <i class="fas fa-share-alt me-1"></i>공유하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 관련 게시글 로드
async function loadRelatedPosts(category, currentPostId) {
    try {
        const response = await fetch('data/posts.json');
        const data = await response.json();
        
        // 같은 카테고리의 다른 게시글들 (최대 4개)
        const relatedPosts = data.posts
            .filter(p => p.category === category && p.id != currentPostId)
            .slice(0, 4);
        
        displayRelatedPosts(relatedPosts);
        
    } catch (error) {
        console.error('관련 게시글 로드 오류:', error);
    }
}

// 관련 게시글 표시
function displayRelatedPosts(posts) {
    const relatedPostsContainer = document.getElementById('relatedPosts');
    
    if (posts.length === 0) {
        relatedPostsContainer.innerHTML = `
            <div class="col-12 text-center py-4">
                <p class="text-muted">관련 게시글이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card h-100">
                    ${post.featured_image ? `
                        <img src="${post.featured_image}" 
                             class="card-img-top" 
                             alt="${post.title}"
                             style="height: 150px; object-fit: cover;">
                    ` : ''}
                    <div class="card-body">
                        <h6 class="card-title">
                            <a href="post.html?id=${post.id}" class="text-decoration-none">
                                ${post.title}
                            </a>
                        </h6>
                        <p class="card-text small text-muted">
                            ${post.excerpt || post.content.substring(0, 100) + '...'}
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i>
                            ${formatDate(post.created_at)}
                        </small>
                    </div>
                </div>
            </div>
        `;
    });
    
    relatedPostsContainer.innerHTML = html;
}

// 카테고리 로드
async function loadCategories() {
    try {
        const response = await fetch('data/categories.json');
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
        console.error('카테고리 로드 오류:', error);
    }
}

// 최근 게시글 로드
async function loadRecentPosts() {
    try {
        const response = await fetch('data/posts.json');
        const data = await response.json();
        
        // 최근 5개 게시글
        const recentPosts = data.posts.slice(0, 5);
        
        const recentPostsContainer = document.getElementById('recentPosts');
        let html = '';
        
        recentPosts.forEach(post => {
            html += `
                <div class="recent-post mb-3">
                    <h6 class="mb-1">
                        <a href="post.html?id=${post.id}" class="text-decoration-none">
                            ${post.title}
                        </a>
                    </h6>
                    <small class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>
                        ${formatDate(post.created_at)}
                    </small>
                </div>
            `;
        });
        
        recentPostsContainer.innerHTML = html;
        
    } catch (error) {
        console.error('최근 게시글 로드 오류:', error);
    }
}

// 조회수 증가
function incrementViewCount(postId) {
    const viewKey = `post_views_${postId}`;
    const currentViews = parseInt(localStorage.getItem(viewKey) || '0');
    localStorage.setItem(viewKey, (currentViews + 1).toString());
}

// 조회수 가져오기
function getViewCount(postId) {
    const viewKey = `post_views_${postId}`;
    return parseInt(localStorage.getItem(viewKey) || '0');
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 에러 표시
function showError(message) {
    const postDetail = document.getElementById('postDetail');
    postDetail.innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4>오류가 발생했습니다</h4>
            <p>${message}</p>
            <a href="index.html" class="btn btn-primary">홈으로 돌아가기</a>
        </div>
    `;
}

// 게시글 공유
function sharePost() {
    if (navigator.share) {
        navigator.share({
            title: document.querySelector('.post-title').textContent,
            text: document.querySelector('.post-content').textContent.substring(0, 100),
            url: window.location.href
        });
    } else {
        // 클립보드에 URL 복사
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('게시글 링크가 클립보드에 복사되었습니다!');
        });
    }
}


