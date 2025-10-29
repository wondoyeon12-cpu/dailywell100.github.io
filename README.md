# 데일리웰100 (DailyWell100)

> 건강한 100세를 위한 시니어 웹사이트

## 🌟 프로젝트 소개

**데일리웰100**은 시니어를 위한 건강 정보, 운세, AI 손주 채팅 서비스를 제공하는 웹사이트입니다.

### 주요 기능

- 🤖 **AI 손주 채팅**: 24시간 따뜻한 대화 상대
- ❤️ **건강상식**: 매일 업데이트되는 건강 정보
- ⭐ **오늘의 운세**: 매일 새로운 운세

## 🚀 배포 방법

### GitHub Pages 배포

1. GitHub에서 새 저장소 생성
2. 모든 파일 업로드
3. Settings → Pages → Source를 `main` 브랜치로 설정
4. Custom domain에 `dailywell100.com` 입력

### 도메인 연결

DNS 설정 (가비아 또는 다른 도메인 제공업체):

```
A 레코드:
호스트: @
값: 185.199.108.153
값: 185.199.109.153
값: 185.199.110.153
값: 185.199.111.153

CNAME 레코드:
호스트: www
값: [your-github-username].github.io
```

## 🔧 OpenAI API 설정

AI 손주 채팅을 사용하려면 OpenAI API 키가 필요합니다.

### 브라우저 콘솔에서 설정:

```javascript
localStorage.setItem('openai_api_key', 'your-api-key-here');
```

⚠️ **보안 경고**: 실제 배포 시에는 백엔드 서버에서 API 키를 관리해야 합니다!

## 📁 프로젝트 구조

```
dailywell100_static/
├── index.html              # 메인 페이지
├── ai-grandson.html        # AI 손주 채팅 페이지
├── health.html             # 건강상식 페이지 (예정)
├── fortune.html            # 운세 페이지 (예정)
├── css/
│   └── style.css           # 스타일시트
├── js/
│   └── ai-grandson.js      # AI 챗봇 로직
├── CNAME                   # 커스텀 도메인
└── README.md               # 이 파일
```

## 🎨 기술 스택

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (ES6+)
- OpenAI GPT-4 API
- GitHub Pages

## 📱 반응형 디자인

모든 페이지는 데스크톱, 태블릿, 모바일에서 최적화되어 있습니다.

## 📄 라이선스

© 2025 데일리웰100. All rights reserved.

## 👨‍💻 개발자

이 프로젝트는 시니어의 건강한 100세를 위해 만들어졌습니다.

---

**문의**: [문의 페이지로 이동](#)

\nRebuild: 10/29/2025 16:44:27
