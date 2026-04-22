# ConferenceTracker

Scrapes 14 AI-in-libraries conference websites monthly for 2026 dates. Outputs compact `raw-data.json`. Claude reads it, analyzes, and builds `index.html`. Vercel serves it.

## Workflow
1. GitHub Action runs (1st of month or manual) → scrapes → commits `raw-data.json`
2. Tell Claude: "analyze and build" → reads `raw-data.json`, writes `index.html`
3. `git push` → Vercel auto-deploys → live at https://conference-tracker-seven.vercel.app

## Files
- `scrape.js` — fetches 14 sites, extracts 2026 dates, filters noise, saves `raw-data.json`
- `raw-data.json` — compact scraped data (~1.5KB): real dates only, 120-char snippets, noise pre-filtered
- `index.html` — Claude-built output, human-reviewed, pushed manually. Academic bulletin aesthetic: Playfair Display + Crimson Pro + IBM Plex Mono, parchment palette, Roman numeral sections, sharp left-border cards.
- `.github/workflows/monthly.yml` — scrapes on the 1st of each month + workflow_dispatch

## Run locally
```bash
node scrape.js       # → raw-data.json
# then tell Claude to analyze and build index.html
git add index.html && git push
```

## Sites tracked (14)
1. Internet Librarian Speakers (infotoday.com)
2. Charleston Conference CFP
3. ai4Libraries Schedule
4. GAIL Schedule (SHSU)
5. Library 2.0 Conferences
6. Library 2.0 Perspectives on AI
7. Amigos: AI-Enhanced Library
8. SAIL — Libraries and AI
9. AI & Academic Libraries (Eventbrite)
10. Lehigh AI Summit
11. Fantastic Futures 2026
12. ALIA National 2026
13. CARL 2026 Schedule
14. Brick & Click Libraries

## Scraper design
- Native `fetch`, no npm dependencies, Node 18+
- Noise filter drops LibGuide "Last Updated", post dates, article dates before saving
- JSON uses short keys (n/u/d/s) and single-line format to minimize Claude read tokens
- Empty sites stored as flat name list, not full objects

## Design system (index.html)
- Fonts: Playfair Display (headings/conf names), Crimson Pro (body), IBM Plex Mono (dates/labels)
- Palette: parchment `#F3EDE1` bg, navy `#1B2A4A`, gold `#9A6E1A`, crimson `#7C1A28`, amber `#8E4B15`
- Cards: sharp left accent border (4px, color-coded by urgency), no border-radius
- Sections: Roman numerals (I–IV) in italic gold
- Urgency: crimson border = ≤14 days, amber = ≤30 days, navy = future, dashed = noise/filtered
- Header: ornamental ✦ rule, kicker line, `◆` bottom divider, boxed meta cells
- Animation: staggered `riseIn` fadeUp per card

## Token optimization
raw-data.json is kept minimal so Claude's analysis pass is cheap:
- Short keys: `n` (name), `u` (url), `d` (date), `s` (snippet), `at` (date scraped)
- Snippets capped at 120 chars
- Noise pre-filtered in scraper (not passed to Claude)
- No-data sites as flat array of names only
