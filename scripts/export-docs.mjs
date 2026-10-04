/* Exports Docs, Whitepaper and Roadmap (lib/rhio3d/content.js) plus a feature-status page to
   exports/RHIO-Docs.md, exports/RHIO-Docs.html and exports/RHIO-Docs.pdf (headless Chrome or Edge).
   Usage: node scripts/export-docs.mjs            (set CHROME=<path> if the browser is not found) */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const out = path.join(root, 'exports');
fs.mkdirSync(out, {recursive: true});

const {CONTENT: C} = await import(pathToFileURL(path.join(root, 'lib/rhio3d/content.js')).href);
const date = C.version.split('·')[1]?.trim() || '';

/* Feature status by what the code actually does. Keep in sync with Docs "What is RHIO". */
const STATUS = [
 ['Live on rhio.studio', 'live', [
  '25 characters (22 modelled humans dressed in the browser, an android and 3 bots built from code), outfit editor, 20 motions, 6 powers (three.js)',
  'Agent builder: persona, tone, answer language, up to 4 of 9 skills',
  'Wallet monitor skill: reads an address on Robinhood Chain (balances, change since the last check, RHIO transfers), read-only',
  'All 9 skills open on a server-side AI provider; runs cost credits, and the operator can cap tries per skill (a failed run gives the try back)',
  'Save, duplicate, archive, export / import JSON, share links, task history',
  'Pay-per-run marketplace in credits: 25 free starting credits, live AI 4–12 credits per run by skill, creator prices 0–500, platform fee 0% in beta, ledger with refunds',
  'Discover gallery of published agents (instructions are never shown)',
  'Schedules: an agent runs a skill 1–24 times a day, paid per run with the skill\'s live price (at least 5 credits), max 3 schedules / 24 runs a day',
  'Wallet-only sign-in (SIWE for Robinhood Chain), several wallets per account',
  'RHIO token on Robinhood Chain mainnet since 2 October 2026; the contract address is in the CA box on the home page',
  'Credit top-ups in USDG on Robinhood Chain mainnet (1 USDG = 100 credits)',
  'Holder tiers from the RHIO balance: monthly credits and a lower platform fee',
  'NVDA holder rewards: $0.01 of NVDA per hour per 1,500,000 RHIO, Chainlink price, settled and claimable every hour from the reward vault (RhioClaims, owned by the multisig, source-verified, not audited)',
  'Docs, whitepaper and roadmap',
 ]],
 ['Built, switched off', 'off', [
  'Web research that browses: Gemini with Google Search, or Claude / OpenAI web search (needs a provider plan that includes search; without it the skill answers from the model and says so)',
  'Earnings claims in USDG through the RhioClaims contract (min. 500 earned credits): written and tested locally, not audited, not deployed',
 ]],
 ['Not done', 'no', [
  'Independent audit of RhioClaims (reward vault and claims contract)',
  'Legal review of NVDA Stock Token payouts',
  'Platform fee (10%) after the beta',
  'Wallet monitor skill, on-chain monitoring',
 ]],
];

