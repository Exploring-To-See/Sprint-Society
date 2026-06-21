# Sprint Society — Browser-Only Setup Guide

> **Deployment moved to Vercel + Supabase.** This project no longer uses Railway.
> Deploy entirely from the browser via the Vercel dashboard — see the canonical
> runbook in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

Short version:

1. Push the repo to GitHub (or import it directly).
2. In [vercel.com](https://vercel.com) → **Add New → Project**, import the repo.
   Keep the Root Directory at the repo root.
3. Create a [Supabase](https://supabase.com) project; copy its **transaction
   pooler** connection string into `DATABASE_URL`.
4. Add the environment variables from [.env.example](.env.example) in Vercel →
   Settings → Environment Variables.
5. Deploy, test on the `*.vercel.app` URL, then attach your custom domain in
   Vercel → Domains.

Full step-by-step (env vars, Supabase migrate, custom-domain cutover):
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
