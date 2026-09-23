# Danantara Dashboard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP of the Danantara Market Intelligence Dashboard — a read-only Next.js app showing near-real-time stock price and financial-report data for the 13 companies whose shares were transferred to Danantara via PT BKI, with automated data ingestion and a human review gate on AI-extracted figures.

**Architecture:** Single Next.js (App Router, TypeScript) repo deployed to Vercel. Three scheduled route handlers (triggered by Vercel Cron) ingest data into Supabase (Postgres + Auth): Job 1 polls a price API every ~15 minutes, Job 2 pulls structured fundamentals weekly and auto-publishes them, Job 3 extracts figures from official documents via Claude weekly and always lands as `needs_review` until a logged-in reviewer approves it. The dashboard reads only `verified` data; a small reviewer page manages the `needs_review` queue.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Zod, Recharts, `@anthropic-ai/sdk`, `pdf-parse`, Vitest + Testing Library, deployed on Vercel with Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-09-22-danantara-dashboard-design.md` (this plan implements §1–§5, §7 of that spec; §4.5 "Tanya AI" is explicitly out of scope for this plan — see spec §8 and `DOCUMENTATION.md` §7 for why).

## Global Constraints

- Single Next.js repo, no separate backend service for ingestion (spec §3) — all three jobs are Vercel Cron-triggered route handlers in this same repo.
- Exactly these 13 tickers, no more, no fewer, for v1: `BBRI, BMRI, BBNI, BBTN, TLKM, SMGR, JSMR, WIKA, WSKT, PTPP, ADHI, KRAS, GIAA` (spec §2).
- "Real-time" means ≤15-minute delay, displayed honestly in the UI — never claim tick-by-tick real-time (spec §4.3).
- Every `financial_reports` row must carry `source_url`, `as_of_date`, `extraction_method`, and `status` (spec §4.2, §5).
- Rows written by Job 3 (AI-extraction) are **always** inserted with `status = 'needs_review'`, regardless of whether the anomaly check passes — human approval is the only way a row becomes `verified` for that path (spec §4.5).
- Dashboard pages (browser/anon Supabase key) must never be able to read `financial_reports` rows with `status = 'needs_review'` — enforced at the database level via RLS, not just in application code (spec §5).
- No export to PDF/Excel in this plan (spec Non-goals). No public/external access — every page requires a logged-in Supabase Auth session (spec §1).
- `GOAPI.io` and `Sectors.app` are sign-up-gated APIs; this plan could not obtain their authenticated API reference during research (spec §8, "Open Risks"). Tasks 6 and 7 isolate that uncertainty to one fetch URL and one response-parsing line each — everything else in those tasks (validation, upsert, tests) does not depend on the exact vendor response shape and needs no rework once the real shape is confirmed.
- Model for all Claude API calls: `claude-opus-5` (no other model was requested).

---

## File Structure

```
Danantara/
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── vercel.json
├── .env.example
├── supabase/
│   └── migrations/
│       └── 0001_init.sql
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                    — dashboard overview (Task 9)
│   │   ├── login/page.tsx              — Supabase Auth login (Task 4)
│   │   ├── company/[ticker]/page.tsx   — price chart + financial cards (Task 10)
│   │   ├── review/page.tsx             — needs_review approval queue (Task 12)
│   │   └── api/cron/
│   │       ├── prices/route.ts         — Job 1 (Task 6)
│   │       ├── fundamentals/route.ts   — Job 2 (Task 7)
│   │       └── extract/route.ts        — Job 3 (Task 8)
│   ├── lib/
│   │   ├── companies.ts                — static seed list of 13 tickers
│   │   ├── cron-auth.ts                — shared Vercel Cron bearer-token check
│   │   ├── supabase/
│   │   │   ├── server.ts               — session-bound server client + service-role client
│   │   │   └── browser.ts              — browser client (anon key)
│   │   ├── validation/
│   │   │   ├── price.ts
│   │   │   └── financials.ts
│   │   └── data-sources/
│   │       ├── goapi.ts
│   │       ├── sectors.ts
│   │       ├── document-text.ts
│   │       └── claude-extract.ts
│   └── components/
│       ├── StatusBadge.tsx
│       ├── StaleIndicator.tsx
│       ├── PriceChart.tsx              — client component (Recharts)
│       └── FinancialReportCard.tsx
└── tests/
    ├── lib/
    │   ├── cron-auth.test.ts
    │   ├── validation/price.test.ts
    │   ├── validation/financials.test.ts
    │   └── data-sources/
    │       ├── goapi.test.ts
    │       ├── sectors.test.ts
    │       ├── document-text.test.ts
    │       └── claude-extract.test.ts
    ├── api/
    │   ├── cron-prices.test.ts
    │   ├── cron-fundamentals.test.ts
    │   └── cron-extract.test.ts
    └── components/
        ├── StatusBadge.test.tsx
        └── StaleIndicator.test.tsx
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (temporary placeholder, replaced in Task 9)

**Interfaces:**
- Produces: a runnable `npm run dev` / `npm run build` / `npm test` toolchain every later task relies on.

- [ ] **Step 1: Scaffold Next.js with TypeScript**

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir=false --import-alias "@/*" --eslint
```

When prompted, accept defaults. This creates `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `eslint.config.mjs`.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod recharts @anthropic-ai/sdk pdf-parse
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/pdf-parse
```

- [ ] **Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add test script to package.json**

Edit `package.json` scripts block to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Create `.env.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
GOAPI_BASE_URL=https://api.goapi.io/v1
GOAPI_API_KEY=
SECTORS_API_KEY=
ANTHROPIC_API_KEY=
```

- [ ] **Step 7: Verify the toolchain**

Run: `npm run build`
Expected: build succeeds with the default scaffolded page.

Run: `npm test`
Expected: `No test files found` (not an error) — confirms Vitest runs.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts vitest.setup.ts .env.example .gitignore eslint.config.mjs src/
git commit -m "chore: scaffold Next.js + TypeScript + Vitest toolchain"
```

---

### Task 2: Supabase Schema & Seed Data

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `src/lib/companies.ts`
- Test: `tests/lib/companies.test.ts`

**Interfaces:**
- Produces: `Company` type and `COMPANIES: Company[]` (13 entries) from `src/lib/companies.ts`, consumed by Tasks 6, 7, 8, 9, 10.
- Produces: `companies`, `price_snapshots`, `financial_reports`, `document_sources` tables in Supabase.

- [ ] **Step 1: Write the failing test for the seed list**

```typescript
// tests/lib/companies.test.ts
import { describe, it, expect } from "vitest";
import { COMPANIES } from "@/lib/companies";

describe("COMPANIES", () => {
  it("has exactly the 13 approved tickers", () => {
    const tickers = COMPANIES.map((c) => c.ticker).sort();
    expect(tickers).toEqual(
      [
        "ADHI", "BBNI", "BBRI", "BBTN", "GIAA", "JSMR", "KRAS",
        "PTPP", "SMGR", "TLKM", "WIKA", "WSKT", "BMRI",
      ].sort(),
    );
  });

  it("every company has a non-empty name and sector", () => {
    for (const company of COMPANIES) {
      expect(company.name.length).toBeGreaterThan(0);
      expect(company.sector.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/companies.test.ts`
Expected: FAIL — `Cannot find module '@/lib/companies'`

- [ ] **Step 3: Implement the seed list**

