# SkillLink – Growth & Community Features

## Implemented in product

### Trust & safety
- Manual + admin verification queue (`/admin/verification`)
- Escrow payments with 10% platform fee
- Safety guidelines page (`/safety`)
- Dispute centre (`/disputes`) + API
- Job status includes `disputed`

### Community
- Neighborhood community feed (`/community`)
- Tips / questions / general posts + API
- Technician leaderboard (`/leaderboard`)
- Follow technician API (`/api/follow`)

### Growth & liquidity
- Referral codes + invite page (`/referrals`)
- Technician / user wallet (`/wallet`) with M-Pesa payout CTA
- Tips API (`/api/tips`)
- Business accounts & plans page (`/business`)
- Recurring job model (schema ready)
- Job photos model (schema ready)

### Core marketplace (existing)
- AI matching search
- Provider profiles + portfolio + availability calendar
- Training courses & badges
- Auth: email, Google, LinkedIn (when configured)

## Schema models added
Referral, Wallet, WalletTransaction, JobPhoto, Dispute, DisputeMessage,
Follow, CommunityPost, CommunityReply, Tip, RecurringJob, BusinessAccount

## After deploy
```bash
npx prisma db push
npm run db:seed
```

## Production next steps
1. Wire real M-Pesa Daraja STK push
2. File upload for job before/after photos
3. WhatsApp Business notifications
4. Recurring job cron
5. Featured profile payments
