@AGENTS.md

# 하루기록 (haru-log) — 작업 이어가기 안내

시간, 글, 기분, 날씨, 장소, 태그를 남기는 일상 블로그. 계획과 진행 이력은 `docs/개발계획서.md`에 있어요.

## 주소와 계정

| 항목 | 값 |
|---|---|
| 사이트 | https://haru-log-lovat.vercel.app (`haru-log.vercel.app`은 다른 사람 것) |
| GitHub | https://github.com/PARKENOK/haru-log (public, `main` 브랜치) |
| Vercel | 팀 `e-nok`, 프로젝트 `haru-log`, 로그인 계정 dpshr2000 |
| Firebase | 프로젝트 `haru-log-10080943` (Spark 무료 플랜, 결제 계정 없음) |
| 글쓰기 권한 계정 | dpshr2000@gmail.com |

## 배포 방법

- `main`에 push하면 Vercel이 자동으로 Production 배포해요. 따로 `vercel deploy`할 필요 없어요.
- Firestore 보안 규칙을 바꿨다면 **코드 push 전에** `firebase deploy --only firestore:rules` 먼저 실행해요. 새 필드를 쓰는 코드가 옛 규칙에 막히지 않도록요.
- 배포 확인: `vercel ls`

## 구조

- `src/lib/firebase.ts` — Firebase 초기화, `OWNER_EMAIL`
- `src/lib/posts.ts` — Firestore `posts` 읽기/쓰기 (목록, 월별, 태그별, 단건, 생성/수정/삭제)
- `src/lib/meta.ts` — 기분 이모지, 날씨 종류, 태그 파싱
- `src/components/` — 화면 컴포넌트. 데이터는 모두 브라우저(클라이언트)에서 Firestore로 직접 읽어요.
- `firestore.rules` — 읽기는 누구나, 쓰기는 주인 이메일만, 필드 검증

## 바꿀 때 주의할 점

- **필드 추가 시**: `posts.ts`의 `Post` 타입, `toPost`(옛 글 기본값), `toFields`와 `firestore.rules`의 `hasOnly` 목록과 검증을 함께 고쳐요.
- **주인 이메일 변경 시**: `src/lib/firebase.ts`의 `OWNER_EMAIL`과 `firestore.rules`의 이메일을 둘 다 바꿔요.
- **Next.js 16 + `cacheComponents: true`**: 동적 경로(`[id]`, `[tag]`)는 `params`를 쓰는 부분을 `<Suspense>`로 감싸야 빌드돼요. 헤더도 같은 이유로 layout에서 Suspense로 감싸져 있어요.
- **오늘 날짜**: 정적 빌드 시점과 달라지므로 브라우저에서만 계산해요 (`MonthCalendar`의 `useSyncExternalStore` 참고).
- **복합 색인 피하기**: 태그 조회는 `array-contains`만 쓰고 정렬은 클라이언트에서 해요.
- 커밋 전에 `npm run lint && npm run build`로 확인해요.

## 환경변수

- `.env.local`은 git에 없어요. 새 PC에서는 `vercel link` 후 `vercel env pull .env.local`로 받아요.
- Vercel에는 `NEXT_PUBLIC_FIREBASE_*` 6개가 Production/Preview/Development에 등록되어 있어요. Firebase 웹 API 키는 원래 공개되는 값이라 `--type config`로 등록했어요.
- `vercel link`는 `.env.local`에 `VERCEL_OIDC_TOKEN`을 추가해요. 이 파일을 통째로 Vercel 환경변수로 올리지 마세요.

## 개발 환경 (WSL)

- CLI는 `~/.local/bin`에 설치: `gh`, `firebase`, `vercel`
- Firebase 로그인은 `firebase login --no-localhost` (링크 열고 나온 코드를 `firebase login <코드>`로 입력)
- 로그인 허용 도메인(Firebase Auth authorized domains)에 `haru-log-lovat.vercel.app`, `haru-log-e-nok.vercel.app`가 등록돼 있어요. 도메인을 바꾸면 여기에도 추가해야 Google 로그인이 돼요.

## 보류한 것

- **사진 업로드 / 갤러리**: Firebase Storage는 Blaze(결제 계정) 플랜이 필요해서 보류했어요. 다시 하려면 Blaze 업그레이드 또는 Cloudinary 같은 무료 서비스를 써야 해요.
