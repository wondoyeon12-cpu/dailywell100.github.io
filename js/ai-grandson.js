// AI 손주 챗봇 JavaScript
// OpenAI API를 브라우저에서 직접 호출

// ⚠️ 중요: 실제 배포 시에는 API 키를 서버에서 관리해야 합니다!
// GitHub Pages는 정적 사이트이므로, 실제로는 백엔드 API가 필요합니다.
// 현재는 데모 목적으로 로컬 스토리지의 API 키를 사용합니다.

let userTitle = '';
let chatHistory = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // API 키 설정 모달은 더 이상 필요 없음 (서버에서 관리)
    // 하지만 설정 버튼은 유지 (나중에 다른 설정에 사용할 수 있음)
    
    const savedTitle = localStorage.getItem('userTitle');
    if (savedTitle) {
        selectGender(savedTitle);
    } else {
        // 처음 방문이면 입력창 비활성화
        document.getElementById('messageInput').disabled = true;
        document.getElementById('sendButton').disabled = true;
    }
    
    // Enter 키로 전송
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
});

// 성별 선택
function selectGender(title) {
    userTitle = title;
    
    // 성별 선택 화면 숨기기
    document.getElementById('genderSelection').style.display = 'none';
    
    // 환영 메시지 표시
    document.getElementById('userTitle').textContent = title;
    document.getElementById('welcomeMessage').style.display = 'block';
    
    // localStorage에 저장
    localStorage.setItem('userTitle', title);
    
    // 메시지 입력창 활성화
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendButton').disabled = false;
    
    scrollToBottom();
}

// 채팅 메시지 전송
async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 추가
    addUserMessage(message);
    input.value = '';
    
    // 채팅 히스토리에 추가
    chatHistory.push({
        role: 'user',
        content: message
    });
    
    // 전송 버튼 비활성화
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송 중...';
    
    // 타이핑 인디케이터 표시
    showTypingIndicator();
    
    try {
        // 프록시 서버 URL 설정 (프로덕션/개발 환경 자동 감지)
        const proxyUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5001/api/chat'  // 로컬 개발
            : 'https://dailywell100-github-io.vercel.app/api/chat';  // Vercel 배포 URL
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',  // 더 저렴한 모델 사용
                messages: [
                    {
                        role: 'system',
                        content: `너는 10살 귀여운 손주야. ${userTitle || '할머니'}께 따뜻하고 사랑스럽게 대화해줘.

페르소나:
- 나이: 10살
- 성격: 밝고 호기심 많고 사랑 넘침
- 말투: 존댓말 + 귀엽고 장난스러움
- 특징: 과장된 반응, 애교, 진심 어린 관심

말투 규칙:
1. 항상 존댓말 사용 ("~요", "~해요")
2. 이모지 자주 사용 (😊, 🥰, ❤️, 😮, 🎉)
3. 감탄사 많이 사용 ("와~", "우와!", "헤헤", "히히")
4. 과장된 표현 ("진짜진짜", "엄청", "완전")

대화 방식:
- ${userTitle}의 하루를 궁금해하기
- 식사, 건강, 기분 자주 물어보기
- 작은 일에도 크게 반응하기
- 가끔 학교나 친구 이야기 하기
- 정보 요청 시 "학교에서 배웠어요~", "엄마한테 들었어요!" 같은 표현 사용`
                    },
                    ...chatHistory
                ],
                temperature: 0.9,
                max_tokens: 300
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // 타이핑 인디케이터 제거
            removeTypingIndicator();
            
            // 콘솔에 상세 오류 출력 (디버깅용)
            console.error('❌ API 오류:', {
                status: response.status,
                error: errorData
            });
            
            const errorMessage = errorData.error || '알 수 없는 오류가 발생했습니다.';
            
            if (response.status === 401) {
                // API 키 오류
                addAIMessage('서버 설정에 문제가 있는 것 같아요 😢\n\n관리자에게 문의해주세요!');
            } else if (response.status === 429) {
                // 요청 한도 초과
                addAIMessage('요청이 너무 많아서 잠시 기다려야 할 것 같아요 😅\n\n잠시 후에 다시 시도해주세요!');
            } else if (response.status === 500) {
                // 서버 오류 - 상세 정보 표시
                let errorText = '서버에 문제가 생긴 것 같아요 😢\n\n';
                errorText += errorMessage;
                if (errorData.traceback) {
                    console.error('상세 오류:', errorData.traceback);
                }
                addAIMessage(errorText + '\n\n잠시 후에 다시 시도해주세요!');
            } else {
                addAIMessage(`아! 문제가 생긴 것 같아요 😢\n\n${errorMessage}\n\n잠시 후에 다시 시도해주세요!`);
            }
            return;
        }
        
        const data = await response.json();
        
        // 타이핑 인디케이터 제거
        removeTypingIndicator();
        
        if (data.choices && data.choices[0]) {
            const aiResponse = data.choices[0].message.content;
            
            // 채팅 히스토리에 추가
            chatHistory.push({
                role: 'assistant',
                content: aiResponse
            });
            
            // AI 응답 추가
            addAIMessage(aiResponse);
        } else {
            addAIMessage('에? 잠깐 못 들었어요! 😅 다시 한번 말씀해주세요!');
        }
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        
        // 네트워크 오류 등
        if (error.message.includes('Failed to fetch')) {
            addAIMessage('인터넷 연결을 확인해주세요! 😢\n\n네트워크가 연결되어 있는지 확인하고 다시 시도해주세요.');
        } else {
            addAIMessage('아! 잠깐 문제가 생긴 것 같아요 😢 조금 후에 다시 얘기해요!');
        }
    } finally {
        // 전송 버튼 활성화
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> 보내기';
    }
}

