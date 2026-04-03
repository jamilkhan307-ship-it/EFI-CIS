# Going Live: CIS Portal (MVP) on Cloudflare Pages

This document outlines the final architecture and specific instructions for going live with the CIS Portal on Cloudflare Pages.

## 1. Final Architecture
The CIS Portal follows a modern, enterprise-grade serverless architecture:

- **Frontend**: Single Page Application (SPA) built with **React**, **TypeScript**, and **Vite**.
- **Hosting**: **Cloudflare Pages** (provides automated CI/CD and globally distributed edge hosting).
- **Backend-as-a-Service**: **Supabase** (PostgreSQL for data, Supabase Auth for identity management).
- **Security**: **Row Level Security (RLS)** in PostgreSQL ensures that data is only accessible to authorized users.
- **Routing**: Handled client-side via `react-router`, with server-side redirects configured in `public/_redirects`.

---

## 2. Going Live Instructions (Cloudflare Pages)

Follow these steps to deploy the project to production:

### Step 1: Push Your Code
Ensure all changes (including the `_redirects` file and `src/pages/cir/CirDetail.tsx` fix) are pushed to your GitHub or GitLab repository.

```bash
git add .
git commit -m "chore: setup Cloudflare Pages deployment configuration"
git push origin main
```

### Step 2: Create a Cloudflare Pages Project
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **"Workers & Pages"** > **"Create application"** > **"Pages"**.
3. Select **"Connect to Git"** and choose the `cir-portal` repository.

### Step 3: Configure Build Settings
Cloudflare should automatically detect the Vite setup. Verify these settings:
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Base directory**: `cir-portal/cir-portal` (if your project is in a subdirectory).

### Step 4: Environment Variables (CRITICAL)
In the Cloudflare dashboard, navigate to **Settings** > **Environment variables** and add:
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

### Step 5: Deploy
Click **"Save and Deploy"**. Cloudflare will build and host your site on a `.pages.dev` subdomain.

---

## 3. Custom Domain & Legal Checklist
- **Domain**: You can add your company domain (e.g., `portal.company.com`) via Cloudflare's custom domain settings.
- **SSL**: Cloudflare provides free, automated SSL/TLS certificates.
- **Legal Compliance**:
  - Ensure the provided **Privacy Policy** (`PRIVACY.md`) and **Terms of Service** (`TERMS.md`) are linked correctly.
  - Review your **Supabase Data Region** to ensure it aligns with your company's jurisdiction.

---

## 4. Maintenance
Your project includes a GitHub Action to keep your free-tier Supabase instance active. Ensure this is running in your repository's **Actions** tab.
