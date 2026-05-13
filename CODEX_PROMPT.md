# Codex Prompt: Build Google Form Skiner

You are ChatGPT Codex. Build a complete production-ready web app named **Google Form Skiner**.

## Product summary

Google Form Skiner is a small private tool hosted at:

```text
https://your-domain.example.com
```

The tool imports a public Google Form URL, parses its questions, and generates clean custom HTML + JavaScript that can be embedded into a hand-coded landing page. The generated form should visually integrate with the landing page instead of embedding the default Google Form iframe.

Google Form remains the real backend:
- The original Google Form defines fields, options, required status, and response destination.
- The generated HTML form submits directly to the Google Form `formResponse` endpoint.
- Responses still go into Google Form / linked Google Sheet.
- The tool does not store leads.
- The tool does not use Google Sheets API.
- The tool does not need Google OAuth.

The app is private and protected by a simple PIN set by the owner. If the visitor does not know the PIN, they cannot access the tool.

---

## Tech stack

Use a simple, deployable stack:

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- No database
- Server-side parser API route
- PIN auth via signed cookie
- Environment variables

Use minimal dependencies. Avoid heavy UI libraries unless necessary.

Recommended dependencies:
- `next`
- `react`
- `react-dom`
- `cheerio`
- `zod`
- `jose` or `iron-session` for signed cookie, or implement secure HMAC signed cookie using Node crypto
- `tailwindcss`
- `typescript`
- `eslint`

---

## Environment variables

Create `.env.example`:

```env
APP_PIN=change-this-pin
AUTH_COOKIE_SECRET=replace-with-long-random-secret-at-least-32-chars
NEXT_PUBLIC_APP_URL=https://your-domain.example.com
```

Rules:
- `APP_PIN` is the login PIN.
- `AUTH_COOKIE_SECRET` signs the auth cookie.
- Never expose `APP_PIN` to the client.
- Auth cookie should be `httpOnly`, `sameSite=lax`, `secure` in production.

---

## Pages and routes

### 1. `/login`

Simple PIN login page.

Fields:
- PIN input
- Submit button
- Error message if wrong

Behavior:
- POST to `/api/auth/login`
- If correct, set signed auth cookie
- Redirect to `/`

### 2. `/`

Protected app page. If not authenticated, redirect to `/login`.

Main UI sections:

1. Form URL input
2. Import button
3. Parser result preview:
   - Form title
   - Form description
   - Submit URL
   - Field table:
     - label
     - type
     - required
     - options
     - entry id
     - supported / unsupported warning
4. Export panel:
   - Generated HTML
   - Generated JavaScript
   - Combined embed code
   - Copy buttons
5. Notes/warnings:
   - Public Google Form only
   - No file upload
   - No login-required form
   - No complex branching support
   - Re-import after changing Google Form

### 3. `/api/auth/login`

POST JSON:

```json
{ "pin": "123456" }
```

If correct:
- Set auth cookie
- Return `{ "ok": true }`

If incorrect:
- Return 401 `{ "ok": false, "message": "Invalid PIN" }`

### 4. `/api/auth/logout`

POST:
- Clear auth cookie
- Return `{ "ok": true }`

### 5. `/api/import-google-form`

Protected API route.

POST JSON:

```json
{ "url": "https://docs.google.com/forms/d/e/xxx/viewform" }
```

Fetch the Google Form page server-side.
Parse schema.
Return normalized JSON.

---

## Google Form parser requirements

The parser must be practical and robust enough for public Google Forms.

Supported input URLs:
- `https://docs.google.com/forms/d/e/{FORM_ID}/viewform`
- `https://docs.google.com/forms/d/{FORM_ID}/viewform`
- URLs with query params

The parser should normalize submit URL to:

```text
https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
```

or the equivalent detected form response URL.

### Preferred parsing strategy

Google Forms pages often contain embedded JavaScript data such as `FB_PUBLIC_LOAD_DATA_`.

Implement parser that tries:

