# 하루기록

시간, 글, 기분, 날씨, 장소, 태그를 함께 남기는 일상 블로그예요.

- 사이트: https://haru-log-lovat.vercel.app
- 화면: 타임라인, 캘린더, 글 상세, 태그별 모아보기, 글쓰기(주인만)
- AI 글쓰기: 메모를 적고 "✨ AI로 글 완성하기"를 누르면 OpenRouter(Claude)가 블로그 글로 풀어 써 줘요.

- 기술 스택: Next.js 16, TypeScript, Tailwind CSS, Firebase(Auth, Firestore), OpenRouter, Vercel
- 개발계획서: [docs/개발계획서.md](docs/개발계획서.md)

## 로컬 실행

```bash
npm install
vercel env pull .env.local   # Firebase 설정값 받기
npm run dev
```

http://localhost:3000 에서 확인해요.
