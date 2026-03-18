const fs = require('fs');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toDateOnly(value, fallback = '2026-01-01') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString().split('T')[0];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function humanizeCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  const overrides = {
    assistant: 'Assistants',
    coding: 'Coding',
    automation: 'Automation',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    productivity: 'Productivity'
  };

  if (overrides[normalized]) {
    return overrides[normalized];
  }

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function createSubmissionId() {
  return `sub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

function sanitizeText(value) {
  return String(value || '').trim();
}

function normalizeClientId(clientId) {
  return String(clientId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);
}

module.exports = {
  readJson,
  writeJson,
  slugify,
  toDateOnly,
  toNumber,
  humanizeCategory,
  createSubmissionId,
  normalizeBoolean,
  sanitizeText,
  normalizeClientId
};
