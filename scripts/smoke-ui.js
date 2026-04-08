#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { startServer } = require('../server');

const STATE_FILE = path.join(__dirname, '..', 'data', 'app-state.json');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  return { response, text };
}

function assertIncludes(text, required, label) {
  for (const token of required) {
    assert(text.includes(token), `${label} missing required token: ${token}`);
  }
}

async function fetchJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = null;
  }

  return { response, data, text };
}

function assertToolFields(tool) {
  const required = [
    'slug',
    'name',
    'subcategory',
    'description',
    'categoryLabel',
    'pricingLabel',
    'rating',
    'websiteUrl',
    'updatedAt'
  ];

  for (const field of required) {
    assert(tool[field] !== undefined && tool[field] !== null, `Tool payload missing field: ${field}`);
  }
}

async function main() {
  const port = Number.parseInt(process.env.SMOKE_UI_PORT || '3121', 10);
  const baseUrl = `http://127.0.0.1:${port}`;
  const originalState = fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8') : null;
  const server = startServer(port);

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const pages = [
      {
        path: '/',
        required: [
          'data-page="home"',
          'id="heroEyebrow"',
          'id="homeFeedTabs"',
          'id="homeFeedGrid"',
          'id="categorySpotlightGrid"',
          'id="creatorSpotlight"',
          'id="collectionGrid"',
          'id="newsletterForm"'
        ]
      },
      {
        path: '/tools-directory.html',
        required: [
          'data-page="directory"',
          'id="directorySearch"',
          'id="categoryFilters"',
          'id="pricingFilter"',
          'id="sortFilter"',
          'id="verifiedFilter"',
          'id="resultsCount"',
          'id="directoryGrid"',
          'id="toolDetailCard"',
          'id="emptyState"'
        ]
      }
    ];

    for (const page of pages) {
      const res = await fetchText(baseUrl, page.path);
      assert(res.response.ok, `Page request failed: ${page.path}`);
      assert(
        res.text.includes('<!DOCTYPE html>') || res.text.includes('<html'),
        `Invalid HTML response for ${page.path}`
      );
      assertIncludes(res.text, page.required, `Page ${page.path}`);
    }

    const css = await fetchText(baseUrl, '/styles/futurepedia-redesign.css');
    assert(css.response.ok, 'Failed to load /styles/futurepedia-redesign.css');
    assertIncludes(
      css.text,
      [
        'body[data-page="home"] .home-hero-panel',
        'body[data-page="home"] .home-hero-grid',
        'body[data-page="directory"] .directory-layout',
        'body[data-page="directory"] .filters-panel'
      ],
      'Stylesheet'
    );

    const homeScript = await fetchText(baseUrl, '/scripts/home-page.js');
    assert(homeScript.response.ok, 'Failed to load /scripts/home-page.js');
    assertIncludes(homeScript.text, ['function wireHeroSearch()', 'async function renderActiveFeed()'], 'home-page.js');

    const directoryScript = await fetchText(baseUrl, '/scripts/directory-page.js');
    assert(directoryScript.response.ok, 'Failed to load /scripts/directory-page.js');
    assertIncludes(directoryScript.text, ['async function renderResults()', 'async function openDetail'], 'directory-page.js');

    const homeData = await fetchJson(baseUrl, '/api/home?clientId=ui_smoke_client');
    assert(homeData.response.ok, 'GET /api/home failed');
    assert(homeData.data?.hero?.title, 'Home payload missing hero.title');
    assert(Array.isArray(homeData.data?.feedTabs), 'Home payload missing feedTabs');

    const tools = await fetchJson(baseUrl, '/api/tools?category=all&pricing=all&sort=featured&verified=false');
    assert(tools.response.ok, 'GET /api/tools failed');
    assert(Array.isArray(tools.data?.items), 'Tools payload missing items');
    assert(tools.data.items.length > 0, 'Tools payload has no items');
    assertToolFields(tools.data.items[0]);

    const clientId = 'ui_smoke_client_toggle';
    const targetSlug = tools.data.items[0].slug;

    const toggleOn = await fetchJson(baseUrl, '/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId, slug: targetSlug })
    });
    assert(toggleOn.response.ok, 'POST /api/favorites/toggle (on) failed');
    assert(Array.isArray(toggleOn.data?.items), 'Favorites toggle response missing items');

    const favorites = await fetchJson(baseUrl, `/api/favorites?clientId=${encodeURIComponent(clientId)}`);
    assert(favorites.response.ok, 'GET /api/favorites failed');
    assert(Array.isArray(favorites.data?.items), 'Favorites payload missing items');
    assert(
      favorites.data.items.some((item) => item.slug === targetSlug),
      'Favorited slug not found after toggle on'
    );

    const toggleOff = await fetchJson(baseUrl, '/api/favorites/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clientId, slug: targetSlug })
    });
    assert(toggleOff.response.ok, 'POST /api/favorites/toggle (off) failed');

    console.log(
      JSON.stringify(
        {
          ok: true,
          checkedAt: new Date().toISOString(),
          port,
          checks: {
            pages: pages.length,
            stylesheet: 1,
            scripts: 2,
            apiPayload: 2,
            favoriteToggleFlow: 1
          }
        },
        null,
        2
      )
    );
  } finally {
    server.close();
    if (originalState !== null) {
      fs.writeFileSync(STATE_FILE, originalState, 'utf8');
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
