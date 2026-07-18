# CampScout

CampScout is a lightweight browser-assisted accommodation availability scout.

It is designed to:

- search a curated registry of accommodation sources
- open each source with Playwright
- try safe, reversible search actions such as dates and guest counts
- capture screenshots as evidence
- classify results as verified available, verified unavailable, could not verify, or manual verification required
- stop before any booking, payment, or legally binding reservation step

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Playwright
- JSON file storage
- Zod
- Vitest

## Local development

```bash
npm install
npx playwright install chromium
npm run dev
```

Open http://localhost:3000

## Deploy for iPhone access

CampScout needs a Node.js server plus Chromium for the Playwright-backed scouting run, so this repository is configured for Docker deployment on Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Bjonki/ai-rejsen)

1. Open the deploy link above.
2. Connect your GitHub account and approve the `Bjonki/ai-rejsen` repository.
3. Let Render build and start the `campscout` web service from `/home/runner/work/ai-rejsen/ai-rejsen/render.yaml`.
4. Open the generated `https://<service>.onrender.com` URL on your iPhone.

Notes:

- The public app URL is created by Render during deployment, so it does not exist until you complete the first deploy.
- Scouting output is written to the container filesystem under `public/results/`, so those files persist until the service is rebuilt or restarted.

## CLI mode

```bash
npm run scout -- \
  --destination "Vallåsen" \
  --checkin "2026-07-20" \
  --checkout "2026-07-21" \
  --adults 2 \
  --children 8,5
```

Outputs are written to:

```text
public/results/<run-slug>/
  report.md
  results.json
  screenshots/
```

These files are also available from the browser at `/results/<run-slug>/...`.

## Safety boundaries

CampScout may:

- accept cookie banners
- enter dates and guest counts when fields are obvious
- follow booking-related links
- capture screenshots
- extract price and policy clues

CampScout must not:

- log into personal accounts
- enter payment details
- submit reservations
- accept binding terms
- bypass CAPTCHA or access controls
- claim verification when it could not verify the result

## Notes on the starter adapters

This implementation intentionally starts with honest, conservative adapters.

- Aggregator and tourism sources use discovery-first flows.
- When availability cannot be safely confirmed, results are marked `MANUAL_VERIFICATION_REQUIRED` or `COULD_NOT_VERIFY`.
- The adapter contract is ready for future source-specific upgrades without rewriting the app shell.