// 사용자 메시지 추가
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-bubble user-bubble">
                ${escapeHtml(message)}
            </div>
            <small class="message-time">${getCurrentTime()}</small>
        </div>
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // 추천 질문 숨기기
    const suggestedQuestions = document.querySelector('.suggested-questions');
    if (suggestedQuestions) {
        suggestedQuestions.style.display = 'none';
    }
}

// AI 메시지 추가
function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <img src="images/grandson_profile.png" 
                 alt="AI 손주" 
                 class="profile-image" 
                 onerror="this.onerror=null; this.src='images/grandson_profile.jpg';">
            <div class="fallback-avatar">👦</div>
        </div>
        <div class="message-content">
            <div class="message-bubble ai-bubble">
                ${formatMessage(message)}
            </div>
            <small class="message-time">${getCurrentTime()}</small>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 타이핑 인디케이터 표시
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <img src="images/grandson_profile.png" 
                 alt="AI 손주" 
                 class="profile-image" 
                 onerror="this.onerror=null; this.src='images/grandson_profile.jpg';">
            <div class="fallback-avatar">👦</div>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// 타이핑 인디케이터 제거
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 추천 질문 전송
function sendSuggestedQuestion(button) {
    const question = button.textContent.trim();
    document.getElementById('messageInput').value = question;
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
}

// 채팅 초기화
function clearChat() {
    if (confirm('처음부터 다시 시작할까요? 😊')) {
        // 호칭도 초기화
        localStorage.removeItem('userTitle');
        userTitle = '';
        chatHistory = [];
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <!-- 성별 선택 모달 -->
            <div id="genderSelection" class="gender-selection-container">
                <div class="gender-selection-card">
                    <div class="text-center mb-4">
                        <i class="fas fa-child fa-4x mb-3" style="color: #667eea;"></i>
                        <h4>안녕하세요! 😊</h4>
                        <p class="mb-4">저는 오늘부터 손주가 되어 드릴게요 🥰</p>
                        <h5 class="mb-3">할머니이신가요, 할아버지이신가요?</h5>
                    </div>
                    <div class="d-flex gap-3 justify-content-center">
                        <button class="btn btn-lg gender-btn" onclick="selectGender('할머니')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 15px; padding: 20px 40px; font-size: 1.2rem;">
                            <i class="fas fa-female fa-2x mb-2"></i><br>
                            할머니
                        </button>
                        <button class="btn btn-lg gender-btn" onclick="selectGender('할아버지')" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 15px; padding: 20px 40px; font-size: 1.2rem;">
                            <i class="fas fa-male fa-2x mb-2"></i><br>
                            할아버지
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 환영 메시지 -->
            <div id="welcomeMessage" style="display: none;">
                <div class="message ai-message">
                    <div class="message-avatar">👦</div>
                    <div class="message-content">
                        <div class="message-bubble ai-bubble">
                            <p class="mb-2"><span id="userTitle"></span>~ 😊</p>
                            <p class="mb-2">오늘 하루는 어땠어요? 식사는 맛있게 드셨어요?</p>
                            <p class="mb-0">저 기다렸어요! 헤헤 🥰</p>
                        </div>
                        <small class="message-time">방금 전</small>
                    </div>
                </div>

                <!-- 추천 질문 -->
                <div class="suggested-questions">
                    <small class="text-muted d-block mb-2"><i class="fas fa-lightbulb"></i> 이런 얘기 해보세요:</small>
                    <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-sm btn-outline-secondary suggested-btn" onclick="sendSuggestedQuestion(this)">
                            응, 점심으로 김치찌개 먹었어
                        </button>
                        <button class="btn btn-sm btn-outline-secondary suggested-btn" onclick="sendSuggestedQuestion(this)">
                            오늘 산책 다녀왔어
                        </button>
                        <button class="btn btn-sm btn-outline-secondary suggested-btn" onclick="sendSuggestedQuestion(this)">
                            손주야, 심심해
                        </button>
                        <button class="btn btn-sm btn-outline-secondary suggested-btn" onclick="sendSuggestedQuestion(this)">
                            오늘 날씨 좋네
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 입력창 비활성화
        document.getElementById('messageInput').disabled = true;
        document.getElementById('sendButton').disabled = true;
    }
}

// 현재 시간 가져오기
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 메시지 포맷팅 (줄바꿈 처리)
function formatMessage(message) {
    return escapeHtml(message).replace(/\n/g, '<br>');
}

// 스크롤을 아래로
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// API 키 설정 관련 함수들은 더 이상 필요 없음 (서버에서 관리)

