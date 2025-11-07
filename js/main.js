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
        setupCategoryFilter(); // 카테고리 필터 이벤트 설정
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
        let posts = postsData.posts || [];
        
        // 대한민국은, 지금 데이터 로드
        try {
            const koreaNowResponse = await fetch('data/korea_now.json');
            const koreaNowData = await koreaNowResponse.json();
            const koreaNowPosts = (koreaNowData.items || []).map((item, index) => ({
                id: `korea_now_${index}`,
                title: item.title,
                category: '대한민국은, 지금',
                author: item.author || '정책브리핑',
                created_at: item.pub_date,
                excerpt: item.summary ? item.summary.replace(/<[^>]*>/g, '').substring(0, 200) : '',
                featured_image: item.thumbnail_url,
                content: item.summary || '',
                link: item.link
            }));
            posts = posts.concat(koreaNowPosts);
            console.log('📰 대한민국은, 지금:', koreaNowPosts.length, '개');
        } catch (error) {
            console.warn('⚠️ 대한민국은, 지금 데이터 로드 실패:', error);
        }
        
        // 가보자고 데이터 로드
        try {
            const goNowResponse = await fetch('data/go_now.json');
            const goNowData = await goNowResponse.json();
            const goNowPosts = (goNowData.items || []).map((item, index) => ({
                id: `go_now_${index}`,
                title: item.title,
                category: '가보자고',
                author: '한국관광공사',
                created_at: new Date().toISOString(),
                excerpt: item.addr1 || '',
                featured_image: item.firstimage || item.firstimage2,
                content: item.addr1 || '',
                link: item.detail_link
            }));
            posts = posts.concat(goNowPosts);
            console.log('🗺️ 가보자고:', goNowPosts.length, '개');
        } catch (error) {
            console.warn('⚠️ 가보자고 데이터 로드 실패:', error);
        }
        
        allPosts = posts;
        console.log('📦 전체 게시글 데이터 로드 완료:', allPosts.length, '개');
        
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
        ? `<img src="${post.featured_image}" alt="${post.title}" class="post-card-image" 
             style="width: 100%; height: 300px; object-fit: cover; object-position: center; display: block;"
             onload="this.style.opacity='1';">`
        : `<div class="post-card-image d-flex align-items-center justify-content-center" 
             style="width: 100%; height: 300px;">
             <i class="fas fa-newspaper fa-4x text-muted"></i>
           </div>`;
    
    const excerpt = post.excerpt || post.content.substring(0, 200).replace(/<[^>]*>/g, '');
    const date = new Date(post.created_at).toLocaleDateString('ko-KR');
    
    // 외부 링크가 있으면 외부 링크로, 없으면 내부 링크로
    const postLink = post.link || `post.html?id=${post.id}`;
    const linkTarget = post.link ? 'target="_blank" rel="noopener"' : '';
    
    return `
        <article class="post-card">
            ${imageHtml}
            <div class="post-card-body">
                <a href="${categorySlug}.html" class="post-category">
                    ${post.category}
                </a>
                
                <a href="${postLink}" ${linkTarget} class="post-title">
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
                
                <a href="${postLink}" ${linkTarget} class="read-more">
                    원문 보기 <i class="fas fa-arrow-right"></i>
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

// 카테고리 필터 설정
function setupCategoryFilter() {
    const filterButtons = document.querySelectorAll('#categoryFilter button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 버튼에서 active 클래스 제거
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 카테고리로 필터링
            const category = this.getAttribute('data-category');
            filterPostsByCategory(category);
        });
    });
}

// 카테고리별 게시글 필터링
function filterPostsByCategory(category) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    let filteredPosts;
    
    if (category === 'all') {
        // 전체: 최근 게시글 10개
        filteredPosts = Array.isArray(allPosts) ? allPosts.slice(0, 10) : [];
    } else {
        // 특정 카테고리: 해당 카테고리의 최근 게시글 10개
        filteredPosts = Array.isArray(allPosts) 
            ? allPosts.filter(post => post.category === category).slice(0, 10) 
            : [];
    }
    
    let html = '';
    if (filteredPosts.length > 0) {
        filteredPosts.forEach(post => {
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
}

