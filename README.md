This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security Environment Variables

Set these variables before running MercadoPago flows:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
MP_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxx
PRELAUNCH_TOKEN_SECRET=replace_with_a_strong_random_secret
MP_EXCLUDE_ACCOUNT_MONEY=true
MP_USE_SANDBOX_INIT_POINT=false
```

- `NEXT_PUBLIC_APP_URL` is required in production for payment preference and callback URLs.
- `MP_WEBHOOK_SECRET` is required in production to validate MercadoPago webhook signatures.
- `PRELAUNCH_TOKEN_SECRET` signs pre-launch access cookies (required to unlock gated pages securely).
- Use test credentials for sandbox tests and a buyer account different from the account used to create the preference.
- `MP_EXCLUDE_ACCOUNT_MONEY=true` helps avoid sandbox wallet/account-money issues during test checkouts.
- Keep `MP_USE_SANDBOX_INIT_POINT=false` unless you explicitly need sandbox redirect URL.
- Do not hardcode credentials in scripts or route files.

## Prelaunch Control (Admin)

- Run migrations so `prelaunch_settings` and `get_prelaunch_public_settings()` are available.
- Open `/admin/prelaunch` to:
  - activate/deactivate lock mode,
  - configure launch date/time,
  - rotate the global password.
- While prelaunch is active, all pages are gated by password + countdown.
- When launch time is reached, the site opens automatically.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
