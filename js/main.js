// 데일리웰100 - 메인 JavaScript

let allPosts = [];
let allCategories = [];

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    
    // 현재 페이지 확인
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'index.html' || currentPage === '') {
        displayMainPage();
    } else if (currentPage === 'health.html') {
        displayCategoryPage('건강상식');
    } else if (currentPage === 'korea-now.html') {
        // 별도의 페이지 스크립트가 로드되므로 여기서는 아무 것도 하지 않음
    } else if (currentPage === 'fortune.html') {
        displayCategoryPage('오늘의 운세');
    } else if (currentPage.startsWith('post-')) {
        const postId = parseInt(currentPage.replace('post-', '').replace('.html', ''));
        displayPostDetail(postId);
    }
});

// 데이터 로드
async function loadData() {
    try {
        // 게시글 데이터 로드
        const postsResponse = await fetch('data/posts.json');
        const postsData = await postsResponse.json();
        allPosts = postsData.posts || [];
        console.log('📦 게시글 데이터 로드 완료:', allPosts.length, '개');
        
        // 카테고리 데이터 로드
        const categoriesResponse = await fetch('data/categories.json?v=' + Date.now());
        allCategories = await categoriesResponse.json();
        
        console.log(`✅ ${allPosts.length}개 게시글 로드 완료`);
        console.log(`✅ ${allCategories.length}개 카테고리 로드 완료`);
    } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
    }
}

// 메인 페이지 표시
function displayMainPage() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    // 최근 게시글 10개
    const recentPosts = Array.isArray(allPosts) ? allPosts.slice(0, 10) : [];
    
    let html = '';
    recentPosts.forEach(post => {
        html += createPostCard(post);
    });
    
    postsContainer.innerHTML = html;
    
    // 카테고리 통계 업데이트
    updateCategorySidebar();
}

// 카테고리 페이지 표시
function displayCategoryPage(categoryName) {
    const postsContainer = document.getElementById('postsContainer');
    const categoryTitle = document.getElementById('categoryTitle');
    
    if (!postsContainer) return;
    
    // 해당 카테고리 게시글 필터링
    const categoryPosts = Array.isArray(allPosts) ? allPosts.filter(post => post.category === categoryName) : [];
    
    // 제목 업데이트
    if (categoryTitle) {
        categoryTitle.textContent = categoryName;
    }
    
    let html = '';
    if (categoryPosts.length > 0) {
        categoryPosts.forEach(post => {
            html += createPostCard(post);
        });
    } else {
        html = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 게시글이 없습니다.
            </div>
        `;
    }
    
    postsContainer.innerHTML = html;
    
    // 카테고리 통계 업데이트
    updateCategorySidebar();
}

// 게시글 카드 생성
function createPostCard(post) {
    const categorySlug = getCategorySlug(post.category);
    const imageHtml = post.featured_image 
        ? `<img src="${post.featured_image}" alt="${post.title}" class="post-card-image">`
        : `<div class="post-card-image d-flex align-items-center justify-content-center">
             <i class="fas fa-newspaper fa-4x text-muted"></i>
           </div>`;
    
    const excerpt = post.excerpt || post.content.substring(0, 200).replace(/<[^>]*>/g, '');
    const date = new Date(post.created_at).toLocaleDateString('ko-KR');
    
    return `
        <article class="post-card">
            ${imageHtml}
            <div class="post-card-body">
                <a href="${categorySlug}.html" class="post-category">
                    ${post.category}
                </a>
                
                <a href="post.html?id=${post.id}" class="post-title">
                    ${post.title}
                </a>
                
                <div class="post-meta">
                    <i class="fas fa-user"></i> ${post.author}
                    <span class="mx-2">|</span>
                    <i class="fas fa-calendar"></i> ${date}
                    ${post.views > 0 ? `
                    <span class="mx-2">|</span>
                    <i class="fas fa-eye"></i> ${post.views}
                    ` : ''}
                </div>
                
                <p class="post-excerpt">${excerpt}...</p>
                
                <a href="post.html?id=${post.id}" class="read-more">
                    자세히 보기 <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </article>
    `;
}

// 게시글 상세 표시
function displayPostDetail(postId) {
    const post = allPosts.find(p => p.id === postId);
    
    if (!post) {
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 게시글을 찾을 수 없습니다.
                </div>
                <a href="index.html" class="btn btn-primary">
                    <i class="fas fa-home"></i> 홈으로 돌아가기
                </a>
            </div>
        `;
        return;
    }
    
    // 제목 업데이트
    document.title = `${post.title} - 데일리웰100`;
    
    const postContainer = document.getElementById('postContainer');
    if (!postContainer) return;
    
    const date = new Date(post.created_at).toLocaleDateString('ko-KR');
    const categorySlug = getCategorySlug(post.category);
    
    postContainer.innerHTML = `
        <article class="post-detail">
            <div class="mb-3">
                <a href="${categorySlug}.html" class="post-category">
                    ${post.category}
                </a>
            </div>
            
            <h1 class="post-title mb-3">${post.title}</h1>
            
            <div class="post-meta mb-4">
                <i class="fas fa-user"></i> ${post.author}
                <span class="mx-2">|</span>
                <i class="fas fa-calendar"></i> ${date}
                ${post.views > 0 ? `
                <span class="mx-2">|</span>
                <i class="fas fa-eye"></i> ${post.views}
                ` : ''}
            </div>
            
            ${post.featured_image ? `
            <div class="text-center mb-4">
                <img src="${post.featured_image}" alt="${post.title}" class="img-fluid rounded" style="max-height: 400px;">
            </div>
            ` : ''}
            
            <div class="post-content">
                ${post.content}
            </div>
            
            <hr class="my-5">
            
            <div class="text-center">
                <a href="index.html" class="btn btn-outline-primary">
                    <i class="fas fa-home"></i> 홈으로 돌아가기
                </a>
                <a href="${categorySlug}.html" class="btn btn-outline-secondary ms-2">
                    <i class="fas fa-list"></i> ${post.category} 목록
                </a>
            </div>
        </article>
    `;
}

// 카테고리 사이드바 업데이트
function updateCategorySidebar() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;
    
    let html = '';
    allCategories.forEach(category => {
        const categorySlug = category.slug;
        html += `
            <li>
                <a href="${categorySlug}.html">
                    <i class="fas ${category.icon} me-2"></i>
                    ${category.name}
                    <span class="float-end badge bg-secondary">${category.count}</span>
                </a>
            </li>
        `;
    });
    
    categoryList.innerHTML = html;
}

// 카테고리 슬러그 가져오기
function getCategorySlug(categoryName) {
    const category = allCategories.find(c => c.name === categoryName);
    return category ? category.slug : 'index';
}

// 검색 기능
function searchPosts(query) {
    if (!query.trim()) {
        displayMainPage();
        return;
    }
    
    const searchResults = Array.isArray(allPosts) ? allPosts.filter(post => 
        post.title.includes(query) || 
        post.content.includes(query) ||
        (post.excerpt && post.excerpt.includes(query))
    ) : [];
    
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    let html = '';
    if (searchResults.length > 0) {
        html = `<h3 class="mb-4">검색 결과: "${query}" (${searchResults.length}개)</h3>`;
        searchResults.forEach(post => {
            html += createPostCard(post);
        });
    } else {
        html = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> "${query}"에 대한 검색 결과가 없습니다.
            </div>
        `;
    }
    
    postsContainer.innerHTML = html;
}

// 검색 폼 제출 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = document.getElementById('searchInput').value;
            searchPosts(query);
        });
    }
});

