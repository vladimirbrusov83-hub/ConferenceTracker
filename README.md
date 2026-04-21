# ConferenceTracker

A lightweight monthly scraper that checks 13 AI-in-libraries conference websites for **2026 dates** and **proposal deadlines** — no API keys, no dependencies beyond Node.js 18+.

Built for a librarian preparing to submit conference presentations.

---

## How it works

1. Fetches raw HTML from 13 conference sites in parallel
2. Strips tags, runs regex to extract dates that include a full 4-digit year
3. Filters to **2026 only**
4. Classifies each date by context:
   - **Deadline** — near keywords like "proposal", "submit", "CFP", "abstract"
   - **Event** — near keywords like "conference", "schedule", "registration"
   - **Date** — everything else
5. Outputs a single self-contained `conference-dates.html` with filter buttons

---

## Sites tracked

| # | Conference | URL |
|---|-----------|-----|
| 1 | Internet Librarian Speakers | speakers.infotoday.com |
| 2 | Charleston Conference CFP | charleston-hub.com |
| 3 | ai4Libraries 2025 Schedule | ai4libraries.org |
| 4 | GAIL Schedule (SHSU) | shsulibraryguides.org |
| 5 | Library 2.0 Conferences | library20.com |
| 6 | Library 2.0 Perspectives on AI | library20.com |
| 7 | Amigos: AI-Enhanced Library | amigos.org |
| 8 | SAIL — Libraries and AI | cdlc.org |
| 9 | AI & Academic Libraries | eventbrite.com |
| 10 | Lehigh AI Summit | lts.lehigh.edu |
| 11 | Fantastic Futures 2026 | ai4lam.org |
| 12 | ALIA National 2026 | alianational.alia.org.au |
| 13 | CARL 2026 Schedule | carl-acrl.wildapricot.org |

---

## Usage

**Run locally:**
```bash
node scrape.js
# → saves conference-dates.html, open in any browser
```

**Requirements:** Node.js 18+ (uses native `fetch`, no `npm install` needed)

---

## GitHub Actions

The workflow in `.github/workflows/monthly.yml`:
- Runs automatically on the **1st of each month** at 9am UTC
- Can be triggered manually via the **Actions tab → Run workflow**
- Commits updated `conference-dates.html` back to this repo after each run

---

## Output

A single HTML file with:
- All 2026 dates found across all sites
- Context snippet showing surrounding text for each date
- Filter buttons: All / Deadlines / Events / Errors
- Error reporting for any sites that failed to load

---

## Files

```
scrape.js                        ← main script
conference-dates.html            ← generated output (updated monthly)
.github/workflows/monthly.yml   ← GitHub Actions schedule
CLAUDE.md                        ← project notes for Claude Code
```
