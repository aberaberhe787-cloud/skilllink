# SkillLink – Security

## Round 1
- Input sanitization (`src/lib/security.ts`)
- IDOR checks on jobs, payments, disputes
- In-memory rate limits
- Security headers + basic CSP
- Stronger passwords (8+ letter + number)
- Safe production error messages

## Round 2
- **Upstash rate limits** via `rateLimitAsync()` when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set (falls back to memory)
- **Admin audit log** (`AuditLog` model, `writeAuditLog`, `/api/admin/audit`, verification actions logged)
- **Flutterwave webhook signature** (`/api/webhooks/flutterwave` + `FLW_SECRET_HASH`)
- **Upload policy API** (`/api/uploads/validate` — MIME/size allowlist)
- **CI** `.github/workflows/security.yml` — npm audit on push/PR/weekly
- **Headers** COOP/CORP, object-src none, tighter connect-src

## Env

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FLW_SECRET_HASH=
AUTH_SECRET=
DATABASE_URL=
```

```bash
npx prisma db push
```

## Round 3 (future)
- Nonce-based CSP
- Malware scan on uploads
- M-Pesa webhook signature
- Session anomaly alerts
