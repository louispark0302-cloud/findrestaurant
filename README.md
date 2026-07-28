# Mood Food Finder (기분 맞춤 맛집 탐색기)

사용자의 현재 위치와 기분을 입력받아 맞춤형 맛집 스타일을 추천해주는 웹 애플리케이션입니다.

## 📁 프로젝트 구조

```
├── api/
│   └── generate.js      # Gemini API 호출 서버리스 함수
├── public/
│   └── index.html       # React 기반 프론트엔드 UI
├── package.json         # 의존성 설정
└── vercel.json          # Vercel 배포 설정
```

## 🚀 배포 방법 (Vercel)

1. GitHub 저장소에 코드 업로드
2. Vercel(https://vercel.com) 로그인 후 `Import Project`
3. **Environment Variables** 설정:
   - Key: `GEMINI_API_KEY`
   - Value: 발급받은 Google Gemini API 키
4. 배포 진행
