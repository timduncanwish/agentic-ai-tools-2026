#!/usr/bin/env node

const { startServer } = require('../server');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const text = await response.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = null;
  }

  return { response, data, text };
}

async function fetchPage(baseUrl, pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const text = await response.text();
  return { response, text };
}

async function main() {
  const port = Number.parseInt(process.env.SMOKE_PORT || '3120', 10);
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startServer(port);

  try {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const health = await fetchJson(baseUrl, '/api/health');
    assert(health.response.ok, 'GET /api/health failed');
    assert(health.data && health.data.ok === true, 'Health payload missing ok=true');

    const home = await fetchJson(baseUrl, '/api/home?clientId=smoke_client');
    assert(home.response.ok, 'GET /api/home failed');
    assert(home.data && home.data.hero && home.data.stats, 'Home payload missing hero/stats');
    assert(Array.isArray(home.data.feedTabs), 'Home payload missing feedTabs array');

    const spotlights = await fetchJson(baseUrl, '/api/home/spotlights');
    assert(spotlights.response.ok, 'GET /api/home/spotlights failed');
    assert(Array.isArray(spotlights.data?.trendingCategories), 'Spotlights payload missing trendingCategories');

    for (const tab of ['popular-tools', 'recent-tools', 'popular-courses']) {
      const feed = await fetchJson(baseUrl, `/api/home-feed?tab=${encodeURIComponent(tab)}`);
      assert(feed.response.ok, `GET /api/home-feed?tab=${tab} failed`);
      assert(Array.isArray(feed.data?.items), `Home feed ${tab} missing items array`);
    }

    const categories = await fetchJson(baseUrl, '/api/categories');
    assert(categories.response.ok, 'GET /api/categories failed');
    assert(Array.isArray(categories.data?.items), 'Categories payload missing items');

    const categorySlug = categories.data.items[0]?.slug || 'assistant';
    const categoryDetail = await fetchJson(baseUrl, `/api/categories/${encodeURIComponent(categorySlug)}`);
    assert(categoryDetail.response.ok, 'GET /api/categories/:slug failed');
    assert(categoryDetail.data?.slug === categorySlug, 'Category detail slug mismatch');

    const tools = await fetchJson(baseUrl, '/api/tools?category=all&pricing=all&sort=featured&verified=false');
    assert(tools.response.ok, 'GET /api/tools failed');
    assert(Array.isArray(tools.data?.items), 'Tools payload missing items');

    const toolSlug = tools.data.items[0]?.slug;
    if (toolSlug) {
      const toolDetail = await fetchJson(baseUrl, `/api/tools/${encodeURIComponent(toolSlug)}`);
      assert(toolDetail.response.ok, 'GET /api/tools/:slug failed');
      assert(toolDetail.data?.slug === toolSlug, 'Tool detail slug mismatch');
    }

    const courses = await fetchJson(baseUrl, '/api/courses?category=all&sort=popular&level=all');
    assert(courses.response.ok, 'GET /api/courses failed');
    assert(Array.isArray(courses.data?.items), 'Courses payload missing items');

    const creators = await fetchJson(baseUrl, '/api/creators?category=all&sort=featured&platform=all');
    assert(creators.response.ok, 'GET /api/creators failed');
    assert(Array.isArray(creators.data?.items), 'Creators payload missing items');

    const pages = [
      '/',
      '/tools-directory.html',
      '/courses.html',
      '/creators.html',
      '/submit-tool.html',
      '/admin.html',
      `/category/${encodeURIComponent(categorySlug)}`
    ];

    for (const pathname of pages) {
      const page = await fetchPage(baseUrl, pathname);
      assert(page.response.ok, `Page check failed: ${pathname}`);
      assert(page.text.includes('<!DOCTYPE html>') || page.text.includes('<html'), `Invalid HTML response for ${pathname}`);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          checkedAt: new Date().toISOString(),
          port,
          checks: {
            api: 11,
            pages: pages.length
          }
        },
        null,
        2
      )
    );
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
