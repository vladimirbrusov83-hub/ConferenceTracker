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
  { name: 'Brick & Click Libraries',          url: 'https://www.nwmissouri.edu/library/brickandclick/index.htm' },
];

const M = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
const ORD = '(?:st|nd|rd|th)?';

const DATE_RES = [
  new RegExp(`\\b((?:${M})\\.?\\s+\\d{1,2}${ORD}(?:\\s*[–\\-]\\s*\\d{1,2}${ORD})?\\s*,?\\s*20\\d{2})\\b`, 'gi'),
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
      const s = Math.max(0, m.index - 200);
      const e = Math.min(text.length, m.index + m[1].length + 200);
      results.push({ date: m[1].trim(), context: text.slice(s, e).trim() });
    }
  }
  return results.filter(d => d.date.includes('2026'));
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

async function main() {
  console.log(`Scanning ${SITES.length} sites...`);
  const results = await Promise.all(SITES.map(fetchSite));
  const found  = results.filter(r => r.dates?.length).length;
  const errors = results.filter(r => r.error).length;
  console.log(`Done — ${found} with dates, ${errors} errors`);
  const output = {
    scrapedAt: new Date().toISOString(),
    sites: results
  };
  writeFileSync('raw-data.json', JSON.stringify(output, null, 2));
  console.log('Saved: raw-data.json');
}

main().catch(console.error);
