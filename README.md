# HackCamp2026 – Fridge to Recipe

Photograph your fridge, confirm what the app found, get recipes you can cook. See [GLOSSARY.md](GLOSSARY.md), [docs/adr](docs/adr) and [docs/TASKS.md](docs/TASKS.md).

| Folder | What |
|---|---|
| `app/` | Expo (SDK 58) app with Expo Router |
| `server/` | Hono server on Node; holds the Gemini key |
| `shared/` | TypeScript contracts used by both (`@fridge/shared`) |

## Setup

```bash
npm install
cp server/.env.example server/.env        # add GEMINI_API_KEY
cp app/.env.example app/.env.local        # point EXPO_PUBLIC_SERVER_URL at the server
npm run server                            # http://localhost:8787/health
npm run app                               # scan the QR code with Expo Go
```

Phones can't reach `localhost` on your computer: use its LAN IP, or the deployed URL.

## Checks

```bash
npm run typecheck
npm test
```

## Deploy (server)

`render.yaml` describes a free Render web service. In Render: New → Blueprint → this repo, then set `GEMINI_API_KEY`. Put the resulting `https://….onrender.com` URL in `app/.env.local`. Free instances sleep when idle, so open `/health` once before a demo.
