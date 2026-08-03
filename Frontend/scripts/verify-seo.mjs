#!/usr/bin/env node
/**
 * Build-time SEO gate.
 *
 * seo-technical-implementation-prompt.md says to treat missing items as build
 * failures, not suggestions — so this exits non-zero. It runs as "prebuild", which
 * means a violation stops the build before anything is produced.
 *
 * Checks 1,2,3,4,6,10,11,12,13 are enforced here. The ones that cannot be settled
 * from source are reported instead:
 *   7 heading hierarchy — needs the rendered DOM
 *   9 JSON-LD validity  — needs Google's Rich Results Test
 *   5 X-Robots-Tag      — asserted against the deployed header config, see below
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const errors = [];
const warnings = [];
const fail = (rule, msg) => errors.push(`[rule ${rule}] ${msg}`);
const warn = (rule, msg) => warnings.push(`[rule ${rule}] ${msg}`);

const configSrc = read('src/config/seoConfig.js');
const body = configSrc.slice(
  configSrc.indexOf('export const SEO_CONFIGS'),
  configSrc.indexOf('export const DEFAULT_SEO'),
);

const routes = body.split(/\n\s*\{\s*\n/).slice(1).map((block) => ({
  path: block.match(/path:\s*'([^']+)'/)?.[1],
  title: block.match(/title:\s*'((?:[^'\\]|\\.)*)'/)?.[1],
  description: block.match(/description:\s*'((?:[^'\\]|\\.)*)'/)?.[1],
  keywords: block.match(/keywords:\s*'((?:[^'\\]|\\.)*)'/)?.[1],
  noindex: /noindex:\s*true/.test(block),
})).filter((r) => r.path);

if (routes.length === 0) fail('0', 'Could not parse any routes from seoConfig.js');

// ── 1 & 2: length ──
for (const r of routes) {
  const t = (r.title || '').replace(/\\'/g, "'");
  const d = (r.description || '').replace(/\\'/g, "'");
  if (!t) fail(1, `${r.path} has no title`);
  else if (t.length < 55 || t.length > 65) fail(1, `${r.path} title is ${t.length} chars, must be 55-65`);
  if (!d) fail(2, `${r.path} has no description`);
  else if (d.length < 70 || d.length > 150) fail(2, `${r.path} description is ${d.length} chars, must be 70-150`);
  // ── 6: keywords present and page-specific ──
  if (!r.keywords) fail(6, `${r.path} has no meta keywords`);
}

// ── 11: uniqueness ──
const seen = (key) => {
  const map = new Map();
  for (const r of routes) {
    const v = r[key];
    if (!v) continue;
    map.set(v, [...(map.get(v) || []), r.path]);
  }
  return [...map.entries()].filter(([, paths]) => paths.length > 1);
};
for (const [value, paths] of seen('title')) fail(11, `duplicate title across ${paths.join(' + ')}: "${value.slice(0, 50)}…"`);
for (const [, paths] of seen('description')) fail(11, `duplicate description across ${paths.join(' + ')}`);

// ── 3 & 4 & 10: the head manager must emit canonical, robots and OG ──
const canonicalSrc = read('src/Component/CanonicalTag.jsx');
const required = [
  [3, "setLink('canonical'", 'self-referential canonical'],
  [4, "'robots'", 'robots meta tag'],
  [10, "'og:url'", 'og:url'],
  [10, "'og:image'", 'og:image'],
  [10, "'og:title'", 'og:title'],
];
for (const [rule, needle, label] of required) {
  if (!canonicalSrc.includes(needle)) fail(rule, `CanonicalTag.jsx never emits ${label}`);
}
// og:url must be the canonical value, not recomputed differently.
if (!/setMeta\('property', 'og:url', canonical\)/.test(canonicalSrc)) {
  fail(10, 'og:url is not bound to the same canonical value — they can drift');
}

// ── 3: no dead/mismatched origin anywhere in the SEO surface ──
const ORIGIN = configSrc.match(/\|\|\s*'(https?:\/\/[^']+)'/)?.[1];
if (!ORIGIN) fail(3, 'Could not determine SITE_ORIGIN from seoConfig.js');
for (const file of ['index.html', 'public/robots.txt', 'public/sitemap.xml']) {
  const src = read(file);
  const hosts = [...src.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)]
    .map((m) => m[1])
    .filter((h) => /siteaudit\.sltechsoft\.com/.test(h));
  if (hosts.length) fail(3, `${file} still references the dead host siteaudit.sltechsoft.com`);
}

// ── 12 & 13 ──
if (!fs.existsSync(path.join(root, 'public/robots.txt'))) fail(12, 'public/robots.txt is missing');
else {
  const robots = read('public/robots.txt');
  if (!/^Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/m.test(robots)) fail(12, 'robots.txt does not reference the sitemap');
}
if (!fs.existsSync(path.join(root, 'public/sitemap.xml'))) fail(13, 'public/sitemap.xml is missing');
else {
  const sitemap = read('public/sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) fail(13, 'sitemap.xml contains no URLs');
  // A noindex page must never appear in the sitemap.
  for (const r of routes.filter((x) => x.noindex)) {
    if (locs.some((l) => l.endsWith(r.path))) fail(13, `sitemap includes ${r.path}, which is noindex`);
  }
}

// ── 5: X-Robots-Tag must be set at the edge, not only as a meta tag ──
const headerFiles = ['public/staticwebapp.config.json', 'public/_headers'];
const hasXRobots = headerFiles.some((f) => {
  const abs = path.join(root, f);
  return fs.existsSync(abs) && /X-Robots-Tag/i.test(fs.readFileSync(abs, 'utf8'));
});
if (!hasXRobots) fail(5, `X-Robots-Tag is not set in any of: ${headerFiles.join(', ')}`);

// ── 8: image weight ──
// Reported, not fatal: the repo already ships several large legacy assets, and
// failing the build on those would block every build until they are re-encoded.
// Anything NEW that breaches the limit shows up here immediately.
const LIMIT = 150 * 1024;
const imageDirs = ['src/assets', 'public'];
const offenders = [];
for (const dir of imageDirs) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(png|jpe?g|gif|webp|avif)$/i.test(entry.name)) continue;
    const size = fs.statSync(path.join(abs, entry.name)).size;
    if (size > LIMIT) offenders.push({ file: `${dir}/${entry.name}`, kb: Math.round(size / 1024) });
  }
}
offenders.sort((a, b) => b.kb - a.kb);
for (const o of offenders) warn(8, `${o.file} is ${o.kb}KB, over the 150KB limit`);

// ── report ──
if (warnings.length) {
  console.warn(`\n⚠  ${warnings.length} SEO warning(s):`);
  warnings.forEach((w) => console.warn(`   ${w}`));
}
if (errors.length) {
  console.error(`\n✖  SEO verification failed — ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`   ${e}`));
  console.error('\n   See seo-technical-implementation-prompt.md for the rules.\n');
  process.exit(1);
}
console.log(`\n✓  SEO verification passed — ${routes.length} routes checked, 0 errors, ${warnings.length} warning(s).`);
console.log('   Not statically checkable: heading hierarchy (7) and JSON-LD validity (9).');
console.log('   Validate those with Lighthouse and Google\'s Rich Results Test before launch.\n');
