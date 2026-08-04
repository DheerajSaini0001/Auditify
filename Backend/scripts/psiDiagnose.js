// PSI diagnostic — resolves the API key exactly the way googleAPI.js does, then
// hits https://www.googleapis.com/pagespeedonline/v5/runPagespeed raw (no retries,
// no wrapper) and prints the real HTTP status + response body for each target.
//
//   node scripts/psiDiagnose.js                       # baseline only
//   node scripts/psiDiagnose.js https://target.com/x  # baseline + targets
//
// Run from Backend/ so dotenv picks up .env.
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const mask = (k) => (k ? `${k.slice(0, 6)}…${k.slice(-4)} (len ${k.length})` : '<empty>');

// ── 1. Where does the key come from? ────────────────────────────────────────
// googleAPI.js calls configService.getConfig('API_KEY'), which reads an in-memory
// NodeCache primed from Mongo at boot and falls back to process.env.API_KEY.
// Resolve BOTH so a mismatch between the .env key and the DB key is visible.
const envKey = process.env.API_KEY || '';
let dbKey = '';
let dbNote = 'not checked';
if (process.env.MONGO_URI && !process.argv.includes('--no-db')) {
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const PlatformConfig = (await import('../models/PlatformConfig.js')).default;
    const { decrypt } = await import('../utils/encrypt.js');
    const doc = await PlatformConfig.findOne({ key: 'API_KEY' }).lean();
    if (!doc) dbNote = 'no API_KEY row in PlatformConfig';
    else {
      dbKey = doc.isSecret ? decrypt(doc.value) : doc.value;
      dbNote = 'loaded from PlatformConfig';
    }
    await mongoose.disconnect();
  } catch (e) {
    dbNote = `DB lookup failed: ${e.message}`;
  }
}

console.log('── key resolution ──────────────────────────────────────────────');
console.log(`  process.env.API_KEY : ${mask(envKey)}`);
console.log(`  PlatformConfig      : ${mask(dbKey)}  [${dbNote}]`);
if (envKey && dbKey && envKey !== dbKey) {
  console.log('  ⚠ env key and DB key DIFFER — the worker may use a different key than the API.');
}
const API_KEY = dbKey || envKey;
if (!API_KEY) {
  console.log('  ✗ No API key resolved at all. That alone explains the generic error.');
  process.exit(1);
}

// ── 2. Raw calls ────────────────────────────────────────────────────────────
const targets = ['https://example.com', ...process.argv.slice(2).filter((a) => a.startsWith('http'))];

for (const url of targets) {
  const endpoint = `${ENDPOINT}?url=${encodeURIComponent(url)}&strategy=mobile&key=${API_KEY}`;
  console.log(`\n── ${url} ──────────────────────────────────────────────────`);
  const started = Date.now();
  try {
    // 120s: deliberately far above the app's 45s per-attempt deadline, so a call
    // the app would have aborted still returns here and we see PSI's real answer.
    const res = await fetch(endpoint, { timeout: 120000 });
    const text = await res.text();
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    let body;
    try { body = JSON.parse(text); } catch { body = null; }

    console.log(`  HTTP ${res.status} ${res.statusText}  (${secs}s)`);
    if (!body) {
      console.log(`  non-JSON body: ${text.slice(0, 1000)}`);
      continue;
    }
    if (body.error) {
      console.log(`  error.code    : ${body.error.code}`);
      console.log(`  error.status  : ${body.error.status}`);
      console.log(`  error.message : ${body.error.message}`);
      if (body.error.errors) console.log(`  error.errors  : ${JSON.stringify(body.error.errors)}`);
    }
    const lr = body.lighthouseResult;
    console.log(`  lighthouseResult present : ${!!lr}`);
    if (lr?.runtimeError) {
      console.log(`  runtimeError.code    : ${lr.runtimeError.code}`);
      console.log(`  runtimeError.message : ${lr.runtimeError.message}`);
    }
    if (lr && !lr.runtimeError) {
      const perf = lr.categories?.performance?.score;
      console.log(`  performance score : ${perf == null ? 'n/a' : Math.round(perf * 100)}`);
      console.log(`  audits returned   : ${Object.keys(lr.audits || {}).length}`);
      console.log(`  CrUX field data   : ${body.loadingExperience?.metrics ? 'yes' : 'no'}`);
    }
  } catch (e) {
    console.log(`  transport failure after ${((Date.now() - started) / 1000).toFixed(1)}s: ${e.name}: ${e.message}`);
  }
}
