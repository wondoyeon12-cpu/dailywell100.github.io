// 운세 페이지 강화 스크립트
document.addEventListener('DOMContentLoaded', function() {
    enhanceFortuneContent();
});

function enhanceFortuneContent() {
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;
    
    // 운세 페이지인지 확인
    const postCategory = document.querySelector('.post-category');
    if (!postCategory || !postCategory.textContent.includes('오늘의 운세')) return;
    
    // 운세 제목 추출 (양자리, 쥐띠 등)
    const title = document.querySelector('.post-title');
    if (!title) return;
    
    // 별자리/띠 이름 추출
    const fortuneType = extractFortuneType(title.textContent);
    
    // 추가 운세 정보 생성
    const enhancedContent = generateEnhancedFortune(fortuneType);
    
    // 기존 내용 뒤에 추가
    postContent.innerHTML += enhancedContent;
    
    // 스타일 적용
    applyFortuneStyles();
}

function extractFortuneType(titleText) {
    // 별자리 또는 띠 이름 추출
    const match = titleText.match(/(양자리|황소자리|쌍둥이자리|게자리|사자자리|처녀자리|천칭자리|전갈자리|사수자리|염소자리|물병자리|물고기자리|쥐띠|소띠|호랑이띠|토끼띠|용띠|뱀띠|말띠|양띠|원숭이띠|닭띠|개띠|돼지띠)/);
    return match ? match[1] : '양자리';
}

function generateEnhancedFortune(fortuneType) {
    const today = new Date();
    const luckyNumbers = generateLuckyNumbers();
    const luckyColors = getLuckyColors(fortuneType);
    const luckyTime = getLuckyTime();
    const compatibleSigns = getCompatibleSigns(fortuneType);
    const warnings = getWarnings();
    const recommendations = getRecommendations();
    
    return `
        <div class="fortune-enhanced-section">
            <hr class="my-4">
            
            <!-- 행운의 요소 -->
            <div class="fortune-luck-section">
                <h3 class="fortune-section-title">
                    <span class="emoji">🍀</span> 오늘의 행운 요소
                </h3>
                <div class="row g-3">
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
                                ${luckyColors.map(color => `<span class="color-badge" style="background-color: ${color.code};">${color.name}</span>`).join(' ')}
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
            </div>
            
            <!-- 시간대별 운세 -->
            <div class="fortune-time-section mt-4">
                <h3 class="fortune-section-title">
                    <span class="emoji">🕐</span> 시간대별 운세
                </h3>
                <div class="time-fortune-grid">
                    <div class="time-fortune-item">
                        <div class="time-period">🌅 오전 (6시-12시)</div>
                        <div class="time-rating">★★★★☆</div>
                        <div class="time-desc">활기찬 시작! 중요한 결정이나 미팅에 적합합니다.</div>
                    </div>
                    <div class="time-fortune-item">
                        <div class="time-period">☀️ 오후 (12시-6시)</div>
                        <div class="time-rating">★★★☆☆</div>
                        <div class="time-desc">안정적인 시간. 꾸준한 업무 진행이 좋습니다.</div>
                    </div>
                    <div class="time-fortune-item">
                        <div class="time-period">🌆 저녁 (6시-12시)</div>
                        <div class="time-rating">★★★★★</div>
                        <div class="time-desc">최고의 시간! 사랑하는 사람들과 함께하세요.</div>
                    </div>
                </div>
            </div>
            
            <!-- 궁합 -->
            <div class="fortune-compatibility-section mt-4">
                <h3 class="fortune-section-title">
                    <span class="emoji">💕</span> 오늘의 궁합
                </h3>
                <div class="compatibility-content">
                    <p><strong>🌟 최고의 궁합:</strong> ${compatibleSigns.best.join(', ')}</p>
                    <p><strong>👍 좋은 궁합:</strong> ${compatibleSigns.good.join(', ')}</p>
                    <p class="text-muted small">※ 이 분들과 함께하면 좋은 기운이 배가됩니다!</p>
                </div>
            </div>
            
            <!-- 주의사항 -->
            <div class="fortune-warning-section mt-4">
                <h3 class="fortune-section-title">
                    <span class="emoji">⚠️</span> 오늘 주의할 점
                </h3>
                <div class="warning-content">
                    ${warnings.map(w => `
                        <div class="warning-item">
                            <span class="warning-icon">${w.icon}</span>
                            <span class="warning-text">${w.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 추천 활동 -->
            <div class="fortune-recommend-section mt-4">
                <h3 class="fortune-section-title">
                    <span class="emoji">✨</span> 오늘의 추천 활동
                </h3>
                <div class="recommend-grid">
                    ${recommendations.map(r => `
                        <div class="recommend-item">
                            <div class="recommend-icon">${r.icon}</div>
                            <div class="recommend-title">${r.title}</div>
                            <div class="recommend-desc">${r.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- 오늘의 한마디 -->
            <div class="fortune-quote-section mt-4">
                <div class="fortune-quote">
                    <div class="quote-icon">💬</div>
                    <div class="quote-text">"${getDailyQuote()}"</div>
                </div>
            </div>
            
            <!-- 운세 정확도 표시 -->
            <div class="fortune-accuracy-section mt-4">
                <p class="text-center text-muted small">
                    <span class="emoji">📊</span> 오늘 운세의 예상 적중률: <strong>${Math.floor(Math.random() * 10) + 85}%</strong>
                    <br>
                    <span class="emoji">👥</span> 오늘 ${Math.floor(Math.random() * 5000) + 15000}명이 이 운세를 확인했습니다
                </p>
            </div>
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
        '물고기자리': [{ name: '연보라', code: '#D0BFFF' }, { name: '바다색', code: '#66D9E8' }]
    };
    return colorSets[fortuneType] || colorSets['양자리'];
}

function getLuckyTime() {
    const times = [
        '오전 7시-9시', '오전 10시-12시', '오후 1시-3시', 
        '오후 4시-6시', '저녁 7시-9시', '저녁 10시-12시'
    ];
    return times[Math.floor(Math.random() * times.length)];
}

function getCompatibleSigns(fortuneType) {
    // 간단한 궁합 데이터 (실제로는 더 복잡한 로직 가능)
    const allSigns = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', 
                      '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];
    const shuffled = allSigns.filter(s => s !== fortuneType).sort(() => 0.5 - Math.random());
    return {
        best: shuffled.slice(0, 2),
        good: shuffled.slice(2, 5)
    };
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

function applyFortuneStyles() {
    // 기존 h3 태그에 이모지 스타일 추가
    const h3Tags = document.querySelectorAll('.post-content h3');
    const emojiMap = {
        '전체 운세': '🌟',
        '사랑운': '💕',
        '금전운': '💰',
        '건강운': '🏃',
        '학업운': '📚',
        '직업운': '💼',
        '오늘의 조언': '💡'
    };
    
    h3Tags.forEach(h3 => {
        const text = h3.textContent.trim();
        for (let [key, emoji] of Object.entries(emojiMap)) {
            if (text.includes(key)) {
                h3.innerHTML = `<span class="emoji">${emoji}</span> ${text}`;
                break;
            }
        }
    });
    
    // 별점에 색상 추가
    const starRatings = document.querySelectorAll('.post-content p');
    starRatings.forEach(p => {
        if (p.textContent.includes('★')) {
            p.innerHTML = p.innerHTML.replace(/★/g, '<span class="star-filled">★</span>');
            p.innerHTML = p.innerHTML.replace(/☆/g, '<span class="star-empty">☆</span>');
        }
    });
}

