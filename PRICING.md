# SkillLink pricing: quotes + bonus

## Rules

| Type | Who sets | Cap | Platform fee |
|------|----------|-----|--------------|
| Job quote | Technician | ≤ category max (SkillLink threshold) | **10%** |
| Bonus | Customer | KES 50–100,000 | **5%** |

## APIs

- `GET /api/categories/caps` — min/max per skill
- `POST /api/jobs/:id/quote` — `{ quotedPrice, quoteNote? }`
- `POST /api/jobs/:id/bonus` — `{ amountKes }`
- `POST /api/tips` — same 5% fee as bonus

## Schema

- `CategoryPriceCap` — category, maxKes, minKes
- `Job.quotedPrice`, `quoteNote`, `quotedAt`, `budgetMax`
- `Tip.platformFeeKes`, `providerAmount`

## After deploy

```bash
npx prisma db push
npx prisma db seed
```

## UI

- `/pricing` — thresholds table
- `QuoteBonusPanel` — quote (provider) + bonus (customer)
