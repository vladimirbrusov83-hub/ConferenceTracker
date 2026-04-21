#!/usr/bin/env node
import { writeFileSync } from 'fs';

const SITES = [
  { name: 'Internet Librarian Speakers',     url: 'https://speakers.infotoday.com/il-speakers/' },
  { name: 'Charleston Conference CFP',        url: 'https://www.charleston-hub.com/the-charleston-conference/call-for-papers/' },
  { name: 'ai4Libraries 2025 Schedule',       url: 'https://www.ai4libraries.org/2025-schedule' },
  { name: 'GAIL Schedule (SHSU)',             url: 'https://shsulibraryguides.org/genailibraries/schedule' },
  { name: 'Library 2.0 Conferences',          url: 'https://www.library20.com/page/conferences' },
  { name: 'Library 2.0 Perspectives on AI',  url: 'https://www.library20.com/miniconferences/perspectives-on-ai' },
  { name: 'Amigos: AI-Enhanced Library',     url: 'https://www.amigos.org/services/online-conference/practical-paths-to-the-ai-enhanced-library' },
  { name: 'SAIL — Libraries and AI',          url: 'https://cdlc.org/libraries-and-ai/SAIL' },
  { name: 'AI & Academic Libraries',          url: 'https://www.eventbrite.com/e/ai-and-academic-libraries-an-online-conference-tickets-1123272140209' },
  { name: 'Lehigh AI Summit',                 url: 'https://lts.lehigh.edu/news/how-lehigh-putting-ai-work-insights-2nd-annual-ai-summit' },
  { name: 'Fantastic Futures 2026',           url: 'https://ai4lam.org/fantastic-futures/fantastic-futures-2026-trust-in-the-loop/' },
  { name: 'ALIA National 2026',               url: 'https://alianational.alia.org.au/program/' },
  { name: 'CARL 2026 Schedule',               url: 'https://carl-acrl.wildapricot.org/carl-2026-schedule' },
];

const M = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const ORD = '(?:st|nd|rd|th)?';

// Two clean patterns — both require a 4-digit year so we can filter by year
const DATE_RES = [
  // Month DD[–DD], YYYY  e.g. "September 16-17, 2026"
  new RegExp(`\\b((?:${M})\\.?\\s+\\d{1,2}${ORD}(?:\\s*[–\\-]\\s*\\d{1,2}${ORD})?\\s*,?\\s*20\\d{2})\\b`, 'gi'),
  // DD Month YYYY  e.g. "16 September 2026"
  new RegExp(`\\b(\\d{1,2}${ORD}\\s+(?:${M})\\.?\\s*,?\\s*20\\d{2})\\b`, 'gi'),
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

function extractDates(text) {
  const seen = new Set();
  const results = [];
  for (const re of DATE_RES) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const key = m[1].toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) continue;
      seen.add(key);
      const s = Math.max(0, m.index - 130);
      const e = Math.min(text.length, m.index + m[1].length + 130);
      results.push({ date: m[1].trim(), context: text.slice(s, e).trim() });
    }
  }
  // Only 2026
  return results.filter(d => d.date.includes('2026'));
}

function classifyContext(ctx) {
  const l = ctx.toLowerCase();
  if (['deadline', 'proposal', 'submit', 'call for', 'cfp', 'due', 'abstract', 'closes'].some(k => l.includes(k))) return 'deadline';
  if (['conference', 'event', 'registration', 'session', 'virtual', 'annual', 'schedule', 'program'].some(k => l.includes(k))) return 'event';
  return 'date';
}