1. Extract `FB_PUBLIC_LOAD_DATA_ = ...;` from the HTML.
2. Parse the JavaScript array safely enough using a controlled parser approach.
   - It is not strict JSON.
   - Avoid `eval`.
   - It can often be parsed by extracting the array literal and using JSON-compatible cleanup if possible.
   - If direct JSON parse fails, use a fallback regex/HTML parser.
3. Extract questions and entry IDs from the parsed structure.
4. Fallback: parse HTML inputs with names like `entry.123456`.

Since Google may change internal format, isolate this code in:

```text
src/lib/googleFormsParser.ts
```

Keep it easy to modify later.

### Field output schema

Return this shape:

```ts
type GoogleFormSchema = {
  title: string;
  description?: string;
  sourceUrl: string;
  submitUrl: string;
  fields: GoogleFormField[];
  warnings: string[];
};

type GoogleFormField = {
  id: string;
  entryId: string;
  label: string;
  helpText?: string;
  type:
    | "short_text"
    | "paragraph"
    | "multiple_choice"
    | "checkboxes"
    | "dropdown"
    | "date"
    | "time"
    | "linear_scale"
    | "unknown"
    | "unsupported";
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unsupportedReason?: string;
};
```

### Supported Google Form question types

Support these in MVP:

- Short answer → `<input type="text">`
- Paragraph → `<textarea>`
- Multiple choice → radio group
- Checkboxes → checkbox group
- Dropdown → `<select>`
- Date → `<input type="date">`
- Time → `<input type="time">`
- Linear scale → radio group or select

Mark these as unsupported:
- File upload
- Multiple choice grid
- Checkbox grid
- Section branching / complex navigation
- Quiz-specific scoring
- Forms requiring Google login
- Forms restricted to an organization
- Forms with “limit to 1 response”

If unsupported fields are detected, still render the supported fields and show warnings.

---

## UTM and hidden fields

The generated HTML should support UTM capture.

Convention:
If the Google Form contains questions with labels matching these keys, render them as hidden fields:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
page_url
referrer
```

Matching should be case-insensitive and tolerate spaces/dashes, for example:
- `UTM Source`
- `utm_source`
- `utm source`
- `utm-source`

Generated JS should fill:
- `utm_source` from URLSearchParams
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `page_url` from `window.location.href`
- `referrer` from `document.referrer`

These fields should not be visible in the rendered form.

---

## Generated code requirements

The export should include:

### 1. HTML only

A clean, unstyled form with semantic classes:

```html
<iframe name="gfs_hidden_iframe" class="gfs-hidden-iframe"></iframe>

<form
  id="gfs-form"
  class="gfs-form"
  action="https://docs.google.com/forms/d/e/xxx/formResponse"
  method="POST"
  target="gfs_hidden_iframe"
>
  ...
</form>
```

Use native POST to hidden iframe to avoid CORS issues.

### 2. JavaScript only

JS should:
- Fill UTM hidden fields
- Fill page URL
- Fill referrer
- Disable submit button after submit
- Show success message after submit
- Reset form after successful-looking submit
- Not rely on fetch
- Be plain vanilla JS
- Avoid external dependencies

Example behavior:
- On submit:
  - button disabled
  - button text changes to `"Đang gửi..."`
  - after 700ms:
    - show success message
    - reset form
    - restore button

Important: because hidden iframe submit cannot reliably detect Google Form success, show success optimistically after submit.

### 3. Combined embed code

The combined code should include HTML + JS in one block.

### 4. CSS classes only, not heavy styling

Do not generate opinionated CSS by default. The user wants to style the form to match each landing page.

Use class names:

```text
gfs-form
gfs-field
gfs-label
gfs-required
gfs-input
gfs-textarea
gfs-select
gfs-radio-group
gfs-checkbox-group
gfs-option
gfs-submit
gfs-message
gfs-hidden
```

---

## Generated field examples

### Short text

```html
<div class="gfs-field" data-field="name">
  <label class="gfs-label">
    Họ tên <span class="gfs-required">*</span>
  </label>
  <input class="gfs-input" type="text" name="entry.123456" required>
</div>
```

### Paragraph

```html
<textarea class="gfs-textarea" name="entry.123456"></textarea>
```

### Radio

```html
<label class="gfs-option">
  <input type="radio" name="entry.123456" value="Option A" required>
  <span>Option A</span>
