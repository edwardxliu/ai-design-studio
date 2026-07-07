# Midea AI Content Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js demo workspace that lets users upload or load product assets, edit POP/PDP templates, generate mock or OpenAI-backed outputs, and inspect resource usage.

**Architecture:** The app is a local B/S Next.js application. UI pages call local API routes/server utilities, which use typed domain services for profiles, POP/PDP templates, image generation, and cost records. AI image calls are isolated behind an `ImageProvider` with a deterministic mock fallback.

**Tech Stack:** Next.js App Router, TypeScript, React, Vitest, React Testing Library, local JSON/file-backed seed data, OpenAI SDK, lucide-react icons.

---

## File Structure

- Create `.gitignore` - ignore dependencies, build output, temp PDF renders, env files, and visual-companion cache.
- Create `.env.example` - document local OpenAI and demo mode variables.
- Create `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css` - base Next.js app and test setup.
- Create `src/domain/types.ts` - shared data model for projects, assets, profiles, tasks, templates, artifacts, and costs.
- Create `src/domain/demo-data.ts` - deterministic demo project and sample product profile, kept generic with Midea sample data only as seed.
- Create `src/domain/pdp.ts` and `src/domain/pdp.test.ts` - pure PDP document builder and export metadata logic.
- Create `src/domain/pop.ts` and `src/domain/pop.test.ts` - POP template defaults, slot editing, placement prompt builder.
- Create `src/domain/costs.ts` and `src/domain/costs.test.ts` - cost record and summary helpers.
- Create `src/services/image-provider.ts` and `src/services/image-provider.test.ts` - OpenAI/mock image provider boundary and fallback behavior.
- Create `src/components/AppShell.tsx`, `src/components/MetricCard.tsx`, `src/components/AssetPicker.tsx`, `src/components/OutputLabel.tsx` - shared UI primitives.
- Create `app/intake/page.tsx`, `app/tasks/page.tsx`, `app/pop/page.tsx`, `app/pdp/page.tsx`, `app/localization/page.tsx`, `app/costs/page.tsx` - demo pages.
- Create `app/api/generate/image/route.ts`, `app/api/pop/generate-scene/route.ts`, `app/api/pdp/build/route.ts`, `app/api/costs/route.ts` - local demo APIs.

## Task 1: Repository And Next.js Baseline

**Files:**
- Create: `.env.example`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Add environment example**

Create `.env.example`:

```txt
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=true
```

- [ ] **Step 2: Add package manifest**

Create `package.json`:

```json
{
  "name": "midea-ai-content-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "next": "^15.1.0",
    "openai": "^4.77.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Add TypeScript and test config**

Create `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, and `vitest.setup.ts` with strict TypeScript, `@/*` path alias, jsdom tests, and jest-dom setup.

- [ ] **Step 4: Add minimal app shell**

Create `app/layout.tsx`, `app/page.tsx`, and `app/globals.css` with a compact dashboard entry page and Midea-themed neutral styling.

- [ ] **Step 5: Install dependencies**

Run: `pnpm install`

Expected: dependencies installed and `pnpm-lock.yaml` created.

- [ ] **Step 6: Verify baseline**

Run: `pnpm test`

Expected: no tests found or 0 failing tests. If Vitest exits non-zero because no tests exist, add the domain test in Task 2 before treating test baseline as meaningful.

- [ ] **Step 7: Commit**

Run:

```bash
git add .gitignore .env.example package.json pnpm-lock.yaml tsconfig.json next.config.mjs vitest.config.ts vitest.setup.ts app
git commit -m "chore: initialize next demo app"
```

## Task 2: Domain Model And Demo Seed

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/demo-data.ts`
- Create: `src/domain/demo-data.test.ts`

- [ ] **Step 1: Write failing seed-data test**

Create `src/domain/demo-data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { demoProject, demoProducts } from "./demo-data";