async function fetchSite(site) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(site.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceTracker/1.0; +https://github.com)' }
    });
    clearTimeout(t);
    if (!res.ok) return { ...site, error: `HTTP ${res.status}`, dates: [] };
    const html = await res.text();
    const text = stripHtml(html);
    const dates = extractDates(text);
    return { ...site, dates, error: null };
  } catch (e) {
    clearTimeout(t);
    return { ...site, error: e.name === 'AbortError' ? 'Timeout' : e.message, dates: [] };
  }
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildHtml(results, checkedAt) {
  const cards = results.map(r => {
    if (r.error) return `
      <div class="card err">
        <div class="head"><a href="${esc(r.url)}" target="_blank">${esc(r.name)}</a>
        <span class="badge b-err">Error: ${esc(r.error)}</span></div>
      </div>`;

    if (!r.dates.length) return `
      <div class="card dim">
        <div class="head"><a href="${esc(r.url)}" target="_blank">${esc(r.name)}</a>
        <span class="badge b-none">No dates found</span></div>
      </div>`;

    const items = r.dates.map(d => {
      const type = classifyContext(d.context);
      const hi = esc(d.context).replace(
        new RegExp(esc(d.date).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'),
        '<mark>$&</mark>'
      );
      return `<div class="di t-${type}">
        <span class="dl">${esc(d.date)}</span>
        <span class="badge b-${type}">${type === 'deadline' ? 'Deadline' : type === 'event' ? 'Event' : 'Date'}</span>
        <div class="ctx">…${hi}…</div>
      </div>`;
    }).join('');

    return `
      <div class="card">
        <div class="head"><a href="${esc(r.url)}" target="_blank">${esc(r.name)}</a>
        <span class="badge b-ok">${r.dates.length} date${r.dates.length > 1 ? 's' : ''}</span></div>
        <div class="dates">${items}</div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conference Date Tracker</title>
<style>
  :root{--bg:#0f172a;--card:#1e293b;--bd:#334155;--tx:#e2e8f0;--mu:#94a3b8;--ac:#818cf8}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--tx);line-height:1.6;padding:2rem 1rem}
  h1{color:var(--ac);margin-bottom:.25rem;font-size:1.6rem}
  .meta{color:var(--mu);font-size:.875rem;margin-bottom:1.5rem}
  .filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.5rem}
  .fb{padding:.35rem .85rem;border-radius:99px;border:1px solid var(--bd);background:var(--card);color:var(--mu);cursor:pointer;font-size:.85rem;transition:all .15s}
  .fb.on{border-color:var(--ac);color:var(--ac)}
  .card{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:1.25rem;margin-bottom:.85rem}
  .card.err{border-color:#7f1d1d}.card.dim{opacity:.55}
  .head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;margin-bottom:.6rem}
  .head a{color:var(--ac);text-decoration:none;font-weight:600}.head a:hover{text-decoration:underline}
  .badge{font-size:.72rem;padding:.15rem .55rem;border-radius:99px;font-weight:600;white-space:nowrap}
  .b-ok{background:#064e3b;color:#6ee7b7}.b-err{background:#7f1d1d;color:#fca5a5}
  .b-none{background:var(--card);color:var(--mu);border:1px solid var(--bd)}
  .b-deadline{background:#7c2d12;color:#fdba74}.b-event{background:#1e3a5f;color:#93c5fd}
  .b-date{background:#1e293b;color:var(--mu);border:1px solid var(--bd)}
  .dates{display:flex;flex-direction:column;gap:.5rem}
  .di{display:flex;align-items:flex-start;gap:.6rem;flex-wrap:wrap;padding:.5rem;background:#0f172a;border-radius:6px}
  .dl{font-weight:600;white-space:nowrap;min-width:130px;font-size:.9rem}
  .ctx{width:100%;color:var(--mu);font-size:.82rem;margin-top:.2rem}
  mark{background:#854d0e;color:#fde68a;border-radius:3px;padding:0 2px}
</style>
</head>
<body>
<h1>Conference Date Tracker</h1>
<p class="meta">Last checked: ${checkedAt} &nbsp;·&nbsp; ${results.length} sites</p>
<div class="filters">
  <button class="fb on" onclick="filter(this,'all')">All</button>
  <button class="fb" onclick="filter(this,'deadline')">Deadlines</button>
  <button class="fb" onclick="filter(this,'event')">Events</button>
  <button class="fb" onclick="filter(this,'err')">Errors</button>
</div>
<div id="res">${cards}</div>
<script>
function filter(btn, type) {
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.card').forEach(card => {
    if (type === 'all') { card.style.display = ''; return; }
    if (type === 'err')  { card.style.display = card.classList.contains('err') ? '' : 'none'; return; }
    card.style.display = card.querySelector('.b-' + type) ? '' : 'none';
  });
}
</script>
</body>
</html>`;
}

async function main() {
  console.log(`Scanning ${SITES.length} sites...`);
  const results = await Promise.all(SITES.map(fetchSite));
  const found  = results.filter(r => r.dates?.length).length;
  const errors = results.filter(r => r.error).length;
  console.log(`Done — ${found} with dates, ${errors} errors`);
  const checkedAt = new Date().toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  writeFileSync('index.html', buildHtml(results, checkedAt));
  console.log('Saved: index.html');
}

main().catch(console.error);
