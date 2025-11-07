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
        
        let post = data.posts.find(p => p.id == postId);
        
        if (!post) {
            showError('게시글을 찾을 수 없습니다.');
            return;
        }
        
        // 운세 데이터의 날짜를 오늘로 업데이트
        if (post.category === '오늘의 운세') {
            const today = new Date();
            const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;
            post.title = post.title.replace(/\d+월 \d+일/, todayStr);
            post.created_at = today.toISOString();
            post.updated_at = today.toISOString();
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
    
    // 운세 페이지인 경우 강화 콘텐츠 생성
    const isFortunePost = post.category === '오늘의 운세';
    const enhancedContent = isFortunePost ? generateEnhancedFortuneContent(post.title) : '';
    
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
        
        
        <div class="post-content">
            ${enhanceBasicContent(post.content)}
            ${enhancedContent}
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

// 기본 콘텐츠에 이모지 추가
function enhanceBasicContent(content) {
    const emojiMap = {
        '전체 운세': '🌟',
        '사랑운': '💕',
        '금전운': '💰',
        '건강운': '🏃',
        '학업운': '📚',
        '직업운': '💼',
        '오늘의 조언': '💡'
    };
    
    let enhanced = content;
    
    // h3 태그에 이모지 추가
    for (let [key, emoji] of Object.entries(emojiMap)) {
        enhanced = enhanced.replace(
            new RegExp(`<h3>${key}</h3>`, 'g'),
            `<h3><span style="font-size: 1.2em;">${emoji}</span> ${key}</h3>`
        );
    }
    
    // 별점에 색상 추가
    enhanced = enhanced.replace(/★/g, '<span style="color: #FFD700;">★</span>');
    enhanced = enhanced.replace(/☆/g, '<span style="color: #dee2e6;">☆</span>');
    
    return enhanced;
}

// 강화된 운세 콘텐츠 생성
function generateEnhancedFortuneContent(title) {
    const fortuneType = title.match(/(양자리|황소자리|쌍둥이자리|게자리|사자자리|처녀자리|천칭자리|전갈자리|사수자리|염소자리|물병자리|물고기자리|쥐띠|소띠|호랑이띠|토끼띠|용띠|뱀띠|말띠|양띠|원숭이띠|닭띠|개띠|돼지띠)/);
    const type = fortuneType ? fortuneType[1] : '양자리';
    
    const luckyNumbers = generateLuckyNumbers();
    const luckyColors = getLuckyColors(type);
    const luckyTime = getLuckyTime();
    const compatibleSigns = getCompatibleSigns(type);
    const warnings = getWarnings();
    const recommendations = getRecommendations();
    const quote = getDailyQuote();
    const accuracy = Math.floor(Math.random() * 10) + 85;
    const viewers = Math.floor(Math.random() * 5000) + 15000;
    
    return `
        <hr class="my-5">
        
        <!-- 행운의 요소 -->
        <h3><span style="font-size: 1.2em;">🍀</span> 오늘의 행운 요소</h3>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="fortune-luck-card">
                    <div class="luck-icon">🔢</div>
                    <div class="luck-label">행운의 숫자</div>
                    <div class="luck-value">${luckyNumbers.join(', ')}</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="fortune-luck-card">
                    <div class="luck-icon">🎨</div>
                    <div class="luck-label">행운의 색상</div>
                    <div class="luck-value">
                        ${luckyColors.map(c => `<span class="color-badge" style="background-color: ${c.code}; color: white; padding: 5px 12px; border-radius: 15px; display: inline-block; margin: 2px;">${c.name}</span>`).join(' ')}
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="fortune-luck-card">
                    <div class="luck-icon">⏰</div>
                    <div class="luck-label">행운의 시간</div>
                    <div class="luck-value">${luckyTime}</div>
                </div>
            </div>
        </div>
        
        <!-- 시간대별 운세 -->
        <h3><span style="font-size: 1.2em;">🕐</span> 시간대별 운세</h3>
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="time-fortune-item">
                    <div class="time-period">🌅 오전 (6시-12시)</div>
                    <div class="time-rating"><span style="color: #FFD700;">★★★★☆</span></div>
                    <div class="time-desc">활기찬 시작! 중요한 결정이나 미팅에 적합합니다.</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="time-fortune-item">
                    <div class="time-period">☀️ 오후 (12시-6시)</div>
                    <div class="time-rating"><span style="color: #FFD700;">★★★☆☆</span></div>
                    <div class="time-desc">안정적인 시간. 꾸준한 업무 진행이 좋습니다.</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="time-fortune-item">
                    <div class="time-period">🌆 저녁 (6시-12시)</div>
                    <div class="time-rating"><span style="color: #FFD700;">★★★★★</span></div>
                    <div class="time-desc">최고의 시간! 사랑하는 사람들과 함께하세요.</div>
                </div>
            </div>
        </div>
        
        <!-- 궁합 -->
        <h3><span style="font-size: 1.2em;">💕</span> 오늘의 궁합</h3>
        <div class="compatibility-content mb-4">
            <p><strong>🌟 최고의 궁합:</strong> ${compatibleSigns.best.join(', ')}</p>
            <p><strong>👍 좋은 궁합:</strong> ${compatibleSigns.good.join(', ')}</p>
            <p class="text-muted small mb-0">※ 이 분들과 함께하면 좋은 기운이 배가됩니다!</p>
        </div>
        
        <!-- 주의사항 -->
        <h3><span style="font-size: 1.2em;">⚠️</span> 오늘 주의할 점</h3>
        <div class="warning-content mb-4">
            ${warnings.map(w => `
                <div class="warning-item">
                    <span class="warning-icon">${w.icon}</span>
                    <span class="warning-text">${w.text}</span>
                </div>
            `).join('')}
        </div>
        
        <!-- 추천 활동 -->
        <h3><span style="font-size: 1.2em;">✨</span> 오늘의 추천 활동</h3>
        <div class="row g-3 mb-4">
            ${recommendations.map(r => `
                <div class="col-md-6">
                    <div class="recommend-item">
                        <div class="recommend-icon">${r.icon}</div>
                        <div class="recommend-title">${r.title}</div>
                        <div class="recommend-desc">${r.desc}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- 오늘의 한마디 -->
        <div class="fortune-quote mb-4">
            <div class="quote-icon">💬</div>
            <div class="quote-text">"${quote}"</div>
        </div>
        
        <!-- 운세 정확도 -->
        <div class="fortune-accuracy-section">
            <p class="text-center text-muted small mb-0">
                <span style="font-size: 1.2em;">📊</span> 오늘 운세의 예상 적중률: <strong>${accuracy}%</strong>
                <br>
                <span style="font-size: 1.2em;">👥</span> 오늘 ${viewers.toLocaleString()}명이 이 운세를 확인했습니다
            </p>
        </div>
    `;
}

function generateLuckyNumbers() {
    const numbers = [];
    while (numbers.length < 3) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers.sort((a, b) => a - b);
}

function getLuckyColors(fortuneType) {
    const colorSets = {
        '양자리': [{ name: '빨강', code: '#FF6B6B' }, { name: '주황', code: '#FFA94D' }],
        '황소자리': [{ name: '초록', code: '#51CF66' }, { name: '갈색', code: '#A0522D' }],
        '쌍둥이자리': [{ name: '노랑', code: '#FFD43B' }, { name: '하늘색', code: '#74C0FC' }],
        '게자리': [{ name: '은색', code: '#C0C0C0' }, { name: '흰색', code: '#F8F9FA' }],
        '사자자리': [{ name: '금색', code: '#FFD700' }, { name: '주황', code: '#FF922B' }],
        '처녀자리': [{ name: '베이지', code: '#F4E4C1' }, { name: '회색', code: '#ADB5BD' }],
        '천칭자리': [{ name: '분홍', code: '#FFB3BA' }, { name: '청록', code: '#4DABF7' }],
        '전갈자리': [{ name: '검정', code: '#2C2C2C' }, { name: '진홍', code: '#C92A2A' }],
        '사수자리': [{ name: '보라', code: '#9775FA' }, { name: '파랑', code: '#4C6EF5' }],
        '염소자리': [{ name: '회색', code: '#868E96' }, { name: '갈색', code: '#8B4513' }],
        '물병자리': [{ name: '청록', code: '#20C997' }, { name: '전기파랑', code: '#339AF0' }],
        '물고기자리': [{ name: '연보라', code: '#D0BFFF' }, { name: '바다색', code: '#66D9E8' }],
        '쥐띠': [{ name: '파랑', code: '#4C6EF5' }, { name: '검정', code: '#2C2C2C' }],
        '소띠': [{ name: '갈색', code: '#8B4513' }, { name: '초록', code: '#51CF66' }],
        '호랑이띠': [{ name: '주황', code: '#FF922B' }, { name: '검정', code: '#2C2C2C' }],
        '토끼띠': [{ name: '분홍', code: '#FFB3BA' }, { name: '흰색', code: '#F8F9FA' }],
        '용띠': [{ name: '금색', code: '#FFD700' }, { name: '빨강', code: '#FF6B6B' }],
        '뱀띠': [{ name: '보라', code: '#9775FA' }, { name: '검정', code: '#2C2C2C' }],
        '말띠': [{ name: '빨강', code: '#FF6B6B' }, { name: '갈색', code: '#A0522D' }],
        '양띠': [{ name: '초록', code: '#51CF66' }, { name: '흰색', code: '#F8F9FA' }],
        '원숭이띠': [{ name: '노랑', code: '#FFD43B' }, { name: '금색', code: '#FFD700' }],
        '닭띠': [{ name: '금색', code: '#FFD700' }, { name: '빨강', code: '#FF6B6B' }],
        '개띠': [{ name: '갈색', code: '#A0522D' }, { name: '흰색', code: '#F8F9FA' }],
        '돼지띠': [{ name: '검정', code: '#2C2C2C' }, { name: '금색', code: '#FFD700' }]
    };
    return colorSets[fortuneType] || [{ name: '빨강', code: '#FF6B6B' }, { name: '주황', code: '#FFA94D' }];
}

function getLuckyTime() {
    const times = ['오전 7시-9시', '오전 10시-12시', '오후 1시-3시', '오후 4시-6시', '저녁 7시-9시', '저녁 10시-12시'];
    return times[Math.floor(Math.random() * times.length)];
}

function getCompatibleSigns(fortuneType) {
    const allSigns = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];
    const shuffled = allSigns.filter(s => s !== fortuneType).sort(() => 0.5 - Math.random());
    return { best: shuffled.slice(0, 2), good: shuffled.slice(2, 5) };
}

function getWarnings() {
    const allWarnings = [
        { icon: '🚗', text: '외출 시 교통안전에 주의하세요' },
        { icon: '💰', text: '충동구매는 자제하시고 계획적인 소비를 하세요' },
        { icon: '😤', text: '감정적인 대화는 피하고 이성적으로 대처하세요' },
        { icon: '🍔', text: '과식을 피하고 규칙적인 식사를 하세요' },
        { icon: '📱', text: '중요한 약속이나 일정을 다시 한번 확인하세요' },
        { icon: '💤', text: '과로를 피하고 충분한 휴식을 취하세요' }
    ];
    return allWarnings.sort(() => 0.5 - Math.random()).slice(0, 3);
}

function getRecommendations() {
    const allRecommendations = [
        { icon: '🚶', title: '가벼운 산책', desc: '30분 정도의 산책이 건강에 좋습니다' },
        { icon: '☕', title: '여유로운 티타임', desc: '좋아하는 차 한 잔의 여유를 즐기세요' },
        { icon: '📞', title: '소중한 사람에게 연락', desc: '오랜만에 연락이 닿지 않은 분께 안부 전화를' },
        { icon: '📚', title: '독서', desc: '좋은 책이 마음의 양식이 됩니다' },
        { icon: '🧘', title: '명상/요가', desc: '10분간의 명상으로 마음의 평화를' },
        { icon: '🎵', title: '음악 감상', desc: '좋아하는 음악을 들으며 힐링하세요' }
    ];
    return allRecommendations.sort(() => 0.5 - Math.random()).slice(0, 4);
}

function getDailyQuote() {
    const quotes = [
        '오늘 하루도 최선을 다하는 당신이 아름답습니다',
        '작은 행복이 모여 큰 기쁨이 됩니다',
        '긍정적인 마음이 긍정적인 하루를 만듭니다',
        '오늘을 살아있음에 감사하세요',
        '천천히, 그러나 꾸준히 나아가세요',
        '당신의 미소가 누군가에게 행복이 됩니다'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
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


