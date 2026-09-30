# SkillLink – On-demand Technical Skills Marketplace

Full MVP with authentication, database, payments escrow (10% commission), AI matching, admin verification, training, and reviews.

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Demo accounts (after seed)

| Role     | Email                     | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@skilllink.local     | admin123     |
| Seeker   | seeker@skilllink.local    | seeker123    |
| Provider | james@skilllink.local     | provider123  |

## Features

- Signup + password hashing (bcrypt)
- Admin verification panel
- Request Job + escrow payment (10% fee)
- AI matching search
- Provider dashboard + training module
- Google / LinkedIn / Email auth (Auth.js)

## Tech

Next.js 16, Prisma, Auth.js, Tailwind CSS, TypeScript

## Switch to PostgreSQL

1. Change `provider = "postgresql"` in `prisma/schema.prisma`
2. Set `DATABASE_URL` to your Postgres connection string
3. Run `npx prisma db push`
