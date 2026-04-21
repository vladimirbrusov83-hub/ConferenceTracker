# ConferenceTracker

Monthly scraper for AI-in-libraries conference websites — tracks 2026 dates and proposal deadlines. No API keys, no npm dependencies.

**Live:** https://conference-tracker-seven.vercel.app

---

## How it works

```
GitHub Action (1st of month or manual)
  → scrapes 14 sites → raw-data.json
  → Claude reads + analyzes → index.html
  → git push → Vercel deploys
```

The scraper does the heavy lifting: extracts only real 2026 dates, pre-filters noise (LibGuide "Last Updated" timestamps, post dates, article dates), and saves a compact ~1.5KB JSON. Claude then reads it, interprets context, and builds a clean HTML report.

---

## Sites tracked (14)

| Conference | URL |
|-----------|-----|
| Internet Librarian Speakers | speakers.infotoday.com |
| Charleston Conference CFP | charleston-hub.com |
| ai4Libraries Schedule | ai4libraries.org |
| GAIL Schedule (SHSU) | shsulibraryguides.org |
| Library 2.0 Conferences | library20.com |
| Library 2.0 Perspectives on AI | library20.com |
| Amigos: AI-Enhanced Library | amigos.org |
| SAIL — Libraries and AI | cdlc.org |
| AI & Academic Libraries | eventbrite.com |
| Lehigh AI Summit | lts.lehigh.edu |
| Fantastic Futures 2026 | ai4lam.org |
| ALIA National 2026 | alianational.alia.org.au |
| CARL 2026 Schedule | carl-acrl.wildapricot.org |
| Brick & Click Libraries | nwmissouri.edu |

---

## Usage

**Run scraper locally:**
```bash
node scrape.js
# → saves raw-data.json
```

**Then tell Claude:** "analyze and build" → Claude reads `raw-data.json`, writes `index.html`

```bash
git add index.html && git push
# → Vercel auto-deploys
```

**Requirements:** Node.js 18+ (native `fetch`, no `npm install` needed)

---

## GitHub Actions

`.github/workflows/monthly.yml`:
- Runs on the **1st of each month** at 9am UTC
- Manual trigger via **Actions → Run workflow**
- Commits updated `raw-data.json` back to repo

---

## Output

Claude-built HTML page with:
- Upcoming deadlines sorted by urgency (red = <2 weeks, orange = <1 month)
- Conference dates with full timelines where available
- Noise filtered out with explanations
- Sites with no 2026 dates listed for manual review

---

## Files

```
scrape.js                       ← scraper, outputs raw-data.json
raw-data.json                   ← compact scraped data (~1.5KB)
index.html                      ← Claude-built output, pushed manually
.github/workflows/monthly.yml  ← GitHub Actions schedule
CLAUDE.md                       ← project notes for Claude Code
```