```typescript
// src/lib/companies.ts
export interface Company {
  ticker: string;
  name: string;
  sector: string;
  pctSharesTransferred: number;
}

// Source: Tempo, CNN Indonesia, Hukumonline (re-verified 2026-09-22) —
// see docs/superpowers/specs/2026-09-22-danantara-dashboard-design.md §2.
export const COMPANIES: Company[] = [
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 },
  { ticker: "BMRI", name: "Bank Mandiri", sector: "Perbankan", pctSharesTransferred: 52.0 },
  { ticker: "BBNI", name: "Bank Negara Indonesia", sector: "Perbankan", pctSharesTransferred: 60.0 },
  { ticker: "BBTN", name: "Bank Tabungan Negara", sector: "Perbankan", pctSharesTransferred: 60.0 },
  { ticker: "TLKM", name: "Telkom Indonesia", sector: "Telekomunikasi", pctSharesTransferred: 52.09 },
  { ticker: "SMGR", name: "Semen Indonesia", sector: "Industri", pctSharesTransferred: 51.2 },
  { ticker: "JSMR", name: "Jasa Marga", sector: "Infrastruktur", pctSharesTransferred: 70.0 },
  { ticker: "WIKA", name: "Wijaya Karya", sector: "Konstruksi", pctSharesTransferred: 91.01 },
  { ticker: "WSKT", name: "Waskita Karya", sector: "Konstruksi", pctSharesTransferred: 75.35 },
  { ticker: "PTPP", name: "PP (Persero)", sector: "Konstruksi", pctSharesTransferred: 51.0 },
  { ticker: "ADHI", name: "Adhi Karya", sector: "Konstruksi", pctSharesTransferred: 64.33 },
  { ticker: "KRAS", name: "Krakatau Steel", sector: "Industri", pctSharesTransferred: 80.0 },
  { ticker: "GIAA", name: "Garuda Indonesia", sector: "Transportasi", pctSharesTransferred: 64.53 },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/companies.test.ts`
Expected: PASS

- [ ] **Step 5: Write the migration**

```sql
-- supabase/migrations/0001_init.sql
create table companies (
  ticker text primary key,
  name text not null,
  sector text not null,
  pct_shares_transferred numeric,
  logo_url text
);

create table price_snapshots (
  id bigserial primary key,
  ticker text not null references companies(ticker),
  price numeric not null,
  volume bigint,
  captured_at timestamptz not null,
  source text not null
);
create index price_snapshots_ticker_captured_at_idx
  on price_snapshots (ticker, captured_at desc);

create table financial_reports (
  id bigserial primary key,
  ticker text not null references companies(ticker),
  period text not null,
  revenue numeric,
  net_profit numeric,
  total_assets numeric,
  source_url text not null,
  extraction_method text not null check (extraction_method in ('api', 'ai')),
  as_of_date date not null,
  extracted_at timestamptz not null,
  status text not null default 'needs_review' check (status in ('verified', 'needs_review')),
  unique (ticker, period, extraction_method)
);

-- Manually curated by the ops team: which official document URL to pull
-- for Job 3 (AI-extraction). See spec §4.4 and Task 8 of this plan for why
-- this is manual rather than auto-discovered.
create table document_sources (
  ticker text not null references companies(ticker),
  period text not null,
  source_url text not null,
  primary key (ticker, period)
);

alter table companies enable row level security;
alter table price_snapshots enable row level security;
alter table financial_reports enable row level security;
alter table document_sources enable row level security;

create policy "authenticated read companies" on companies
  for select to authenticated using (true);
create policy "authenticated read price_snapshots" on price_snapshots
  for select to authenticated using (true);
-- Only verified rows are visible through the anon/authenticated read path -
-- needs_review rows are only reachable via the service-role key (Task 12).
create policy "authenticated read verified financial_reports" on financial_reports
  for select to authenticated using (status = 'verified');
create policy "authenticated read document_sources" on document_sources
  for select to authenticated using (true);

insert into companies (ticker, name, sector, pct_shares_transferred) values
  ('BBRI', 'Bank Rakyat Indonesia', 'Perbankan', 53.19),
  ('BMRI', 'Bank Mandiri', 'Perbankan', 52.0),
  ('BBNI', 'Bank Negara Indonesia', 'Perbankan', 60.0),
  ('BBTN', 'Bank Tabungan Negara', 'Perbankan', 60.0),
  ('TLKM', 'Telkom Indonesia', 'Telekomunikasi', 52.09),
  ('SMGR', 'Semen Indonesia', 'Industri', 51.2),
  ('JSMR', 'Jasa Marga', 'Infrastruktur', 70.0),
  ('WIKA', 'Wijaya Karya', 'Konstruksi', 91.01),
  ('WSKT', 'Waskita Karya', 'Konstruksi', 75.35),
  ('PTPP', 'PP (Persero)', 'Konstruksi', 51.0),
  ('ADHI', 'Adhi Karya', 'Konstruksi', 64.33),
  ('KRAS', 'Krakatau Steel', 'Industri', 80.0),
  ('GIAA', 'Garuda Indonesia', 'Transportasi', 64.53);
```

- [ ] **Step 6: Apply the migration**

Run: `npx supabase link --project-ref <project-ref>` (once, after creating the Supabase project in the dashboard), then:
Run: `npx supabase db push`
Expected: migration applies with no errors; `select count(*) from companies;` in the Supabase SQL editor returns `13`.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0001_init.sql src/lib/companies.ts tests/lib/companies.test.ts
git commit -m "feat: add Supabase schema migration and 13-company seed list"
```

---

### Task 3: Supabase Client Helpers

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`
- Test: `tests/lib/supabase-clients.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` env vars (Task 1).
- Produces: `createServerSupabaseClient()` (session-aware, for Server Components/pages, Tasks 9/10/12), `createServiceRoleClient()` (bypasses RLS, for cron routes, Tasks 6/7/8 and the reviewer approve action in Task 12), `createBrowserSupabaseClient()` (for the login form, Task 4).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/lib/supabase-clients.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

describe("createServiceRoleClient", () => {
  it("throws if SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    expect(() => createServiceRoleClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY is not set");
  });

  it("constructs a client when the env var is set", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/server");
    expect(() => createServiceRoleClient()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/supabase-clients.test.ts`
Expected: FAIL — `Cannot find module '@/lib/supabase/server'`

- [ ] **Step 3: Implement the server clients**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** Session-aware client for Server Components and route handlers that run
 * on behalf of a logged-in user. Respects RLS. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

/** Bypasses RLS entirely. Only for scheduled cron routes and the reviewer
 * approve action (Task 12) — never expose this client to the browser. */
export function createServiceRoleClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}
```

```typescript
// src/lib/supabase/browser.ts
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/supabase-clients.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/browser.ts tests/lib/supabase-clients.test.ts
git commit -m "feat: add Supabase server, service-role, and browser client helpers"
```

---

### Task 4: Auth — Login Page & Route Guard

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Test: `tests/middleware.test.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` (Task 3).
- Produces: unauthenticated requests to any route except `/login` are redirected to `/login` — Tasks 9, 10, 12 rely on this to not re-check auth themselves for the redirect case (they still call `createServerSupabaseClient()` to read the user for display purposes).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/middleware.test.ts
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  }),
}));

import { middleware } from "@/middleware";

