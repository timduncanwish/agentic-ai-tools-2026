import {
  API,
  createCourseCard,
  createToolFeedCard,
  escapeHtml,
  formatCompactCount,
  formatCount,
  getClientId,
  loadFavorites,
  renderShortlist,
  requestJson,
  setGlobalStatus,
  setSaveCount,
  toggleFavorite,
  wireFavoriteButtons
} from './discovery-core.js';

const state = {
  clientId: '',
  home: null,
  spotlights: null,
  favoriteSlugs: new Set(),
  favorites: [],
  activeTab: 'popular-tools',
  feedCache: new Map()
};

function renderHero(hero) {
  document.getElementById('heroEyebrow').textContent = hero.eyebrow;
  document.getElementById('heroTitle').textContent = hero.title;
  document.getElementById('heroDescription').textContent = hero.description;

  const primary = document.getElementById('heroPrimaryCta');
  primary.textContent = hero.primaryCta.label;
  primary.href = hero.primaryCta.href;

  const secondary = document.getElementById('heroSecondaryCta');
  secondary.textContent = hero.secondaryCta.label;
  secondary.href = hero.secondaryCta.href;
}

function renderTrustStrip(items) {
  const container = document.getElementById('trustStrip');
  container.innerHTML = items.map((item) => `<div class="trust-item">${escapeHtml(item)}</div>`).join('');
}

function renderStats(stats) {
  document.getElementById('toolCount').textContent = formatCount(stats.toolCount);
  document.getElementById('courseCount').textContent = formatCount(stats.courseCount);
  document.getElementById('creatorCount').textContent = formatCount(stats.creatorCount);
  document.getElementById('categoryCount').textContent = formatCount(stats.categoryCount);
}

function renderCategoryRail(categories) {
  const rail = document.getElementById('homeCategoryRail');
  const chips = document.getElementById('categorySpotlightGrid');

  rail.innerHTML = categories
    .map(
      (category) => `
        <a class="category-rail-item" href="${escapeHtml(category.href)}">
          <span class="category-rail-icon">${escapeHtml(category.icon || category.label[0])}</span>
          <span>
            <strong>${escapeHtml(category.label)}</strong>
            <span class="category-rail-copy">${escapeHtml(category.shortDescription)}</span>
          </span>
        </a>
      `
    )
    .join('');

  chips.innerHTML = categories
    .map(
      (category) => `
        <a class="category-spotlight-chip" href="${escapeHtml(category.href)}">
          <strong>${escapeHtml(category.label)}</strong>
          <span>${formatCount(category.toolCount)} tools</span>
        </a>
      `
    )
    .join('');
}

function renderCollections(collections) {
  const grid = document.getElementById('collectionGrid');
  grid.innerHTML = collections
    .map(
      (collection) => `
        <article class="collection-card">
          <h3>${escapeHtml(collection.title)}</h3>
          <p class="card-copy">${escapeHtml(collection.description)}</p>
          <div class="collection-tools">
            ${collection.tools.map((tool) => `<span class="pill">${escapeHtml(tool.name)}</span>`).join('')}
          </div>
        </article>
      `
    )
    .join('');
}

