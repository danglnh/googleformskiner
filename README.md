# Google Form Skiner

Private PIN-protected tool to import a public Google Form and generate clean HTML/JS code that submits directly to Google Form.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- No database

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` manually and set values:

```env
APP_PIN=your-pin
AUTH_COOKIE_SECRET=long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://googleformskiner.haidangle.com
```

3. Run dev server:

```bash
npm run dev
```

4. Build production:

```bash
npm run build
npm run start
```

## Use

1. Open `/login` and enter PIN.
2. Paste a public Google Form `viewform` URL.
3. Click **Import form**.
4. Review parsed fields and warnings.
5. Copy **Combined**, **HTML**, or **JS** output.

## Deployment (Vercel)

1. Push project to GitHub.
2. Import repo in Vercel.
3. Add env vars:
- `APP_PIN`
- `AUTH_COOKIE_SECRET`
- `NEXT_PUBLIC_APP_URL`
4. Deploy.
5. Point domain `googleformskiner.haidangle.com` to Vercel project.

## Google Form checklist

- Form must be public.
- Do not require Google login.
- Disable “Limit to 1 response”.
- Avoid file upload.
- Avoid complex branching and grids for MVP.
- Add tracking questions if needed:
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_content`
  - `utm_term`
  - `page_url`
  - `referrer`

## Limitations

- Parser can break if Google changes internal structure.
- Hidden iframe submit uses optimistic success UI.
- Unsupported features are warned, not fully rendered.
