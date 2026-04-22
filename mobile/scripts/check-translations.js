#!/usr/bin/env node
/**
 * Checks that tr.json and es.json have all keys present in en.json.
 * Run: node scripts/check-translations.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../i18n/locales');
const SOURCE = 'en';
const TARGETS = ['tr', 'es'];

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, fullKey));
    } else {
      acc[fullKey] = value;
    }
    return acc;
  }, {});
}

function loadJson(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const sourceFlat = flatten(loadJson(SOURCE));
const sourceKeys = new Set(Object.keys(sourceFlat));

let totalMissing = 0;
let allGood = true;

for (const target of TARGETS) {
  const targetFlat = flatten(loadJson(target));
  const targetKeys = new Set(Object.keys(targetFlat));

  const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
  const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅  ${target}.json — all ${sourceKeys.size} keys present`);
    continue;
  }

  allGood = false;
  console.log(`\n❌  ${target}.json`);

  if (missing.length > 0) {
    totalMissing += missing.length;
    console.log(`\n  Missing ${missing.length} key(s):`);
    for (const key of missing) {
      console.log(`    ${key}`);
      console.log(`      EN: "${sourceFlat[key]}"`);
    }
  }

  if (extra.length > 0) {
    console.log(`\n  Orphaned ${extra.length} key(s) (in ${target} but not in en):`);
    for (const key of extra) {
      console.log(`    ${key}`);
    }
  }
}

console.log('');

if (allGood) {
  console.log('All locale files are in sync.');
  process.exit(0);
} else {
  console.log(`${totalMissing} missing translation(s) found. Add them to the locale files above.`);
  process.exit(1);
}
