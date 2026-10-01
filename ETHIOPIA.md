# SkillLink Ethiopia

## Payments (v1)
- **Telebirr** and **M-Pesa Ethiopia** only
- Currency: **ETB**
- Job fee: **10%** platform · Bonus: **5%**

## Job flow
1. Customer requests job → technician quotes (≤ category max)
2. Customer accepts → Telebirr / M-Pesa → payment **held**
3. Tech starts → completes
4. Customer confirms → **90% released** to technician wallet
5. Optional review + bonus + photos

## Pages
- `/jobs` — customer job list
- `/inbox` — technician inbox
- `/jobs/[id]` — full lifecycle
- `/pricing` — ETB thresholds
- `/search` — Find help + Near me (GPS)

## Env
`TELEBIRR_*` and `MPESA_*` — see `.env.example`

```bash
npx prisma db push
```
