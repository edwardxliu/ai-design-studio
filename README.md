# Midea AI Content Demo

Local Next.js demo for a product-marketing AI assistant workflow:

- upload-ready product intake for arbitrary user product assets
- category-agnostic product profile data
- editable POP templates
- POP-on-product realistic scene generation through an image provider
- dynamic PDP long-image composition from selling points
- localization variants and resource traceability

## Local Setup

```powershell
$env:Path='C:\Users\edward\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
pnpm install
pnpm build
pnpm start -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`.

## OpenAI Image Mode

Set `.env.local`:

```txt
OPENAI_API_KEY=your_key
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=false
```

When `DEMO_USE_MOCK=true` or no API key is configured, the image provider returns deterministic mock outputs so the live demo remains stable. When OpenAI returns base64 image data, the app saves it under `public/generated/` and returns a local URL.

## Demo Flow

1. `/intake`: upload product photos, brand rules, POP/PDP references, and feature images.
2. `/tasks`: show the generic generation task list.
3. `/pop`: edit POP text slots and generate a realistic POP-attached product scene.
4. `/pdp`: build a dynamic PDP from recognized selling points and export a long image SVG.
5. `/costs`: review live generation records and demo baseline cost rows.

## Local Output

- Uploaded assets: `public/uploads/`
- Generated images and PDP exports: `public/generated/`
- Manifest and cost ledger: `data/`

These runtime folders are ignored by Git.

## Useful Commands

```powershell
pnpm test
pnpm typecheck
pnpm build
```

See `docs/demo-runbook.md` for the onsite demo script.
