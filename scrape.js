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

// Patterns that indicate the date is page metadata, not a real event
const NOISE_RE = /last updated|posted by|login to|copyright|\(c\)|print page|url:/i;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}

// Extract the single most relevant sentence containing the date
function bestSnippet(text, matchIndex, matchLen) {
  const start = Math.max(0, matchIndex - 120);
  const end = Math.min(text.length, matchIndex + matchLen + 120);
  const chunk = text.slice(start, end);
  // Find the sentence boundary closest to the date
  const sentences = chunk.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    if (s.match(/20\d{2}/)) return s.trim().slice(0, 120);
  }
  return chunk.trim().slice(0, 120);
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
      const snippet = bestSnippet(text, m.index, m[1].length);
      if (NOISE_RE.test(snippet)) continue; // drop page metadata
      results.push({ d: m[1].trim(), s: snippet });
    }
  }
  return results.filter(r => r.d.includes('2026'));
}

async function fetchSite(site) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(site.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConferenceTracker/1.0)' }
    });
    clearTimeout(t);
    if (!res.ok) return { n: site.name, u: site.url, e: `HTTP ${res.status}` };
    const text = stripHtml(await res.text());
    const dates = extractDates(text);
    if (!dates.length) return { n: site.name, u: site.url };
    return { n: site.name, u: site.url, dates };
  } catch (e) {
    clearTimeout(t);
    return { n: site.name, u: site.url, e: e.name === 'AbortError' ? 'Timeout' : e.message };
  }
}

async function main() {
  console.log(`Scanning ${SITES.length} sites...`);
  const results = await Promise.all(SITES.map(fetchSite));
  const withDates = results.filter(r => r.dates?.length);
  const errors    = results.filter(r => r.e);
  const empty     = results.filter(r => !r.dates?.length && !r.e).map(r => r.n);
  console.log(`Done — ${withDates.length} with dates, ${errors.length} errors`);
  const output = {
    at: new Date().toISOString().slice(0, 10),
    dates: withDates,
    errors: errors.map(r => ({ n: r.n, e: r.e })),
    empty
  };
  writeFileSync('raw-data.json', JSON.stringify(output));
  console.log('Saved: raw-data.json');
}

main().catch(console.error);