describe("middleware", () => {
  it("redirects unauthenticated requests to /login", async () => {
    const request = new NextRequest("http://localhost/company/BBRI");
    const response = await middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("does not redirect requests already going to /login", async () => {
    const request = new NextRequest("http://localhost/login");
    const response = await middleware(request);
    expect(response.status).not.toBe(307);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/middleware.test.ts`
Expected: FAIL — `Cannot find module '@/middleware'`

- [ ] **Step 3: Implement the middleware**

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/middleware.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the login page**

```tsx
// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="login-page">
      <h1>Danantara Market Intelligence</h1>
      <p>Login internal — akun disediakan oleh admin.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert">{error}</p>}
        <button type="submit">Masuk</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/app/login/page.tsx tests/middleware.test.ts
git commit -m "feat: add Supabase Auth login page and route-guard middleware"
```

---

### Task 5: Validation Utilities

**Files:**
- Create: `src/lib/validation/price.ts`, `src/lib/validation/financials.ts`
- Test: `tests/lib/validation/price.test.ts`, `tests/lib/validation/financials.test.ts`

**Interfaces:**
- Produces: `checkPriceSanity(price: number, previousPrice: number | null): { ok: boolean; reason?: string }` — consumed by Task 6.
- Produces: `FinancialFigures` type, `checkFinancialAnomaly(current: FinancialFigures, previous: FinancialFigures | null): { anomalous: boolean; reasons: string[] }` — consumed by Tasks 7 and 8.

- [ ] **Step 1: Write the failing tests for price sanity**

```typescript
// tests/lib/validation/price.test.ts
import { describe, it, expect } from "vitest";
import { checkPriceSanity } from "@/lib/validation/price";

describe("checkPriceSanity", () => {
  it("accepts a positive price with no prior snapshot", () => {
    expect(checkPriceSanity(3040, null)).toEqual({ ok: true });
  });

  it("rejects a zero or negative price", () => {
    expect(checkPriceSanity(0, null).ok).toBe(false);
    expect(checkPriceSanity(-10, 100).ok).toBe(false);
  });

  it("accepts a small change from the previous price", () => {
    expect(checkPriceSanity(3100, 3040).ok).toBe(true);
  });

  it("rejects a change bigger than the sanity threshold", () => {
    const result = checkPriceSanity(6000, 3040);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("35");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/validation/price.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validation/price'`

- [ ] **Step 3: Implement price validation**

```typescript
// src/lib/validation/price.ts
export interface PriceSanityResult {
  ok: boolean;
  reason?: string;
}

// IDX's own daily auto-rejection (ARA/ARB) bands are roughly 20-35%. Our
// poll interval (~15 min) is far shorter than a trading day, so any single
// step bigger than that band means bad data from the source API, not a
// real price move.
const MAX_STEP_CHANGE_RATIO = 0.35;

export function checkPriceSanity(price: number, previousPrice: number | null): PriceSanityResult {
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, reason: `price must be a positive number, got ${price}` };
  }
  if (previousPrice !== null && previousPrice > 0) {
    const changeRatio = Math.abs(price - previousPrice) / previousPrice;
    if (changeRatio > MAX_STEP_CHANGE_RATIO) {
      return {
        ok: false,
        reason: `price changed ${(changeRatio * 100).toFixed(1)}% since last snapshot (${previousPrice} -> ${price}), exceeds ${MAX_STEP_CHANGE_RATIO * 100}% sanity threshold`,
      };
    }
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/validation/price.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for financial anomaly checks**

```typescript
// tests/lib/validation/financials.test.ts
import { describe, it, expect } from "vitest";
import { checkFinancialAnomaly, type FinancialFigures } from "@/lib/validation/financials";

const base: FinancialFigures = { revenue: 1000, net_profit: 100, total_assets: 5000 };

describe("checkFinancialAnomaly", () => {
  it("is not anomalous when there is no previous period", () => {
    expect(checkFinancialAnomaly(base, null)).toEqual({ anomalous: false, reasons: [] });
  });

  it("is not anomalous for a small change", () => {
    const current: FinancialFigures = { revenue: 1050, net_profit: 105, total_assets: 5100 };
    expect(checkFinancialAnomaly(current, base).anomalous).toBe(false);
  });

  it("flags revenue that more than doubles", () => {
    const current: FinancialFigures = { revenue: 2500, net_profit: 100, total_assets: 5000 };
    const result = checkFinancialAnomaly(current, base);
    expect(result.anomalous).toBe(true);
    expect(result.reasons.some((r) => r.includes("revenue"))).toBe(true);
  });

  it("ignores fields that are null in either period", () => {
    const current: FinancialFigures = { revenue: null, net_profit: 100, total_assets: 5000 };
    expect(checkFinancialAnomaly(current, base).anomalous).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/lib/validation/financials.test.ts`
Expected: FAIL — `Cannot find module '@/lib/validation/financials'`

- [ ] **Step 7: Implement financial anomaly validation**

```typescript
// src/lib/validation/financials.ts
export interface FinancialFigures {
  revenue: number | null;
  net_profit: number | null;
  total_assets: number | null;
}

export interface AnomalyCheckResult {
  anomalous: boolean;
  reasons: string[];
}

const ANOMALY_CHANGE_RATIO = 0.5;

function changedTooMuch(current: number | null, previous: number | null): boolean {
  if (current === null || previous === null || previous === 0) return false;
  return Math.abs(current - previous) / Math.abs(previous) > ANOMALY_CHANGE_RATIO;
}

export function checkFinancialAnomaly(
  current: FinancialFigures,
  previous: FinancialFigures | null,
): AnomalyCheckResult {
  if (!previous) return { anomalous: false, reasons: [] };

  const reasons: string[] = [];
  if (changedTooMuch(current.revenue, previous.revenue)) {
    reasons.push("revenue changed more than 50% vs previous period");
  }
  if (changedTooMuch(current.net_profit, previous.net_profit)) {
    reasons.push("net_profit changed more than 50% vs previous period");
  }
  if (changedTooMuch(current.total_assets, previous.total_assets)) {
    reasons.push("total_assets changed more than 50% vs previous period");
  }
  return { anomalous: reasons.length > 0, reasons };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/lib/validation/financials.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/validation/ tests/lib/validation/
git commit -m "feat: add price sanity and financial anomaly validation"
```

---

### Task 6: Job 1 — Price Ingestion

**Files:**
- Create: `src/lib/cron-auth.ts`, `src/lib/data-sources/goapi.ts`, `src/app/api/cron/prices/route.ts`
- Test: `tests/lib/cron-auth.test.ts`, `tests/lib/data-sources/goapi.test.ts`, `tests/api/cron-prices.test.ts`

**Interfaces:**
- Produces: `assertCronAuthorized(request: NextRequest): NextResponse | null` — reused verbatim by Tasks 7 and 8.
- Produces: `fetchLatestPrice(ticker: string): Promise<{ price: number; volume: number | null }>`.
- Consumes: `COMPANIES` (Task 2), `checkPriceSanity` (Task 5), `createServiceRoleClient` (Task 3).

- [ ] **Step 1: Write the failing test for the cron auth guard**

```typescript
// tests/lib/cron-auth.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
});

describe("assertCronAuthorized", () => {
  it("returns null when the bearer token matches CRON_SECRET", () => {
    const request = new NextRequest("http://localhost/api/cron/prices", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(assertCronAuthorized(request)).toBeNull();
  });

  it("returns a 401 response when the token is missing or wrong", () => {
    const request = new NextRequest("http://localhost/api/cron/prices");
    const result = assertCronAuthorized(request);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/cron-auth.test.ts`
Expected: FAIL — `Cannot find module '@/lib/cron-auth'`

- [ ] **Step 3: Implement the cron auth guard**

```typescript
// src/lib/cron-auth.ts
import { NextResponse, type NextRequest } from "next/server";

/** Vercel Cron calls these routes with `Authorization: Bearer $CRON_SECRET`.
 * Without this check anyone on the internet could trigger paid API calls
 * and writes to the database. */
export function assertCronAuthorized(request: NextRequest): NextResponse | null {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/cron-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the GOAPI client**

```typescript
// tests/lib/data-sources/goapi.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { fetchLatestPrice } from "@/lib/data-sources/goapi";

beforeEach(() => {
  process.env.GOAPI_API_KEY = "test-key";
  process.env.GOAPI_BASE_URL = "https://api.goapi.io/v1";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchLatestPrice", () => {
  it("parses a successful response into a PricePoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { last_price: 3040, volume: 12345678 } }),
      }),
    );
    const result = await fetchLatestPrice("BBRI");
    expect(result).toEqual({ price: 3040, volume: 12345678 });
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" }),
    );
    await expect(fetchLatestPrice("BBRI")).rejects.toThrow("500");
  });

  it("throws when GOAPI_API_KEY is missing", async () => {
    delete process.env.GOAPI_API_KEY;
    await expect(fetchLatestPrice("BBRI")).rejects.toThrow("GOAPI_API_KEY");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/lib/data-sources/goapi.test.ts`
Expected: FAIL — `Cannot find module '@/lib/data-sources/goapi'`

- [ ] **Step 7: Implement the GOAPI client**

```typescript
// src/lib/data-sources/goapi.ts
export interface PricePoint {
  price: number;
  volume: number | null;
}

// GOAPI.io's exact endpoint path and response field names are behind their
// signup-gated docs (spec §8, "Open Risks") - this shape is inferred from
// their public marketing page and MUST be confirmed against the real docs
// at app.goapi.io once the team has an account. If the real shape differs,
// only the fetch URL and the two `body.data.*` reads below need to change -
// nothing else in this file or its callers depends on the exact shape.
export async function fetchLatestPrice(ticker: string): Promise<PricePoint> {
  const apiKey = process.env.GOAPI_API_KEY;
  if (!apiKey) throw new Error("GOAPI_API_KEY is not set");
  const baseUrl = process.env.GOAPI_BASE_URL ?? "https://api.goapi.io/v1";

  const response = await fetch(`${baseUrl}/stock/${ticker}/price`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!response.ok) {
    throw new Error(`GOAPI price fetch failed for ${ticker}: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as { data: { last_price: number; volume: number | null } };
  return { price: body.data.last_price, volume: body.data.volume };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/lib/data-sources/goapi.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing test for the Job 1 route**

```typescript
// tests/api/cron-prices.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/companies", () => ({
  COMPANIES: [{ ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 }],
}));

vi.mock("@/lib/data-sources/goapi", () => ({
  fetchLatestPrice: vi.fn().mockResolvedValue({ price: 3040, volume: 1000 }),
}));

const insertMock = vi.fn().mockResolvedValue({ error: null });
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
const supabaseFromMock = vi.fn(() => ({
  select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: maybeSingleMock }) }) }) }),
  insert: insertMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => ({ from: supabaseFromMock }),
}));

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
  insertMock.mockClear();
});

describe("GET /api/cron/prices", () => {
  it("rejects requests without the cron bearer token", async () => {
    const { GET } = await import("@/app/api/cron/prices/route");
    const request = new NextRequest("http://localhost/api/cron/prices");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("fetches, validates, and upserts a price for each company", async () => {
    const { GET } = await import("@/app/api/cron/prices/route");
    const request = new NextRequest("http://localhost/api/cron/prices", {
      headers: { authorization: "Bearer test-secret" },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.results).toEqual([{ ticker: "BBRI", ok: true }]);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: "BBRI", price: 3040, volume: 1000, source: "goapi" }),
    );
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- tests/api/cron-prices.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/cron/prices/route'`

- [ ] **Step 11: Implement the Job 1 route**

```typescript
// src/app/api/cron/prices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { COMPANIES } from "@/lib/companies";
import { fetchLatestPrice } from "@/lib/data-sources/goapi";
import { checkPriceSanity } from "@/lib/validation/price";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  const supabase = createServiceRoleClient();
  const results: { ticker: string; ok: boolean; reason?: string }[] = [];

  for (const company of COMPANIES) {
    try {
      const { data: last } = await supabase
        .from("price_snapshots")
        .select("price")
        .eq("ticker", company.ticker)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { price, volume } = await fetchLatestPrice(company.ticker);
      const sanity = checkPriceSanity(price, (last as { price: number } | null)?.price ?? null);
      if (!sanity.ok) {
        results.push({ ticker: company.ticker, ok: false, reason: sanity.reason });
        continue;
      }

      await supabase.from("price_snapshots").insert({
        ticker: company.ticker,
        price,
        volume,
        captured_at: new Date().toISOString(),
        source: "goapi",
      });
      results.push({ ticker: company.ticker, ok: true });
    } catch (error) {
      results.push({ ticker: company.ticker, ok: false, reason: (error as Error).message });
    }
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test -- tests/api/cron-prices.test.ts`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add src/lib/cron-auth.ts src/lib/data-sources/goapi.ts src/app/api/cron/prices/route.ts tests/lib/cron-auth.test.ts tests/lib/data-sources/goapi.test.ts tests/api/cron-prices.test.ts
git commit -m "feat: add Job 1 price ingestion cron route"
```

---

### Task 7: Job 2 — Structured Fundamentals Ingestion

**Files:**
- Create: `src/lib/data-sources/sectors.ts`, `src/app/api/cron/fundamentals/route.ts`
- Test: `tests/lib/data-sources/sectors.test.ts`, `tests/api/cron-fundamentals.test.ts`

**Interfaces:**
- Consumes: `assertCronAuthorized` (Task 6), `COMPANIES` (Task 2), `checkFinancialAnomaly`, `FinancialFigures` (Task 5), `createServiceRoleClient` (Task 3).
- Produces: `fetchLatestFundamentals(ticker: string): Promise<{ period: string; revenue: number | null; net_profit: number | null; total_assets: number | null }>`.

- [ ] **Step 1: Write the failing test for the Sectors.app client**

```typescript
// tests/lib/data-sources/sectors.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { fetchLatestFundamentals } from "@/lib/data-sources/sectors";

beforeEach(() => {
  process.env.SECTORS_API_KEY = "test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchLatestFundamentals", () => {
  it("parses a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          financials: { period: "FY2025", revenue: 100000, net_profit: 15000, total_assets: 900000 },
        }),
      }),
    );
    const result = await fetchLatestFundamentals("BBRI");
    expect(result).toEqual({ period: "FY2025", revenue: 100000, net_profit: 15000, total_assets: 900000 });
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" }));
    await expect(fetchLatestFundamentals("BBRI")).rejects.toThrow("404");
  });

  it("throws when SECTORS_API_KEY is missing", async () => {
    delete process.env.SECTORS_API_KEY;
    await expect(fetchLatestFundamentals("BBRI")).rejects.toThrow("SECTORS_API_KEY");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/data-sources/sectors.test.ts`
Expected: FAIL — `Cannot find module '@/lib/data-sources/sectors'`

- [ ] **Step 3: Implement the Sectors.app client**

```typescript
// src/lib/data-sources/sectors.ts
export interface FundamentalsPoint {
  period: string;
  revenue: number | null;
  net_profit: number | null;
  total_assets: number | null;
}

// Confirmed only: base URL https://api.sectors.app/v2/ and header-based
// auth (docs.sectors.app, spec §8). The exact report path and field names
// are behind the Insider-plan docs - confirm and adjust the fetch URL and
// the `body.financials` read below once the team has API access; nothing
// else in this file or its callers depends on the exact shape.
export async function fetchLatestFundamentals(ticker: string): Promise<FundamentalsPoint> {
  const apiKey = process.env.SECTORS_API_KEY;
  if (!apiKey) throw new Error("SECTORS_API_KEY is not set");

  const response = await fetch(`https://api.sectors.app/v2/company/report/${ticker}/`, {
    headers: { Authorization: apiKey },
  });
  if (!response.ok) {
    throw new Error(`Sectors.app fundamentals fetch failed for ${ticker}: ${response.status} ${response.statusText}`);
  }
  const body = (await response.json()) as { financials: FundamentalsPoint };
  return body.financials;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/data-sources/sectors.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the Job 2 route**

```typescript
// tests/api/cron-fundamentals.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/companies", () => ({
  COMPANIES: [{ ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 }],
}));

vi.mock("@/lib/data-sources/sectors", () => ({
  fetchLatestFundamentals: vi
    .fn()
    .mockResolvedValue({ period: "FY2025", revenue: 100000, net_profit: 15000, total_assets: 900000 }),
}));

const insertMock = vi.fn().mockResolvedValue({ error: null });
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
const supabaseFromMock = vi.fn(() => ({
  select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: maybeSingleMock }) }) }) }) }),
  insert: insertMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => ({ from: supabaseFromMock }),
}));

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
  insertMock.mockClear();
});

describe("GET /api/cron/fundamentals", () => {
  it("rejects requests without the cron bearer token", async () => {
    const { GET } = await import("@/app/api/cron/fundamentals/route");
    const response = await GET(new NextRequest("http://localhost/api/cron/fundamentals"));
    expect(response.status).toBe(401);
  });

  it("upserts fundamentals with status=verified", async () => {
    const { GET } = await import("@/app/api/cron/fundamentals/route");
    const request = new NextRequest("http://localhost/api/cron/fundamentals", {
      headers: { authorization: "Bearer test-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: "BBRI",
        period: "FY2025",
        extraction_method: "api",
        status: "verified",
      }),
    );
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/api/cron-fundamentals.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/cron/fundamentals/route'`

- [ ] **Step 7: Implement the Job 2 route**

```typescript
// src/app/api/cron/fundamentals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { COMPANIES } from "@/lib/companies";
import { fetchLatestFundamentals } from "@/lib/data-sources/sectors";
import { checkFinancialAnomaly, type FinancialFigures } from "@/lib/validation/financials";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  const supabase = createServiceRoleClient();
  const results: { ticker: string; ok: boolean; reason?: string }[] = [];

  for (const company of COMPANIES) {
    try {
      const fundamentals = await fetchLatestFundamentals(company.ticker);

      const { data: previous } = await supabase
        .from("financial_reports")
        .select("revenue, net_profit, total_assets")
        .eq("ticker", company.ticker)
        .eq("extraction_method", "api")
        .order("as_of_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const anomaly = checkFinancialAnomaly(fundamentals, previous as FinancialFigures | null);

      // Job 2's source is a vetted data vendor - it auto-publishes even
      // when flagged, unlike Job 3 (spec §4.5). The anomaly is still
      // recorded in the response for visibility.
      await supabase.from("financial_reports").insert({
        ticker: company.ticker,
        period: fundamentals.period,
        revenue: fundamentals.revenue,
        net_profit: fundamentals.net_profit,
        total_assets: fundamentals.total_assets,
        source_url: `https://sectors.app/company/${company.ticker}`,
        extraction_method: "api",
        as_of_date: new Date().toISOString().slice(0, 10),
        extracted_at: new Date().toISOString(),
        status: "verified",
      });
      results.push({
        ticker: company.ticker,
        ok: true,
        reason: anomaly.anomalous ? anomaly.reasons.join("; ") : undefined,
      });
    } catch (error) {
      results.push({ ticker: company.ticker, ok: false, reason: (error as Error).message });
    }
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/api/cron-fundamentals.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/data-sources/sectors.ts src/app/api/cron/fundamentals/route.ts tests/lib/data-sources/sectors.test.ts tests/api/cron-fundamentals.test.ts
git commit -m "feat: add Job 2 structured fundamentals ingestion cron route"
```

---

### Task 8: Job 3 — AI-Extraction with Review Gate

**Files:**
- Create: `src/lib/data-sources/document-text.ts`, `src/lib/data-sources/claude-extract.ts`, `src/app/api/cron/extract/route.ts`
- Test: `tests/lib/data-sources/document-text.test.ts`, `tests/lib/data-sources/claude-extract.test.ts`, `tests/api/cron-extract.test.ts`

**Interfaces:**
- Consumes: `assertCronAuthorized` (Task 6), `COMPANIES` (Task 2), `checkFinancialAnomaly` (Task 5), `createServiceRoleClient` (Task 3), the `document_sources` table (Task 2).
- Produces: `fetchDocumentText(url: string): Promise<string>`, `extractFinancialsFromDocument(documentText: string, companyName: string): Promise<ExtractedFinancials>`.

- [ ] **Step 1: Write the failing test for document text extraction**

```typescript
// tests/lib/data-sources/document-text.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "Laporan Keuangan Tahunan 2025..." }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchDocumentText", () => {
  it("downloads a PDF and returns its extracted text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    );
    const { fetchDocumentText } = await import("@/lib/data-sources/document-text");
    const text = await fetchDocumentText("https://example.com/report.pdf");
    expect(text).toBe("Laporan Keuangan Tahunan 2025...");
  });

  it("throws when the download fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" }));
    const { fetchDocumentText } = await import("@/lib/data-sources/document-text");
    await expect(fetchDocumentText("https://example.com/missing.pdf")).rejects.toThrow("404");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/data-sources/document-text.test.ts`
Expected: FAIL — `Cannot find module '@/lib/data-sources/document-text'`

- [ ] **Step 3: Implement document text extraction**

```typescript
// src/lib/data-sources/document-text.ts
import pdfParse from "pdf-parse";

export async function fetchDocumentText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to download document at ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/data-sources/document-text.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the Claude extraction client**

```typescript
// tests/lib/data-sources/claude-extract.test.ts
import { describe, it, expect, vi } from "vitest";

const parseMock = vi.fn().mockResolvedValue({
  parsed_output: {
    period: "FY2025",
    revenue: 100000,
    net_profit: 15000,
    total_assets: 900000,
    found_in_document: true,
  },
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({ messages: { parse: parseMock } })),
}));

describe("extractFinancialsFromDocument", () => {
  it("returns the parsed structured output", async () => {
    const { extractFinancialsFromDocument } = await import("@/lib/data-sources/claude-extract");
    const result = await extractFinancialsFromDocument("laporan tahunan teks...", "Bank Rakyat Indonesia");
    expect(result).toEqual({
      period: "FY2025",
      revenue: 100000,
      net_profit: 15000,
      total_assets: 900000,
      found_in_document: true,
    });
    expect(parseMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-5" }),
    );
  });

  it("throws when Claude returns no parseable output", async () => {
    parseMock.mockResolvedValueOnce({ parsed_output: null });
    const { extractFinancialsFromDocument } = await import("@/lib/data-sources/claude-extract");
    await expect(extractFinancialsFromDocument("teks...", "Bank Mandiri")).rejects.toThrow(
      "did not return parseable",
    );
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/lib/data-sources/claude-extract.test.ts`
Expected: FAIL — `Cannot find module '@/lib/data-sources/claude-extract'`

- [ ] **Step 7: Implement the Claude extraction client**

```typescript
// src/lib/data-sources/claude-extract.ts
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export const ExtractedFinancialsSchema = z.object({
  period: z.string().describe("Reporting period, e.g. 'FY2025' or 'Q3-2026'"),
  revenue: z.number().nullable().describe("Total revenue in IDR, null if not stated in the document"),
  net_profit: z.number().nullable().describe("Net profit / laba bersih in IDR, null if not stated"),
  total_assets: z.number().nullable().describe("Total assets / total aset in IDR, null if not stated"),
  found_in_document: z.boolean().describe("false if the document does not contain these figures at all"),
});
export type ExtractedFinancials = z.infer<typeof ExtractedFinancialsSchema>;

export async function extractFinancialsFromDocument(
  documentText: string,
  companyName: string,
): Promise<ExtractedFinancials> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You extract financial figures from official Indonesian company filings. " +
      "Only report numbers explicitly stated in the document - never estimate or infer. " +
      "If a figure is not present, set it to null and set found_in_document accordingly.",
    messages: [
      { role: "user", content: `Company: ${companyName}\n\nDocument text:\n${documentText}` },
    ],
    output_config: { format: zodOutputFormat(ExtractedFinancialsSchema) },
  });
  if (!response.parsed_output) {
    throw new Error(`Claude did not return parseable structured output for ${companyName}`);
  }
  return response.parsed_output;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/lib/data-sources/claude-extract.test.ts`
Expected: PASS

- [ ] **Step 9: Write the failing test for the Job 3 route**

```typescript
// tests/api/cron-extract.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/companies", () => ({
  COMPANIES: [{ ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 }],
}));

vi.mock("@/lib/data-sources/document-text", () => ({
  fetchDocumentText: vi.fn().mockResolvedValue("laporan tahunan teks..."),
}));

vi.mock("@/lib/data-sources/claude-extract", () => ({
  extractFinancialsFromDocument: vi.fn().mockResolvedValue({
    period: "FY2025",
    revenue: 100000,
    net_profit: 15000,
    total_assets: 900000,
    found_in_document: true,
  }),
}));

const insertMock = vi.fn().mockResolvedValue({ error: null });
const pendingDocs = [{ ticker: "BBRI", period: "FY2025", source_url: "https://example.com/bbri-fy2025.pdf" }];
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null });
const supabaseFromMock = vi.fn((table: string) => {
  if (table === "document_sources") {
    return { select: () => ({ not: () => Promise.resolve({ data: pendingDocs }) }) };
  }
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({ maybeSingle: maybeSingleMock, order: () => ({ limit: () => ({ maybeSingle: maybeSingleMock }) }) }),
      }),
    }),
    insert: insertMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => ({ from: supabaseFromMock }),
}));

beforeEach(() => {
  process.env.CRON_SECRET = "test-secret";
  insertMock.mockClear();
});

describe("GET /api/cron/extract", () => {
  it("rejects requests without the cron bearer token", async () => {
    const { GET } = await import("@/app/api/cron/extract/route");
    const response = await GET(new NextRequest("http://localhost/api/cron/extract"));
    expect(response.status).toBe(401);
  });

  it("always inserts extracted figures with status=needs_review", async () => {
    const { GET } = await import("@/app/api/cron/extract/route");
    const request = new NextRequest("http://localhost/api/cron/extract", {
      headers: { authorization: "Bearer test-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: "BBRI",
        period: "FY2025",
        extraction_method: "ai",
        status: "needs_review",
        source_url: "https://example.com/bbri-fy2025.pdf",
      }),
    );
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- tests/api/cron-extract.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/cron/extract/route'`

- [ ] **Step 11: Implement the Job 3 route**

```typescript
// src/app/api/cron/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { COMPANIES } from "@/lib/companies";
import { fetchDocumentText } from "@/lib/data-sources/document-text";
import { extractFinancialsFromDocument } from "@/lib/data-sources/claude-extract";
import { checkFinancialAnomaly, type FinancialFigures } from "@/lib/validation/financials";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface PendingDocument {
  ticker: string;
  period: string;
  source_url: string;
}

export async function GET(request: NextRequest) {
  const unauthorized = assertCronAuthorized(request);
  if (unauthorized) return unauthorized;

  const supabase = createServiceRoleClient();
  const { data: pending } = await supabase
    .from("document_sources")
    .select("ticker, period, source_url")
    .not("source_url", "is", null);

  const results: { ticker: string; period: string; ok: boolean; reason?: string }[] = [];

  for (const doc of (pending ?? []) as PendingDocument[]) {
    try {
      const { data: existing } = await supabase
        .from("financial_reports")
        .select("id")
        .eq("ticker", doc.ticker)
        .eq("period", doc.period)
        .eq("extraction_method", "ai")
        .maybeSingle();
      if (existing) {
        results.push({ ticker: doc.ticker, period: doc.period, ok: true, reason: "already extracted" });
        continue;
      }

      const documentText = await fetchDocumentText(doc.source_url);
      const company = COMPANIES.find((c) => c.ticker === doc.ticker);
      const extracted = await extractFinancialsFromDocument(documentText, company?.name ?? doc.ticker);

      const { data: previousApi } = await supabase
        .from("financial_reports")
        .select("revenue, net_profit, total_assets")
        .eq("ticker", doc.ticker)
        .eq("extraction_method", "api")
        .order("as_of_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const anomaly = checkFinancialAnomaly(extracted, previousApi as FinancialFigures | null);

      // Always needs_review for the AI-extraction path, anomaly or not -
      // human approval is the only way this reaches the dashboard (spec §4.5).
      await supabase.from("financial_reports").insert({
        ticker: doc.ticker,
        period: doc.period,
        revenue: extracted.revenue,
        net_profit: extracted.net_profit,
        total_assets: extracted.total_assets,
        source_url: doc.source_url,
        extraction_method: "ai",
        as_of_date: new Date().toISOString().slice(0, 10),
        extracted_at: new Date().toISOString(),
        status: "needs_review",
      });
      results.push({
        ticker: doc.ticker,
        period: doc.period,
        ok: true,
        reason: anomaly.anomalous ? anomaly.reasons.join("; ") : undefined,
      });
    } catch (error) {
      results.push({ ticker: doc.ticker, period: doc.period, ok: false, reason: (error as Error).message });
    }
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test -- tests/api/cron-extract.test.ts`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add src/lib/data-sources/document-text.ts src/lib/data-sources/claude-extract.ts src/app/api/cron/extract/route.ts tests/lib/data-sources/document-text.test.ts tests/lib/data-sources/claude-extract.test.ts tests/api/cron-extract.test.ts
git commit -m "feat: add Job 3 AI-extraction cron route with mandatory review gate"
```

---

### Task 9: Reusable UI — StatusBadge & StaleIndicator

**Files:**
- Create: `src/components/StatusBadge.tsx`, `src/components/StaleIndicator.tsx`
- Test: `tests/components/StatusBadge.test.tsx`, `tests/components/StaleIndicator.test.tsx`

**Interfaces:**
- Produces: `<StatusBadge status="verified" | "needs_review" />` and `<StaleIndicator lastUpdatedAt={string | null} />` — consumed by Tasks 10 and 12.

- [ ] **Step 1: Write the failing test for StatusBadge**

```typescript
// tests/components/StatusBadge.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders 'Terverifikasi' for verified", () => {
    render(<StatusBadge status="verified" />);
    expect(screen.getByText("Terverifikasi")).toBeInTheDocument();
  });

  it("renders 'Menunggu Review' for needs_review", () => {
    render(<StatusBadge status="needs_review" />);
    expect(screen.getByText("Menunggu Review")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/StatusBadge.test.tsx`
Expected: FAIL — `Cannot find module '@/components/StatusBadge'`

- [ ] **Step 3: Implement StatusBadge**

```tsx
// src/components/StatusBadge.tsx
export function StatusBadge({ status }: { status: "verified" | "needs_review" }) {
  const label = status === "verified" ? "Terverifikasi" : "Menunggu Review";
  return <span className={`status-badge status-badge--${status}`}>{label}</span>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/StatusBadge.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test for StaleIndicator**

```typescript
// tests/components/StaleIndicator.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaleIndicator } from "@/components/StaleIndicator";

describe("StaleIndicator", () => {
  it("shows the last-updated time when given", () => {
    render(<StaleIndicator lastUpdatedAt="2026-09-23T09:15:00.000Z" />);
    expect(screen.getByText(/Data terakhir diperbarui/)).toBeInTheDocument();
  });

  it("shows a clear message when there is no data yet", () => {
    render(<StaleIndicator lastUpdatedAt={null} />);
    expect(screen.getByText(/Belum ada data harga/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/components/StaleIndicator.test.tsx`
Expected: FAIL — `Cannot find module '@/components/StaleIndicator'`

- [ ] **Step 7: Implement StaleIndicator**

```tsx
// src/components/StaleIndicator.tsx
export function StaleIndicator({ lastUpdatedAt }: { lastUpdatedAt: string | null }) {
  if (!lastUpdatedAt) {
    return <p className="stale-indicator stale-indicator--empty">Belum ada data harga untuk saham ini.</p>;
  }
  const formatted = new Date(lastUpdatedAt).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return <p className="stale-indicator">Data terakhir diperbarui: {formatted}</p>;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/components/StaleIndicator.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/StatusBadge.tsx src/components/StaleIndicator.tsx tests/components/
git commit -m "feat: add StatusBadge and StaleIndicator components"
```

---

### Task 10: Dashboard Overview Page

**Files:**
- Create: `src/app/page.tsx` (replaces the Task 1 placeholder)
- Test: `tests/app/page.test.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 3), `COMPANIES` (Task 2), `StaleIndicator` (Task 9).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/app/page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const fromMock = vi.fn((table: string) => {
  if (table === "price_snapshots") {
    return {
      select: () => ({
        order: () => Promise.resolve({
          data: [{ ticker: "BBRI", price: 3040, captured_at: "2026-09-23T09:15:00.000Z" }],
        }),
      }),
    };
  }
  return { select: () => Promise.resolve({ data: [] }) };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ from: fromMock }),
}));

vi.mock("@/lib/companies", () => ({
  COMPANIES: [{ ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 }],
}));

describe("DashboardOverviewPage", () => {
  it("lists every company with its latest known price", async () => {
    const { default: Page } = await import("@/app/page");
    render(await Page());
    expect(screen.getByText("Bank Rakyat Indonesia")).toBeInTheDocument();
    expect(screen.getByText(/3.040|3040/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/app/page.test.tsx`
Expected: FAIL — page still renders the Task 1 scaffold placeholder, not company names.

- [ ] **Step 3: Implement the overview page**

```tsx
// src/app/page.tsx
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { COMPANIES } from "@/lib/companies";
import { StaleIndicator } from "@/components/StaleIndicator";

interface LatestPriceRow {
  ticker: string;
  price: number;
  captured_at: string;
}

export default async function DashboardOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("price_snapshots")
    .select("ticker, price, captured_at")
    .order("captured_at", { ascending: false });

  const latestByTicker = new Map<string, LatestPriceRow>();
  for (const row of (data ?? []) as LatestPriceRow[]) {
    if (!latestByTicker.has(row.ticker)) latestByTicker.set(row.ticker, row);
  }

  return (
    <main>
      <h1>Danantara Market Intelligence</h1>
      <p>Harga saham 13 perusahaan under Danantara — delay ~15 menit.</p>
      <table>
        <thead>
          <tr>
            <th>Perusahaan</th>
            <th>Ticker</th>
            <th>Harga Terakhir</th>
            <th>Update Terakhir</th>
          </tr>
        </thead>
        <tbody>
          {COMPANIES.map((company) => {
            const latest = latestByTicker.get(company.ticker);
            return (
              <tr key={company.ticker}>
                <td>
                  <Link href={`/company/${company.ticker}`}>{company.name}</Link>
                </td>
                <td>{company.ticker}</td>
                <td>{latest ? latest.price.toLocaleString("id-ID") : "—"}</td>
                <td>
                  <StaleIndicator lastUpdatedAt={latest?.captured_at ?? null} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/app/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx tests/app/page.test.tsx
git commit -m "feat: add dashboard overview page listing all 13 companies"
```

---

### Task 11: Company Detail Page — Price Chart & Financial Reports

**Files:**
- Create: `src/components/PriceChart.tsx`, `src/components/FinancialReportCard.tsx`, `src/app/company/[ticker]/page.tsx`
- Test: `tests/components/PriceChart.test.tsx`, `tests/components/FinancialReportCard.test.tsx`, `tests/app/company-page.test.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient` (Task 3), `COMPANIES` (Task 2), `StatusBadge`, `StaleIndicator` (Task 9).
- Produces: `<PriceChart data={{ capturedAt: string; price: number }[]} />`, `<FinancialReportCard report={FinancialReportRow} />`.

- [ ] **Step 1: Write the failing test for FinancialReportCard**

```typescript
// tests/components/FinancialReportCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinancialReportCard } from "@/components/FinancialReportCard";

describe("FinancialReportCard", () => {
  it("shows the period, figures, status, and a link to the source", () => {
    render(
      <FinancialReportCard
        report={{
          period: "FY2025",
          revenue: 100000,
          net_profit: 15000,
          total_assets: 900000,
          source_url: "https://idx.co.id/report.pdf",
          status: "verified",
        }}
      />,
    );
    expect(screen.getByText("FY2025")).toBeInTheDocument();
    expect(screen.getByText("Terverifikasi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sumber/i })).toHaveAttribute("href", "https://idx.co.id/report.pdf");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/FinancialReportCard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/FinancialReportCard'`

- [ ] **Step 3: Implement FinancialReportCard**

```tsx
// src/components/FinancialReportCard.tsx
import { StatusBadge } from "@/components/StatusBadge";

export interface FinancialReportRow {
  period: string;
  revenue: number | null;
  net_profit: number | null;
  total_assets: number | null;
  source_url: string;
  status: "verified" | "needs_review";
}

function formatIdr(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("id-ID");
}

export function FinancialReportCard({ report }: { report: FinancialReportRow }) {
  return (
    <article className="financial-report-card">
      <header>
        <h3>{report.period}</h3>
        <StatusBadge status={report.status} />
      </header>
      <dl>
        <dt>Revenue</dt>
        <dd>{formatIdr(report.revenue)}</dd>
        <dt>Laba Bersih</dt>
        <dd>{formatIdr(report.net_profit)}</dd>
        <dt>Total Aset</dt>
        <dd>{formatIdr(report.total_assets)}</dd>
      </dl>
      <a href={report.source_url} target="_blank" rel="noreferrer">
        Sumber
      </a>
    </article>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/FinancialReportCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Write the failing test for PriceChart**

```typescript
// tests/components/PriceChart.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PriceChart } from "@/components/PriceChart";

describe("PriceChart", () => {
  it("renders without crashing given price history", () => {
    const { container } = render(
      <PriceChart
        data={[
          { capturedAt: "2026-09-23T09:00:00.000Z", price: 3000 },
          { capturedAt: "2026-09-23T09:15:00.000Z", price: 3040 },
        ]}
      />,
    );
    expect(container.querySelector(".recharts-responsive-container")).not.toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/components/PriceChart.test.tsx`
Expected: FAIL — `Cannot find module '@/components/PriceChart'`

- [ ] **Step 7: Implement PriceChart**

```tsx
// src/components/PriceChart.tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface PricePoint {
  capturedAt: string;
  price: number;
}

export function PriceChart({ data }: { data: PricePoint[] }) {
  const chartData = data.map((point) => ({
    time: new Date(point.capturedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    price: point.price,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" />
        <YAxis domain={["auto", "auto"]} />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#3F52C7" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/components/PriceChart.test.tsx`
Expected: PASS

- [ ] **Step 9: Write the failing test for the company detail page**

```typescript
// tests/app/company-page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const fromMock = vi.fn((table: string) => {
  if (table === "price_snapshots") {
    return {
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({
            data: [{ price: 3040, captured_at: "2026-09-23T09:15:00.000Z" }],
          }),
        }),
      }),
    };
  }
  return {
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({
          data: [
            {
              period: "FY2025", revenue: 100000, net_profit: 15000, total_assets: 900000,
              source_url: "https://idx.co.id/report.pdf", status: "verified",
            },
          ],
        }),
      }),
    }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ from: fromMock }),
}));

vi.mock("@/lib/companies", () => ({
  COMPANIES: [{ ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Perbankan", pctSharesTransferred: 53.19 }],
}));

describe("CompanyDetailPage", () => {
  it("renders the company name, chart, and financial report cards", async () => {
    const { default: Page } = await import("@/app/company/[ticker]/page");
    render(await Page({ params: Promise.resolve({ ticker: "BBRI" }) }));
    expect(screen.getByText("Bank Rakyat Indonesia")).toBeInTheDocument();
    expect(screen.getByText("FY2025")).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- tests/app/company-page.test.tsx`
Expected: FAIL — `Cannot find module '@/app/company/[ticker]/page'`

- [ ] **Step 11: Implement the company detail page**

```tsx
// src/app/company/[ticker]/page.tsx
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { COMPANIES } from "@/lib/companies";
import { PriceChart } from "@/components/PriceChart";
import { FinancialReportCard, type FinancialReportRow } from "@/components/FinancialReportCard";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const company = COMPANIES.find((c) => c.ticker === ticker);
  if (!company) notFound();

  const supabase = await createServerSupabaseClient();

  const { data: priceRows } = await supabase
    .from("price_snapshots")
    .select("price, captured_at")
    .eq("ticker", ticker)
    .order("captured_at", { ascending: true });

  const { data: reportRows } = await supabase
    .from("financial_reports")
    .select("period, revenue, net_profit, total_assets, source_url, status")
    .eq("ticker", ticker)
    .order("as_of_date", { ascending: false });

  const priceData = ((priceRows ?? []) as { price: number; captured_at: string }[]).map((row) => ({
    capturedAt: row.captured_at,
    price: row.price,
  }));

  return (
    <main>
      <h1>{company.name}</h1>
      <p>{company.ticker} — {company.sector}</p>
      <PriceChart data={priceData} />
      <section>
        <h2>Laporan Keuangan</h2>
        {((reportRows ?? []) as FinancialReportRow[]).map((report) => (
          <FinancialReportCard key={report.period} report={report} />
        ))}
      </section>
    </main>
  );
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test -- tests/app/company-page.test.tsx`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add src/components/PriceChart.tsx src/components/FinancialReportCard.tsx src/app/company/ tests/components/PriceChart.test.tsx tests/components/FinancialReportCard.test.tsx tests/app/company-page.test.tsx
git commit -m "feat: add company detail page with price chart and financial report cards"
```

---

### Task 12: Reviewer Approval Page

**Files:**
- Create: `src/app/review/page.tsx`, `src/app/review/actions.ts`
- Test: `tests/lib/review-actions.test.ts`

**Interfaces:**
- Consumes: `createServiceRoleClient`, `createServerSupabaseClient` (Task 3), `StatusBadge` (Task 9).
- Produces: `approveFinancialReport(id: number): Promise<void>` server action.

- [ ] **Step 1: Write the failing test for the approve action**

```typescript
// tests/lib/review-actions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const fromMock = vi.fn(() => ({ update: updateMock }));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: () => ({ from: fromMock }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  updateMock.mockClear();
});

describe("approveFinancialReport", () => {
  it("sets status to verified for the given report id", async () => {
    const { approveFinancialReport } = await import("@/app/review/actions");
    await approveFinancialReport(42);
    expect(fromMock).toHaveBeenCalledWith("financial_reports");
    expect(updateMock).toHaveBeenCalledWith({ status: "verified" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lib/review-actions.test.ts`
Expected: FAIL — `Cannot find module '@/app/review/actions'`

- [ ] **Step 3: Implement the approve action**

```typescript
// src/app/review/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function approveFinancialReport(id: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("financial_reports").update({ status: "verified" }).eq("id", id);
  if (error) throw new Error(`failed to approve financial_reports.id=${id}: ${error.message}`);
  revalidatePath("/review");
  revalidatePath("/company/[ticker]", "page");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lib/review-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Implement the reviewer page**

This page reads with the service-role client since RLS hides `needs_review` rows from the normal authenticated policy (Task 2) — access is still gated by the login-wide middleware (Task 4), matching spec §1's single-role model.

```tsx
// src/app/review/page.tsx
import { createServiceRoleClient } from "@/lib/supabase/server";
import { approveFinancialReport } from "@/app/review/actions";

interface PendingReport {
  id: number;
  ticker: string;
  period: string;
  revenue: number | null;
  net_profit: number | null;
  total_assets: number | null;
  source_url: string;
}

export default async function ReviewPage() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("financial_reports")
    .select("id, ticker, period, revenue, net_profit, total_assets, source_url")
    .eq("status", "needs_review")
    .order("extracted_at", { ascending: true });

  const pending = (data ?? []) as PendingReport[];

  return (
    <main>
      <h1>Review Data Hasil AI-Extraction</h1>
      {pending.length === 0 && <p>Tidak ada data yang menunggu review.</p>}
      {pending.map((report) => (
        <article key={report.id}>
          <h2>
            {report.ticker} — {report.period}
          </h2>
          <p>Revenue: {report.revenue?.toLocaleString("id-ID") ?? "—"}</p>
          <p>Laba Bersih: {report.net_profit?.toLocaleString("id-ID") ?? "—"}</p>
          <p>Total Aset: {report.total_assets?.toLocaleString("id-ID") ?? "—"}</p>
          <a href={report.source_url} target="_blank" rel="noreferrer">
            Cek sumber
          </a>
          <form
            action={async () => {
              "use server";
              await approveFinancialReport(report.id);
            }}
          >
            <button type="submit">Approve</button>
          </form>
        </article>
      ))}
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/review/ tests/lib/review-actions.test.ts
git commit -m "feat: add reviewer approval page for needs_review financial reports"
```

---

### Task 13: Vercel Cron Wiring & Deployment Config

**Files:**
- Create: `vercel.json`
- Modify: `.env.example` (confirm all vars from Tasks 1–12 are listed)

**Interfaces:**
- Consumes: the three cron routes from Tasks 6, 7, 8.
- Produces: a deployable Vercel project with scheduled invocations.

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/prices", "schedule": "*/15 2-9 * * 1-5" },
    { "path": "/api/cron/fundamentals", "schedule": "0 3 * * 1" },
    { "path": "/api/cron/extract", "schedule": "0 4 * * 1" }
  ]
}
```

The prices schedule (`*/15 2-9 * * 1-5`) runs every 15 minutes, hours 02:00–09:59 UTC, Monday–Friday — 09:00–16:59 WIB (UTC+7), covering IDX trading hours. Vercel Cron sends requests with `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set as a project environment variable — no extra header config needed here.

- [ ] **Step 2: Verify env vars are complete**

Run: `grep -c '=' .env.example`
Expected: `9` (the 9 variables introduced across Tasks 1, 3, 6, 7, 8: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `GOAPI_BASE_URL`, `GOAPI_API_KEY`, `SECTORS_API_KEY`, `ANTHROPIC_API_KEY`).

- [ ] **Step 3: Deploy and smoke-test**

Run: `npx vercel --prod` (after setting all env vars in the Vercel project dashboard, and running the Task 2 migration against the production Supabase project).
Run: `curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment-url>/api/cron/prices`
Expected: `{"results":[...13 entries...]}` with `"ok":true` for each ticker once a real `GOAPI_API_KEY` is configured (Task 6's isolated-uncertainty note applies here — adjust `src/lib/data-sources/goapi.ts` first if the real API shape differs from the assumed one).

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "chore: configure Vercel Cron schedules for the three ingestion jobs"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (goals/non-goals) → Tasks 4, 10 enforce login-only/no-export. §2 (13-company list) → Task 2. §3 (architecture) → Tasks 1, 6, 7, 8, 13 (single repo, Vercel Cron, no separate service). §4.1 (frontend) → Tasks 4, 9, 10, 11. §4.2 (schema) → Task 2. §4.3 (price source, ~15min delay) → Tasks 6, 10 (`StaleIndicator` + honest delay copy). §4.4 (financial sources, verified vs needs_review) → Tasks 7, 8. §5 (error handling/data trust) → Task 5 (anomaly/sanity checks), Task 6 (no overwrite on failed fetch — insert only on success), Task 9 (`StaleIndicator`), Task 8 (mandatory `needs_review`). §6 (testing) → every task is TDD; Task 13 Step 3 covers the pre-go-live manual check called for in spec §6. §7 (deployment) → Task 13. §4.5/Tanya AI is explicitly excluded per this plan's header — separate plan.
- **Placeholder scan:** no TBD/TODO in any code block. The two genuinely unconfirmed external API shapes (GOAPI.io, Sectors.app) are isolated to one fetch call and one parse line each, called out in prose (not left as vague code), and covered by tests against the assumed shape so a later adjustment has a regression test to update, not a blind rewrite.
- **Type consistency:** `Company` (Task 2) is used identically in Tasks 6, 7, 8, 9, 10, 11. `FinancialFigures` (Task 5) matches the fields read/written in Tasks 7 and 8. `FinancialReportRow` (Task 11) matches the columns selected in Task 11's page query and Task 12's reviewer query. `assertCronAuthorized` (Task 6) is imported unchanged by Tasks 7 and 8 — no renamed variant introduced later.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-23-danantara-dashboard-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
