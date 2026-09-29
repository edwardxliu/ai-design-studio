# Midea AI Content Demo

Local Next.js demo for a product-marketing AI assistant workflow:

- upload-ready product intake for arbitrary user product assets
- category-agnostic product profile data
- editable POP templates
- POP-on-product realistic scene generation through an image provider
- dynamic PDP long-image composition from selling points
- localization variants and resource traceability

## Local Setup

Node.js `24.13.0` is pinned in `.nvmrc` so Windows and macOS use the same runtime. pnpm `11.7.0` remains the lockfile package manager.

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.7.0 --activate
rm -rf node_modules .next
pnpm install --frozen-lockfile
pnpm dev
```

On Windows, if pnpm reports `EPERM` while renaming package `_tmp_` directories, use Node 24 with `npm install --no-package-lock --cache=.npm-cache` and start with `npm run dev`. On macOS, continue using `pnpm install --frozen-lockfile` and `pnpm dev`.

Open `http://127.0.0.1:3000`.

## OpenAI Image Mode

Set `.env.local`:

```txt
OPENAI_API_KEY=your_key
OPENAI_IMAGE_MODEL=gpt-image-2
DEMO_USE_MOCK=false
```

When `DEMO_USE_MOCK=true` or no API key is configured, the image provider returns deterministic mock outputs so the live demo remains stable. When OpenAI returns base64 image data, the app saves it under `public/generated/` and returns a local URL.

## macOS Network Troubleshooting

`fetch failed` means the request did not reach an HTTP response. Check whether the selected provider is OpenAI or Doubao, then verify its proxy setting.

```bash
# Show project proxy/base URL settings without printing API keys.
grep -E '^(OPENAI_BASE_URL|OPENAI_PROXY_URL|ARK_BASE_URL|ARK_PROXY_URL)=' .env.local

# Show proxy variables inherited from the shell.
env | grep -Ei '^(http_proxy|https_proxy|all_proxy)='

# Replace 10808 with the configured local HTTP or mixed proxy port.
lsof -nP -iTCP:10808 -sTCP:LISTEN
curl -x http://127.0.0.1:10808 -I https://api.openai.com/v1/models
```

An HTTP `401` from the last command proves that the network path is working; the test intentionally sends no API key. `127.0.0.1` always means the current Mac, so a proxy URL copied from Windows only works when the Mac proxy application listens on the same port. The app accepts HTTP/HTTPS proxy endpoints, not SOCKS-only endpoints. Leave `OPENAI_PROXY_URL=` blank for a direct OpenAI connection, or set it to the Mac proxy application's HTTP/mixed port. Use `ARK_PROXY_URL` independently for Doubao. Restart `pnpm dev` after changing `.env.local`.
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