describe("demo data", () => {
  it("keeps the platform product-category agnostic", () => {
    expect(demoProject.productIds.length).toBeGreaterThan(0);
    expect(demoProducts.every((product) => product.category !== "hardcoded-fridge")).toBe(true);
  });

  it("includes editable selling points for PDP generation", () => {
    const product = demoProducts[0];
    expect(product.profile.detectedFeatures.length).toBeGreaterThanOrEqual(3);
    expect(product.profile.detectedFeatures[0]).toHaveProperty("title");
    expect(product.profile.detectedFeatures[0]).toHaveProperty("benefit");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/domain/demo-data.test.ts`

Expected: FAIL because `src/domain/demo-data.ts` does not exist.

- [ ] **Step 3: Implement types and seed data**

Create `src/domain/types.ts` and `src/domain/demo-data.ts` with the types from the design spec and a demo Midea sample stored as generic `ProductWithProfile` records.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/domain/demo-data.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/types.ts src/domain/demo-data.ts src/domain/demo-data.test.ts
git commit -m "feat: add generic product domain model"
```

## Task 3: PDP Builder

**Files:**
- Create: `src/domain/pdp.test.ts`
- Create: `src/domain/pdp.ts`

- [ ] **Step 1: Write failing PDP tests**

Create tests that assert `buildPdpDocument()` creates a cover, one section per selected selling point, fills `blackTitle` from `shortLabel`, fills `narrowGrayText` from `benefit` or `technicalProof`, alternates layouts, and moves features beyond five into `moreFeatures`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/domain/pdp.test.ts`

Expected: FAIL because `buildPdpDocument` is missing.

- [ ] **Step 3: Implement PDP builder**

Create `src/domain/pdp.ts` with:

```ts
export function buildPdpDocument(input: BuildPdpInput): PdpDocument {
  const selected = input.sellingPoints
    .filter((point) => point.enabled !== false)
    .sort((a, b) => a.priority - b.priority);
  const sections = selected.slice(0, 5).map((point, index) => ({
    id: `pdp-section-${point.id}`,
    sellingPointId: point.id,
    order: index + 1,
    blackTitle: point.shortLabel || point.title,
    narrowGrayText: point.technicalProof || point.benefit,
    largeImageAssetId: input.sectionImageBySellingPointId[point.id],
    layout: index % 2 === 0 ? "image-right" : "image-left",
  }));
  return {
    id: input.id,
    productId: input.productId,
    country: input.country,
    language: input.language,
    templateVersion: input.templateVersion,
    cover: input.cover,
    sections,
    moreFeatures: selected.slice(5),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/domain/pdp.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/pdp.ts src/domain/pdp.test.ts
git commit -m "feat: build dynamic pdp documents"
```

## Task 4: POP Template And Prompt Builder

**Files:**
- Create: `src/domain/pop.test.ts`
- Create: `src/domain/pop.ts`

- [ ] **Step 1: Write failing POP tests**

Create tests that assert default POP templates contain editable text and image slots, `renderPopFlatPayload()` preserves user edits, and `buildPopScenePrompt()` mentions product preservation, chosen placement, realistic photography, and no extra text.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/domain/pop.test.ts`

Expected: FAIL because `src/domain/pop.ts` does not exist.

- [ ] **Step 3: Implement POP domain logic**

Create default templates and pure helpers:

```ts
export const defaultPopTemplates: PopTemplate[] = [
  {
    id: "main-sticker-feature",
    name: "Main Sticker - Feature",
    version: "1.0",
    aspectRatio: "4:5",
    placementHints: ["front panel", "door surface", "side panel"],
    slots: [
      { id: "headline", type: "text", label: "Headline", defaultValue: "Same size, bigger volume", maxLength: 48, editable: true },
      { id: "featureImage", type: "image", label: "Feature image", acceptedAssetTypes: ["feature-icon", "product-photo"], editable: true },
    ],
  },
];

export function buildPopScenePrompt(input: BuildPopScenePromptInput): string {
  return [
    `Create a realistic product photography image for ${input.productName}.`,
    `Attach the completed POP artwork to the ${input.placement}.`,
    "Preserve the product shape, logo, panel layout, color, proportions, and key physical details.",
    "Do not invent additional text; the POP artwork already contains the exact text.",
    "Use clean studio lighting and a believable retail display style.",
  ].join(" ");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/domain/pop.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/domain/pop.ts src/domain/pop.test.ts
git commit -m "feat: add editable pop templates"
```

## Task 5: Image Provider With Mock Fallback

**Files:**
- Create: `src/services/image-provider.test.ts`
- Create: `src/services/image-provider.ts`

- [ ] **Step 1: Write failing provider tests**

Create tests for:

- `createImageProvider({ forceMock: true })` returns deterministic mock URLs.
- `generateImage()` records `isFallback: true` when mock is used.
- provider does not require API key in mock mode.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/image-provider.test.ts`

Expected: FAIL because provider is missing.

- [ ] **Step 3: Implement provider boundary**

Create `ImageProvider`, `MockImageProvider`, and `OpenAIImageProvider`. The OpenAI implementation should be isolated so tests can use mock mode without network calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/image-provider.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/services/image-provider.ts src/services/image-provider.test.ts
git commit -m "feat: add image provider fallback"
```

## Task 6: Workbench UI Pages

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/MetricCard.tsx`
- Create: `src/components/OutputLabel.tsx`
- Modify: `app/page.tsx`
- Create: `app/intake/page.tsx`
- Create: `app/tasks/page.tsx`
- Create: `app/pop/page.tsx`
- Create: `app/pdp/page.tsx`
- Create: `app/localization/page.tsx`
- Create: `app/costs/page.tsx`

- [ ] **Step 1: Add component smoke tests**

Add minimal React Testing Library tests for shell navigation labels and PDP page text such as `Dynamic PDP Builder`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/components app`

Expected: FAIL because components/pages do not exist.

- [ ] **Step 3: Implement pages**

Implement a dense workbench UI with sidebar navigation, real demo data, POP template editor controls, PDP section list, and cost table. Keep UI local-state driven for demo reliability.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add app src/components
git commit -m "feat: build demo workbench pages"
```

## Task 7: API Routes And Verification

**Files:**
- Create: `app/api/generate/image/route.ts`
- Create: `app/api/pop/generate-scene/route.ts`
- Create: `app/api/pdp/build/route.ts`
- Create: `app/api/costs/route.ts`
- Create: `README.md`

- [ ] **Step 1: Add route tests or direct handler tests**

Test that API helpers return mock output when `DEMO_USE_MOCK=true` and PDP build returns sections from supplied selling points.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`

Expected: FAIL until routes/helpers exist.

- [ ] **Step 3: Implement routes and README**

Implement routes using domain helpers and image provider. Add README with local setup:

```bash
pnpm install
copy .env.example .env.local
pnpm dev
```

- [ ] **Step 4: Verify full project**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

Run:

```bash
git add app/api README.md
git commit -m "feat: add demo api routes"
```