function renderSpotlight(spotlight) {
  const container = document.getElementById('creatorSpotlight');
  if (!spotlight) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="creator-spotlight-copy">
      <span class="eyebrow">Creator spotlight</span>
      <h2>${escapeHtml(spotlight.name)}</h2>
      <p class="card-copy">${escapeHtml(spotlight.bio)}</p>
      <div class="creator-spotlight-stats">
        <div class="meta-metric">
          <strong>${formatCompactCount(spotlight.subscriberCount)}</strong>
          <span class="meta-copy">Audience</span>
        </div>
        <div class="meta-metric">
          <strong>${formatCompactCount(spotlight.monthlyViews)}</strong>
          <span class="meta-copy">Monthly views</span>
        </div>
        <div class="meta-metric">
          <strong>${formatCount(spotlight.courseCount)}</strong>
          <span class="meta-copy">Courses</span>
        </div>
      </div>
      <div class="tag-row">
        ${spotlight.categoryFocus.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}
      </div>
      <div class="tool-actions">
        <a class="button" href="${escapeHtml(spotlight.channelUrl)}" target="_blank" rel="noreferrer">Open channel</a>
        <a class="button-ghost" href="/creators.html">Browse creators</a>
      </div>
    </div>
    <div class="creator-spotlight-side">
      <div class="spotlight-card-stack">
        <div class="glass-card">
          <strong>Featured videos</strong>
          <div class="spotlight-link-list">
            ${spotlight.featuredVideos
              .map((video) => `<a href="${escapeHtml(video.url)}" target="_blank" rel="noreferrer">${escapeHtml(video.title)}</a>`)
              .join('')}
          </div>
        </div>
        <div class="glass-card">
          <strong>Related courses</strong>
          <div class="spotlight-pill-list">
            ${spotlight.featuredCourses.map((course) => `<span class="pill">${escapeHtml(course.title)}</span>`).join('')}
          </div>
        </div>
        <div class="glass-card">
          <strong>Related tools</strong>
          <div class="spotlight-pill-list">
            ${spotlight.relatedTools.map((tool) => `<span class="pill">${escapeHtml(tool.name)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFeedTabs(tabs) {
  const tabList = document.getElementById('homeFeedTabs');
  tabList.innerHTML = tabs
    .map(
      (tab) => `
        <button class="feed-tab ${tab.key === state.activeTab ? 'is-active' : ''}" data-tab="${escapeHtml(tab.key)}" type="button">
          ${escapeHtml(tab.label)}
        </button>
      `
    )
    .join('');

  tabList.querySelectorAll('.feed-tab').forEach((button) => {
    button.addEventListener('click', async () => {
      state.activeTab = button.dataset.tab;
      renderFeedTabs(tabs);
      try {
        await renderActiveFeed();
      } catch (error) {
        setGlobalStatus(error.message, true);
      }
    });
  });
}

function primeFeedCache(tabs) {
  tabs.forEach((tab) => {
    if (Array.isArray(tab.items)) {
      state.feedCache.set(tab.key, {
        type: tab.type,
        items: tab.items
      });
    }
  });
}

async function ensureTabFeed(activeTab) {
  if (state.feedCache.has(activeTab.key)) {
    return state.feedCache.get(activeTab.key);
  }

  const data = await requestJson(`${API.homeFeed}?tab=${encodeURIComponent(activeTab.key)}`);
  const payload = {
    type: data.type || activeTab.type || 'tools',
    items: Array.isArray(data.items) ? data.items : []
  };
  state.feedCache.set(activeTab.key, payload);
  return payload;
}

async function renderActiveFeed() {
  const active = state.home.feedTabs.find((tab) => tab.key === state.activeTab) || state.home.feedTabs[0];
  const grid = document.getElementById('homeFeedGrid');
  if (!active) {
    grid.className = 'home-feed-grid';
    grid.innerHTML = '';
    return;
  }
  const feed = await ensureTabFeed(active);

  if (feed.type === 'courses') {
    grid.className = 'home-feed-grid is-courses';
    grid.innerHTML = feed.items.map((course) => createCourseCard(course)).join('');
    return;
  }

  grid.className = 'home-feed-grid';
  grid.innerHTML = feed.items.map((tool) => createToolFeedCard(tool, state.favoriteSlugs)).join('');
  wireFavoriteButtons(grid, handleToggleFavorite);
}

function renderShortlistSection() {
  renderShortlist(document.getElementById('shortlistGrid'), state.favorites, state.favoriteSlugs);

  const strip = document.getElementById('savedStrip');
  strip.innerHTML = state.favorites.length
    ? state.favorites.slice(0, 5).map((tool) => `<span class="pill">${escapeHtml(tool.name)}</span>`).join('')
    : '<span class="pill">Save tools to keep a working shortlist.</span>';
}

async function handleToggleFavorite(slug) {
  state.favorites = await toggleFavorite(state.clientId, slug);
  state.favoriteSlugs = new Set(state.favorites.map((item) => item.slug));
  setSaveCount(state.favorites.length);
  renderShortlistSection();
  await renderActiveFeed();
}

function wireNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  const status = document.getElementById('newsletterStatus');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Submitting...';
    status.classList.remove('error');

    try {
      await requestJson(API.newsletter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: form.email.value,
          role: form.role.value
        })
      });

      status.textContent = 'Subscribed. You are on the weekly shortlist.';
      form.reset();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add('error');
    }
  });
}

function wireHeroSearch() {
  const form = document.getElementById('heroSearchForm');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = document.getElementById('heroSearchInput').value.trim();
    window.location.href = `/tools-directory.html?q=${encodeURIComponent(query)}`;
  });
}

async function init() {
  state.clientId = getClientId();

  const [home, spotlights, favorites] = await Promise.all([
    requestJson(`${API.home}?clientId=${encodeURIComponent(state.clientId)}`),
    requestJson(API.homeSpotlights),
    loadFavorites(state.clientId)
  ]);

  state.home = home;
  state.spotlights = spotlights;
  state.favorites = favorites;
  state.favoriteSlugs = new Set(favorites.map((item) => item.slug));
  primeFeedCache(home.feedTabs || []);

  const trendingCategories = state.spotlights.trendingCategories || state.home.showcaseCategories || [];
  const creatorSpotlight = state.spotlights.creatorSpotlight || state.home.creatorSpotlight || null;
  const editorialCollections = state.spotlights.editorialCollections || state.home.curatedCollections || [];

  renderHero(home.hero);
  renderTrustStrip(home.trustStrip);
  renderStats(home.stats);
  renderCategoryRail(trendingCategories);
  renderCollections(editorialCollections);
  renderSpotlight(creatorSpotlight);
  renderFeedTabs(home.feedTabs);
  await renderActiveFeed();
  renderShortlistSection();
  setSaveCount(favorites.length);
  wireHeroSearch();
  wireNewsletterForm();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
