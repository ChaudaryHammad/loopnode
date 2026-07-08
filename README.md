# LoopNode

Website health monitoring for developers and agencies — performance, accessibility, SEO, security, and broken links in one dashboard.

## Docs

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — system design, deploy, env vars, audit pipeline
- **[PROGRESS.md](./PROGRESS.md)** — module status and what’s left to build

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in values
npx prisma generate && npx prisma db push
npm run dev
```

With Trigger.dev (audits in cloud):

```bash
npm run dev:trigger   # second terminal
```

## Stack

Next.js 16 · TypeScript · Prisma · PostgreSQL · Auth.js · Trigger.dev · Lighthouse · axe-core · Cloudinary
