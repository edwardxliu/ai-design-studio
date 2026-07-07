# Midea AI Content Demo Runbook

## Local Start

```powershell
$env:Path='C:\Users\edward\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
pnpm install
pnpm build
pnpm start -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`.

## OpenAI Image Mode

Create `.env.local`:

```txt
OPENAI_API_KEY=your_key
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=false
```

For stable offline-style rehearsals, set `DEMO_USE_MOCK=true`.

## Demo Flow

1. Open `/intake`, upload any product photo or reference image, and show the saved local asset URL.
2. Open `/tasks`, explain that the same generic product profile drives all generation tasks.
3. Open `/pop`, edit POP copy, keep mock fallback on for a stable rehearsal or turn it off for OpenAI, then click `Generate Scene`.
4. Open `/pdp`, show that sections are generated from selling point count, then click `Export PDP`.
5. Open `/costs`, show live records above demo baseline rows.

## Local Output Locations

- Uploaded files: `public/uploads/`
- Generated images and PDP exports: `public/generated/`
- Asset manifest and cost ledger: `data/`

These folders are ignored by Git.
