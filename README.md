# Midea AI Content Demo

Local Next.js demo for a product-marketing AI assistant workflow:

- upload-ready product intake
- category-agnostic product profile data
- editable POP templates
- POP-on-product realistic scene generation through an image provider
- dynamic PDP long-image composition from selling points
- localization variants and resource traceability

## Local Setup

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## OpenAI Image Mode

Set `.env.local`:

```txt
OPENAI_API_KEY=your_key
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=false
```

When `DEMO_USE_MOCK=true` or no API key is configured, the image provider returns deterministic mock outputs so the live demo remains stable.

## Useful Commands

```powershell
pnpm test
pnpm typecheck
pnpm build
```

