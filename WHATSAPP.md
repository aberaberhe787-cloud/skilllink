# WhatsApp job notifications

SkillLink sends WhatsApp messages on key job events using the **Meta WhatsApp Cloud API**.

## Events

| Event | Who receives |
|--------|----------------|
| `job_requested` | Technician |
| `job_accepted` | Customer |
| `job_in_progress` | Customer |
| `job_completed` | Customer |
| `payment_held` | Both |
| `payment_released` | Customer |
| `dispute_opened` | Both |

## Setup

1. Create a Meta Developer app with WhatsApp.
2. Copy Phone number ID and permanent access token.
3. Vercel env:

```
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_API_VERSION=v21.0
```

4. Users need `phone` on profile (`+254…`).

## Without credentials

**Dev mode**: notifications are logged on the server; APIs still succeed.

## Test

Sign in → `/notifications` → enter number → Send test.

Or `POST /api/notifications/whatsapp` with `{ "phone": "+2547...", "event": "job_requested" }`.

## Production

Outside the 24h window, Meta requires approved **message templates**. Map each event to a template for scale. Store opt-in consent before messaging.
