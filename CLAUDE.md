# CLAUDE.md

## Project
Cross-platform repository where people share, discover, and test AI assistant configs (Claude Projects, Custom GPTs, Gemini Gems). Browse and copy recipes for free, test them against real models with a paid subscription.

## Stack
Next.js 15 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL (Neon), Auth.js v5, Stripe, deployed to Vercel.

## Key Conventions
* Path alias: `@/` -> `src/`
* Server components by default, client components only when needed
* AI test requests go through server-side API routes -- never expose API keys to client
* Drizzle schema in `src/db/schema/`, one file per table

## Commands
```bash
npm run dev
npm run build
npm run typecheck
npm run db:push
npm run db:studio
```

## Branching
* Every new feature -> `feature/[name]` branch
* Write descriptive commit messages summarizing what changed and why
* Always work on a feature branch, never directly on main. Before making any changes, check the current branch with git branch. If on main, create and switch to a new branch with git checkout -b feature/[name] before proceeding.
* dev is the primary working branch. Feature branches merge into dev, not main. Only dev merges into main when ready to deploy. Never push directly to main.

## Session Protocol
Start of every session: Read all files in `.claude/docs/` and summarize the current state of the project before doing anything else.

End of every feature:
1. Run `find src -type f | sort` to get the current file tree
2. Update `.claude/docs/built.md` with what was built, files changed, and the refreshed file tree formatted as an indented tree
3. Update `.claude/docs/data-model.md` if any tables, fields, or indexes changed
4. Commit the doc updates along with the feature commit

## Additional Docs
Before starting any task, check if relevant docs exist in `.claude/docs/`. Read them before proceeding -- do not assume.

## Environment Variables
Never log, echo, or commit env values. Expected vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`