</label>
```

### Checkboxes

Google Forms accepts multiple values under the same `entry.x` name. Render:

```html
<label class="gfs-option">
  <input type="checkbox" name="entry.123456" value="Option A">
  <span>Option A</span>
</label>
```

### Dropdown

```html
<select class="gfs-select" name="entry.123456" required>
  <option value="">Chọn...</option>
  <option value="Option A">Option A</option>
</select>
```

### Hidden UTM

```html
<input type="hidden" name="entry.123456" data-gfs-hidden-key="utm_source">
```

---

## UI implementation details

The app UI should be clean and simple.

Main page layout:
- Header: "Google Form Skiner"
- Small subtitle: "Render Google Forms as clean HTML for landing pages."
- URL input card
- Preview card
- Export code card

Interactions:
- User pastes Google Form URL
- Clicks "Import form"
- Show loading state
- Show errors clearly
- Show parsed field preview
- Show generated code tabs:
  - Combined
  - HTML
  - JS
- Copy button for each code block

No database, no accounts, no user management.

---

## Security

- The whole app is protected by PIN.
- `/api/import-google-form` must check auth cookie.
- Validate URL:
  - Must be `https://docs.google.com/forms/...`
  - Reject other hosts
- Fetch with timeout.
- Limit fetched body size if practical.
- Sanitize generated HTML text:
  - Escape labels/options/descriptions before inserting into generated code.
- Never execute arbitrary script extracted from Google.
- Do not use `eval`.

---

## Error handling

Show helpful errors:

- Invalid URL
- Not a Google Form URL
- Cannot fetch form
- Form is not public
- Cannot parse form
- No supported fields found
- Google changed internal structure, parser needs update

---

## Project structure

Create a clean structure:

```text
src/
  app/
    login/
      page.tsx
    page.tsx
    api/
      auth/
        login/route.ts
        logout/route.ts
      import-google-form/route.ts
  components/
    CodeBlock.tsx
    FieldPreviewTable.tsx
    ImportForm.tsx
  lib/
    auth.ts
    googleFormsParser.ts
    generateEmbedCode.ts
    normalize.ts
    htmlEscape.ts
  types/
    googleForm.ts
```

---

## Tests

Add basic unit tests if practical for:
- URL validation
- UTM label normalization
- HTML escaping
- code generation

Testing framework can be Vitest.

At minimum, include a few parser helper tests.

---

## Deployment

Add README instructions for deployment to Vercel.

The user will point:

```text
your-domain.example.com
```

to the deployed app.

README should include:
- Install
- `.env.local`
- `npm run dev`
- `npm run build`
- Vercel deployment
- Environment variables
- How to use the tool
- Google Form setup checklist

Google Form checklist:
- Form must be public
- Do not require login
- Do not enable "Limit to 1 response"
- Avoid file upload
- Avoid complex branching for MVP
- Add UTM questions if tracking is needed:
  - utm_source
  - utm_medium
  - utm_campaign
  - utm_content
  - utm_term
  - page_url
  - referrer
- Link Google Form responses to Google Sheet before running ads

---

## Acceptance criteria

The project is done when:

1. Visiting `/` without auth redirects to `/login`.
2. Correct PIN logs in and unlocks the tool.
3. Wrong PIN is rejected.
4. Importing a public Google Form URL returns a parsed schema.
5. The UI previews parsed fields.
6. The UI generates:
   - HTML code
   - JS code
   - combined embed code
7. Generated form submits to Google Form using native POST + hidden iframe.
8. UTM/page_url/referrer hidden fields are auto-filled when matching questions exist.
9. Labels/options are HTML-escaped.
10. README explains setup and known limitations.
11. The app can deploy to Vercel with env vars.
12. No lead data is stored by the tool.

---

## Important product boundaries

Do not build:
- Google OAuth
- Google Sheets API integration
- lead dashboard
- landing page hosting
- visual form builder
- drag/drop editor
- CRM
- database
- multi-user accounts

This is only a private Google Form skinning and code generation tool.
