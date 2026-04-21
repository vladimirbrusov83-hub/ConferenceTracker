# ConferenceTracker

Scrapes 13 AI-in-libraries conference websites monthly for 2026 dates and proposal deadlines. No API keys. Pure Node.js with native fetch.

## Files
- `scrape.js` — main script: fetches all sites, extracts 2026 dates via regex, outputs HTML
- `conference-dates.html` — generated output, open in any browser
- `.github/workflows/monthly.yml` — runs on the 1st of each month + manual trigger

## Run locally
```bash
node scrape.js
# opens conference-dates.html
```

## Sites tracked
1. Internet Librarian Speakers (infotoday.com)
2. Charleston Conference CFP
3. ai4Libraries 2025 Schedule
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

## How it works
- Fetches raw HTML, strips tags, runs two regex patterns to find dates with full 4-digit years
- Filters to 2026 only
- Classifies each date as **Deadline** (proposal/CFP context), **Event** (conference/schedule context), or **Date**
- Outputs a filterable single-file HTML report

## GitHub Actions
Workflow runs automatically on the 1st of each month and commits updated `conference-dates.html` back to the repo. Can also be triggered manually from the Actions tab.

## Owner
Vladimir — built for Yulia's library conference research.
