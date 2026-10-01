# Telebirr sandbox (SkillLink Ethiopia)

## Env

```
TELEBIRR_ENV=sandbox
TELEBIRR_APP_ID=
TELEBIRR_APP_KEY=
TELEBIRR_SHORT_CODE=
TELEBIRR_PUBLIC_KEY=
TELEBIRR_FABRIC_APP_ID=
TELEBIRR_PRIVATE_KEY=
TELEBIRR_NOTIFY_URL=https://YOUR_DOMAIN/api/webhooks/telebirr
TELEBIRR_RETURN_URL=https://YOUR_DOMAIN/jobs
ALLOW_DEMO_PAYMENTS=false
```

Sandbox credentials: Ethio telecom / Telebirr developer portal.

## Flow

1. Accept & pay → createPayment → createTelebirrOrder
2. User opens checkoutUrl (toPayUrl)
3. Notify webhook → payment held
4. Confirm complete → 90% to wallet

Without credentials, demo instructions only (local/UAT).
