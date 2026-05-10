# 다이어리 (Diary)

이 프로젝트는 [Next.js](https://nextjs.org)를 기반으로 만들어졌으며, [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)을 사용하여 초기화되었습니다.

## 시작하기 (Getting Started)

먼저, 개발 서버를 실행하세요:

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
# 또는
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

`app/page.tsx` 파일을 수정하여 페이지 편집을 시작할 수 있습니다. 파일을 수정하면 페이지가 자동으로 업데이트됩니다.

이 프로젝트는 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)를 사용하여 Vercel의 새로운 글꼴 제품군인 [Geist](https://vercel.com/font)를 자동으로 최적화하고 로드합니다.

## 도커로 실행하기 (Run with Docker)

이 프로젝트는 Docker를 지원합니다. 다음 명령어로 실행할 수 있습니다:

```bash
docker-compose up -d --build
```