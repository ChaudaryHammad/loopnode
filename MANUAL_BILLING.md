# Manual billing & upgrade requests

LoopNode supports **manual plan upgrades** without Stripe. Users submit payment references; admins approve in `/admin/upgrade-requests`.

## User flow

1. **Billing** → `/dashboard/settings/billing`
2. **Request upgrade** → `/dashboard/settings/billing/upgrade`
3. Choose **Pro** or **Agency**, select payment method, pay externally, submit transaction ID
4. Track status on billing page; get **in-app + email** notifications

## Admin flow

1. **Admin → Upgrades** → `/admin/upgrade-requests`
2. Review payment reference and user note
3. **Approve** → activates plan, sets limits, notifies user
4. **Reject** → requires admin note, notifies user

Optional **custom website limit** on approval (overrides plan default).

## Payment methods (env)

Add to `.env.local`:

```env
PAYMENT_PAYONEER_EMAIL="you@payoneer.com"
PAYMENT_BANK_NAME="Your Bank"
PAYMENT_BANK_ACCOUNT="1234567890"
PAYMENT_BANK_IBAN="PK00XXXX..."
PAYMENT_EASYPAISA_NUMBER="03XXXXXXXXX"
PAYMENT_JAZZCASH_NUMBER="03XXXXXXXXX"
SUPPORT_EMAIL="billing@yourdomain.com"
```

Methods with configured values appear in the upgrade form.

## Website slot policy

| Question | Policy |
|----------|--------|
| Does a domain permanently consume a slot? | **Active websites** count toward the plan limit. Each unique hostname is tracked in `WebsiteDomainSlot`. |
| Do deleted websites count? | **No** for the active limit. Soft-deleted sites free a slot immediately. |
| Can users re-add the same domain? | **Once** — delete frees your slot immediately; the same hostname can be connected again one time. |
| Limit on reconnections? | **Two lifetime connections** per hostname per account (initial + one re-add). After that, contact support. |
| Track every domain ever added? | **Yes** — `WebsiteDomainSlot` per `(userId, normalizedHost)`. |
| Subdomains? | **Separate slots** — `app.example.com` and `example.com` are distinct (after stripping `www.`). |
| Abuse prevention | Lifetime hostname tracking + reconnect limit + server-side `getEntitlements()` on add website |

## Notifications

In-app notifications (bell in dashboard header) + email when SMTP is configured:

- Upgrade submitted
- Upgrade approved / rejected
- Website limits increased
