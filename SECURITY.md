# SkillLink – Security (Round 1)

## Hardened in this pass

1. **Input sanitization** (`src/lib/security.ts`)
2. **Authorization (IDOR)** – jobs, payments, disputes
3. **Rate limiting** – signup, community, WhatsApp, disputes, jobs
4. **HTTP security headers** – CSP, frame deny, nosniff, HSTS
5. **Safer API errors** – no internal messages in production
6. **Stronger passwords** – min 8 + letter + number

## Still TODO (Round 2+)

- Redis/Upstash rate limits
- Stricter CSP
- Admin audit log
- File upload allowlist + scan
- Payment webhook signature verify
- `npm audit` in CI
