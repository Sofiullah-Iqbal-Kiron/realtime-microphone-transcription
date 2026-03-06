# Frontend

Next.js 16 frontend with TypeScript, Tailwind CSS, and Shadcn/ui.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables

| Variable                   | Default                 | Description           |
| -------------------------- | ----------------------- | --------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API URL       |
| `NEXT_PUBLIC_WS_BASE_URL`  | `ws://127.0.0.1:8000`   | Backend WebSocket URL |
