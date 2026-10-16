# Budget Template

Next.js app on Vercel. Supabase handles sign-in and storage. A Gumroad webhook controls who has access.

## Go-live checklist

1. **Database.** Supabase > SQL Editor > paste `supabase/schema.sql` > Run.
2. **Sign-in links.** Supabase > Authentication > URL Configuration. Set Site URL to your Vercel URL. Add the same URL under Redirect URLs.
3. **Vercel env vars** (Project > Settings > Environment Variables), then redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API Keys, the secret key; never share it)
   - `GUMROAD_WEBHOOK_SECRET`: any long random string you make up
   - optional: `GUMROAD_PRODUCT_ID`, `NEXT_PUBLIC_SITE_URL`
4. **Gumroad.** Settings > Advanced > Ping: `https://YOUR-SITE/api/gumroad/YOUR_SECRET`. Use Gumroad's "Send test ping".
5. **Testers.** SQL Editor: `insert into public.purchasers (email) values ('tester@example.com') on conflict (email) do update set active = true;`

## How access works
- The sign-in form asks the server to email a link only if the address is on `purchasers` and active. The reply looks the same either way.
- Database rules also check the list, so a direct call to Supabase by a non-purchaser sees nothing.
- A Gumroad refund or chargeback ping sets `active = false`.

## Known limits (beta)
- Each user's whole budget is one JSON document. Two devices open at once: the last save wins.
- Supabase's built-in email sender allows only a few messages per hour. Connect an SMTP sender (e.g. Resend) before launch.
