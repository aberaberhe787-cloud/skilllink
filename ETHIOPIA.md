# SkillLink Ethiopia

## Payments (v1)
- **Telebirr** (primary)
- **M-Pesa** (secondary)
- Currency: **ETB**
- Job fee: **10%** platform · Bonus: **5%**

## Job lifecycle
1. Customer requests job → technician **quotes** (≤ category max)
2. Customer **Accept & pay** (Telebirr or M-Pesa) → payment **held**
3. Tech works → marks complete / customer confirms
4. **90% released** to technician wallet
5. Optional **review** + **before/after photos** + **bonus**

## UI routes
| Route | Who |
|-------|-----|
| `/jobs` | Customer – My jobs |
| `/inbox` | Technician – Job inbox |
| `/jobs/[id]` | Shared job detail (quote, pay, complete, review, photos) |
| `/search` | Near me + cities (Addis, Adama, Bahir Dar, …) |
| `/pricing` | Category max prices in ETB |

## Env (production)
```
TELEBIRR_APP_ID=
TELEBIRR_APP_KEY=
TELEBIRR_SHORT_CODE=
TELEBIRR_PUBLIC_KEY=
TELEBIRR_NOTIFY_URL=

MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
MPESA_CALLBACK_URL=
```

Without credentials, payments run in **demo mode**.

## After deploy
```bash
npx prisma db push
npm run db:seed
```
