This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local WebSocket development

Run the Next.js app and WebSocket server in separate terminals:

```bash
pnpm dev
pnpm dev:ws
```

The local environment should set `NEXT_PUBLIC_WS_URL="ws://localhost:3001"` and
`WS_PORT=3001`. In an open conversation, the header shows `Live` when the
authenticated WebSocket connection is ready. Direct and group conversations
deliver new messages, show typing indicators, and display presence for members
currently connected to that conversation.

## Messaging features

Apply database changes before starting the app:

```bash
pnpm exec prisma migrate deploy
```

Chats include unread counts, message editing, history search, pinned messages,
and `@username` mentions. Friend requests, mentions, and call invitations
appear in the in-app Alerts page. Use a message's context menu to edit or pin it.

Direct voice and video calls are available between friends; group calls use
peer-to-peer WebRTC mesh and support up to six participants. Browsers must allow
microphone/camera access. STUN is configured by default; networks that block
direct connections may require a TURN service.
Set the server-only `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` values
from `.env.example` when one is available.