/* ---- markdown subset -> HTML (headings, paragraphs, lists, bold, italic, code, blockquote, tables) ---- */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
 .replace(/`([^`]+)`/g, '<code>$1</code>')
 .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
 .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
function md(src) {
 const L = src.replace(/\r\n/g, '\n').trim().split('\n');
 let h = '', i = 0;
 while (i < L.length) {
  const l = L[i];
  if (!l.trim()) { i++; continue; }
  if (l.startsWith('```')) { const b = []; i++; while (i < L.length && !L[i].startsWith('```')) b.push(L[i++]); i++; h += `<pre>${esc(b.join('\n'))}</pre>`; continue; }
  const hd = /^(#{1,4})\s+(.*)/.exec(l); if (hd) { const n = hd[1].length + 2; h += `<h${n}>${inline(hd[2])}</h${n}>`; i++; continue; }
  if (l.startsWith('>')) { const b = []; while (i < L.length && L[i].startsWith('>')) b.push(L[i++].replace(/^>\s?/, '')); h += `<blockquote>${inline(b.join(' '))}</blockquote>`; continue; }
  if (l.startsWith('|')) {
   const rows = []; while (i < L.length && L[i].startsWith('|')) rows.push(L[i++]);
   const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
   const body = rows.slice(2).map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
   h += `<table><thead><tr>${cells(rows[0]).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`; continue;
  }
  if (/^(-|\d+\.)\s/.test(l)) {
   const ol = /^\d+\./.test(l), b = [];
   while (i < L.length && /^(-|\d+\.)\s/.test(L[i])) b.push(L[i++].replace(/^(-|\d+\.)\s+/, ''));
   h += `<${ol ? 'ol' : 'ul'}>${b.map(x => `<li>${inline(x)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`; continue;
  }
  const p = []; while (i < L.length && L[i].trim() && !/^(#|>|\||```|-\s|\d+\.\s)/.test(L[i])) p.push(L[i++]);
  h += `<p>${inline(p.join(' '))}</p>`;
 }
 return h;
}

const MARK = {done: 'Done', now: 'Now', next: 'Next', planned: 'Planned', idea: 'Idea'};
const docs = C.docs, paper = C.paper.sections, road = C.roadmap;

/* ---- Markdown ---- */
let M = `# RHIO — Docs, Whitepaper & Roadmap\n\n${C.version}\n\n`;
M += `## Feature status\n\n` + STATUS.map(([t, , items]) => `### ${t}\n\n${items.map(x => `- ${x}`).join('\n')}`).join('\n\n') + '\n\n';
M += `# Docs\n\n` + docs.map(d => `## ${d.title}\n\n${d.body.trim()}`).join('\n\n') + '\n\n';
M += `# ${C.paper.title}\n\n_${C.paper.subtitle}_\n\n> ${C.paper.status}\n\n` + paper.map(s => `## ${s.title}\n\n${s.body.trim()}`).join('\n\n') + '\n\n';
M += `# Roadmap\n\n` + road.map(p => `## ${p.phase} · ${p.title} (${p.when})\n\n${p.items.map(([s, t]) => `- [${MARK[s] || s}] ${t}`).join('\n')}`).join('\n\n') + '\n';
fs.writeFileSync(path.join(out, 'RHIO-Docs.md'), M.replace(/\r\n/g, '\n'));

/* ---- HTML ---- */
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/rhio-logo.png')).toString('base64');
const toc = [['status', 'Feature status'], ['docs', 'Docs', docs], ['paper', 'Whitepaper', paper], ['roadmap', 'Roadmap']];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>RHIO — Docs, Whitepaper & Roadmap</title><style>
@page{size:A4;margin:18mm 16mm 18mm}@page:first{margin:0}
*{box-sizing:border-box}body{font:10.5pt/1.55 "Segoe UI",Inter,Arial,sans-serif;color:#15201a;margin:0}
h1{font-size:24pt;line-height:1.15;margin:0 0 6mm;letter-spacing:-.02em}h2{font-size:15pt;margin:9mm 0 3mm;letter-spacing:-.01em;break-after:avoid}
h3,h4{font-size:11.5pt;margin:6mm 0 2mm;break-after:avoid}h5,h6{font-size:10.5pt;margin:4mm 0 1mm}
p{margin:0 0 3mm}ul,ol{margin:0 0 3mm;padding-left:6mm}li{margin:.8mm 0}
code{font:9pt Consolas,monospace;background:#eef2ea;padding:.2mm 1mm;border-radius:1mm;word-break:break-all}
pre{font:8.3pt/1.4 Consolas,monospace;background:#0f1712;color:#e8f5d0;padding:4mm;border-radius:2mm;white-space:pre-wrap;break-inside:avoid}
blockquote{margin:0 0 4mm;padding:3mm 4mm;border-left:1.2mm solid #C8FF24;background:#f5f9ec;border-radius:0 2mm 2mm 0}
table{width:100%;border-collapse:collapse;margin:0 0 4mm;font-size:9.3pt;break-inside:auto}tr{break-inside:avoid}
th{text-align:left;background:#15201a;color:#f1efe6;font-weight:600}th,td{padding:1.6mm 2.2mm;border-bottom:.2mm solid #d6ddd0;vertical-align:top}
.cover{height:296mm;display:flex;flex-direction:column;justify-content:space-between;background:#0c1410;color:#f1efe6;padding:26mm 22mm;break-after:page;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cover img{width:26mm}.cover h1{font-size:34pt;color:#f1efe6}.cover .lime{color:#C8FF24}.cover p{color:#b9c4b4;max-width:130mm}
.eyebrow{font:600 8.5pt Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#5d6b60}
.cover .eyebrow{color:#C8FF24}
.part{break-before:page}.part>h1{border-bottom:1mm solid #C8FF24;padding-bottom:3mm}
.sec{break-inside:auto}.sec+.sec{margin-top:4mm}
.toc ol{padding-left:5mm}.toc li{margin:1.2mm 0}.toc ol ol{font-size:9.5pt;color:#44524a}
.status h3{display:flex;gap:2mm;align-items:center}.pill{font:600 8pt Consolas,monospace;padding:.6mm 2mm;border-radius:5mm;text-transform:uppercase}
.live{background:#C8FF24;color:#15201a}.off{background:#ffe7a8;color:#6b4a00}.no{background:#ffd6cc;color:#8a2b12}
.phase{break-inside:avoid;border:.2mm solid #d6ddd0;border-radius:2mm;padding:3mm 4mm;margin:0 0 4mm}.phase h3{margin:0 0 2mm}
.phase ul{list-style:none;padding:0;margin:0}.phase li{display:flex;gap:2.5mm}.tag{flex:0 0 16mm;font:600 7.5pt Consolas,monospace;text-transform:uppercase;padding-top:.6mm}
.t-done{color:#2f7d32}.t-now{color:#0a66c2}.t-next{color:#9a6500}.t-planned{color:#5d6b60}.t-idea{color:#8a4fb8}
.foot{font-size:8.5pt;color:#5d6b60;margin-top:8mm}
</style></head><body>
<section class="cover"><div><img src="${logo}" alt="RHIO"></div>
<div><div class="eyebrow">Documentation export · ${esc(date)}</div><h1>RHIO Agent Studio<br><span class="lime">Docs, Whitepaper & Roadmap</span></h1>
<p>Everything in the studio's docs, the whitepaper and the roadmap, with a status page that separates what is live, what is built but switched off, and what has not been done.</p></div>
<div class="eyebrow">${esc(C.version)} · ${esc(C.paper.status)} · Not an offer to sell any token</div></section>

<section class="toc"><div class="eyebrow">Contents</div><h1>Contents</h1><ol>${toc.map(([id, t, list]) => `<li><strong>${t}</strong>${list ? `<ol>${list.map(s => `<li>${esc(s.title)}</li>`).join('')}</ol>` : ''}</li>`).join('')}</ol></section>

<section class="part status" id="status"><div class="eyebrow">Where things stand · ${esc(date)}</div><h1>Feature status</h1>
<p>Status of rhio.studio on Robinhood Chain mainnet. "Built, switched off" means the feature exists and is tested, but it is not switched on or still needs a deployed contract.</p>
${STATUS.map(([t, k, items]) => `<h3><span class="pill ${k}">${k === 'live' ? 'Live' : k === 'off' ? 'Off' : 'Not done'}</span>${t}</h3><ul>${items.map(x => `<li>${inline(x)}</li>`).join('')}</ul>`).join('')}
</section>

<section class="part" id="docs"><div class="eyebrow">Part 1</div><h1>Docs</h1>
${docs.map(d => `<div class="sec"><h2>${esc(d.title)}</h2>${md(d.body)}</div>`).join('')}</section>

<section class="part" id="paper"><div class="eyebrow">Part 2 · ${esc(C.paper.status)}</div><h1>${esc(C.paper.title)}</h1><p><em>${esc(C.paper.subtitle)}</em></p>
${paper.map(s => `<div class="sec"><h2>${esc(s.title)}</h2>${md(s.body)}</div>`).join('')}</section>

<section class="part" id="roadmap"><div class="eyebrow">Part 3</div><h1>Roadmap</h1>
${road.map(p => `<div class="phase"><div class="eyebrow">${esc(p.phase)} · ${esc(p.when)}</div><h3>${esc(p.title)}</h3><ul>${p.items.map(([s, t]) => `<li><span class="tag t-${s}">${MARK[s] || s}</span><span>${inline(t)}</span></li>`).join('')}</ul></div>`).join('')}
<p class="foot">RHIO is an independent project, not affiliated with Robinhood Markets, Inc. or Anthropic. Nothing here is financial advice or an offer to sell a token.</p></section>
</body></html>`;
const htmlPath = path.join(out, 'RHIO-Docs.html');
fs.writeFileSync(htmlPath, html);

/* ---- PDF via headless Chrome / Edge ---- */
const candidates = [process.env.CHROME,
 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const browser = candidates.find(p => fs.existsSync(p));
if (!browser) { console.log('Wrote Markdown and HTML. No Chrome/Edge found for the PDF (set CHROME=<path>).'); process.exit(0); }
const pdfPath = path.join(out, 'RHIO-Docs.pdf');
execFileSync(browser, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], {stdio: 'ignore'});
console.log(`Wrote ${path.relative(root, out)}/RHIO-Docs.{md,html,pdf}`);
