import {
  API,
  escapeHtml,
  formatCount,
  formatDate,
  getClientId,
  loadFavorites,
  requestJson,
  setGlobalStatus,
  setSaveCount,
  toggleFavorite,
  wireFavoriteButtons
} from './discovery-core.js';

const state = {
  q: '',
  category: 'all',
  pricing: 'all',
  verified: false,
  listingTier: 'all',
  sort: 'featured',
  clientId: '',
  favoriteSlugs: new Set(),
  currentDetailSlug: ''
};

function syncDirectoryUrl() {
  const params = new URLSearchParams();

  if (state.q) {
    params.set('q', state.q);
  }

  if (state.category !== 'all') {
    params.set('category', state.category);
  }

  if (state.pricing !== 'all') {
    params.set('pricing', state.pricing);
  }

  if (state.verified) {
    params.set('verified', 'true');
  }

  if (state.listingTier !== 'all') {
    params.set('listingTier', state.listingTier);
  }

  if (state.sort !== 'featured') {
    params.set('sort', state.sort);
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
}

function createDirectoryToolCard(tool, favoriteSlugs) {
  const saved = favoriteSlugs.has(tool.slug);
  const tags = Array.isArray(tool.tags) ? tool.tags.slice(0, 4) : [];

  return `
    <article class="tool-card">
      <div class="tool-head">
        <div>
          <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
          <div class="tool-subcategory">${escapeHtml(tool.subcategory)}</div>
        </div>
        <span class="meta-chip rating-chip">Rating ${escapeHtml(Number(tool.rating || 0).toFixed(1))}</span>
      </div>
      <p class="card-copy">${escapeHtml(tool.description)}</p>
      <div class="meta-row">
        <span class="meta-chip">${escapeHtml(tool.categoryLabel)}</span>
        <span class="meta-chip">${escapeHtml(tool.pricingLabel)}</span>
        ${tool.verified ? '<span class="meta-chip is-brand"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -1px; margin-right: 2px;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Verified</span>' : ''}
        ${tool.featured ? '<span class="meta-chip is-accent">Featured</span>' : ''}
      </div>
      <div class="tag-row">
        ${tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <p class="meta-copy">${escapeHtml(tool.editorialNote)}</p>
      <div class="tool-actions">
        <button class="button-secondary js-toggle-save" data-slug="${escapeHtml(tool.slug)}" type="button">
          ${saved ? 'Saved' : 'Save'}
        </button>
        <a class="button" href="${escapeHtml(tool.websiteUrl)}" target="_blank" rel="noreferrer">Visit site</a>
        ${tool.reviewUrl ? `<a class="button-ghost" href="${escapeHtml(tool.reviewUrl)}">Read review</a>` : ''}
        <button class="button-ghost js-open-detail" data-slug="${escapeHtml(tool.slug)}" type="button">Quick view</button>
        <span class="meta-chip">Reviewed ${escapeHtml(formatDate(tool.updatedAt))}</span>
      </div>
    </article>
  `;
}

function wireDetailButtons(root, onOpen) {
  root.querySelectorAll('.js-open-detail').forEach((button) => {
    button.addEventListener('click', () => onOpen(button.dataset.slug));
  });
}

function getField(id) {
  return document.getElementById(id);
}

function syncCategoryPills() {
  document.querySelectorAll('#categoryFilters .filter-pill').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.category === state.category);
  });
}

async function openDetail(slug) {
  const tool = await requestJson(`${API.tools}/${encodeURIComponent(slug)}`);

  state.currentDetailSlug = tool.slug;
  getField('toolDetailName').textContent = tool.name;
  getField('toolDetailSubcategory').textContent = tool.subcategory;
  getField('toolDetailDescription').textContent = tool.description;
  getField('toolDetailEditorial').textContent = tool.editorialNote;
  getField('toolDetailWebsite').href = tool.websiteUrl;

  const reviewLink = getField('toolDetailReview');
  reviewLink.href = tool.reviewUrl || '#';
  reviewLink.classList.toggle('hidden', !tool.reviewUrl);

  const saveButton = getField('toolDetailSave');
  saveButton.textContent = state.favoriteSlugs.has(tool.slug) ? 'Saved' : 'Save';

  getField('toolDetailTags').innerHTML = (tool.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('');
  getField('toolDetailMeta').innerHTML = [
    ['Category', tool.categoryLabel],
    ['Pricing', tool.pricingLabel],
    ['Rating', Number(tool.rating || 0).toFixed(1)],
    ['Updated', formatDate(tool.updatedAt)]
  ]
    .map(
      ([label, value]) => `
        <div class="detail-metric">
          <strong>${escapeHtml(label)}</strong>
          <div class="meta-copy">${escapeHtml(value)}</div>
        </div>
      `
    )
    .join('');

  getField('toolDetailCard').classList.remove('hidden');
}

async function renderResults() {
  syncDirectoryUrl();

  const query = new URLSearchParams({
    q: state.q,
    category: state.category,
    pricing: state.pricing,
    sort: state.sort,
    verified: String(state.verified),
    listingTier: state.listingTier
  });

  const data = await requestJson(`${API.tools}?${query.toString()}`);
  const resultsCount = getField('resultsCount');
  const resultGrid = getField('directoryGrid');
  const emptyState = getField('emptyState');
  const detailCard = getField('toolDetailCard');
  const detailSave = getField('toolDetailSave');

  resultsCount.textContent = `${formatCount(data.total)} tools`;
  resultGrid.innerHTML = data.items.map((tool) => createDirectoryToolCard(tool, state.favoriteSlugs)).join('');
  emptyState.classList.toggle('hidden', data.total > 0);

  if (data.total === 0) {
    state.currentDetailSlug = '';
    detailCard.classList.add('hidden');
  }

  wireFavoriteButtons(resultGrid, async (slug) => {
    const updated = await toggleFavorite(state.clientId, slug);
    state.favoriteSlugs = new Set(updated.map((item) => item.slug));
    setSaveCount(updated.length);
    if (slug === state.currentDetailSlug) {
      detailSave.textContent = state.favoriteSlugs.has(slug) ? 'Saved' : 'Save';
    }
    await renderResults();
  });

  wireDetailButtons(resultGrid, openDetail);
  syncCategoryPills();
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  state.q = params.get('q') || '';
  state.category = params.get('category') || 'all';
  state.pricing = params.get('pricing') || 'all';
  state.verified = params.get('verified') === 'true';
  state.listingTier = params.get('listingTier') || 'all';
  state.sort = params.get('sort') || 'featured';
  state.clientId = getClientId();

  const [categoryData, favorites] = await Promise.all([requestJson(API.categories), loadFavorites(state.clientId)]);
  state.favoriteSlugs = new Set(favorites.map((item) => item.slug));
  setSaveCount(favorites.length);

  const searchInput = getField('directorySearch');
  const pricingSelect = getField('pricingFilter');
  const sortSelect = getField('sortFilter');
  const verifiedCheckbox = getField('verifiedFilter');
  const tierSelect = getField('tierFilter');
  const categoryFilters = getField('categoryFilters');
  const resetFilters = getField('resetFilters');
  const detailSave = getField('toolDetailSave');

  searchInput.value = state.q;
  pricingSelect.value = state.pricing;
  sortSelect.value = state.sort;
  verifiedCheckbox.checked = state.verified;
  tierSelect.value = state.listingTier;

  categoryFilters.innerHTML = [
    '<button class="filter-pill" data-category="all" type="button">All categories</button>',
    ...categoryData.items.map(
      (item) =>
        `<button class="filter-pill" data-category="${escapeHtml(item.slug)}" type="button">${escapeHtml(item.label)} (${formatCount(item.count)})</button>`
    )
  ].join('');

  detailSave.addEventListener('click', async () => {
    if (!state.currentDetailSlug) {
      return;
    }

    const updated = await toggleFavorite(state.clientId, state.currentDetailSlug);
    state.favoriteSlugs = new Set(updated.map((item) => item.slug));
    detailSave.textContent = state.favoriteSlugs.has(state.currentDetailSlug) ? 'Saved' : 'Save';
    setSaveCount(updated.length);
    await renderResults();
  });

  categoryFilters.addEventListener('click', async (event) => {
    const button = event.target.closest('.filter-pill');
    if (!button) {
      return;
    }

    state.category = button.dataset.category;
    await renderResults();
  });

  searchInput.addEventListener('input', async () => {
    state.q = searchInput.value.trim();
    await renderResults();
  });

  pricingSelect.addEventListener('change', async () => {
    state.pricing = pricingSelect.value;
    await renderResults();
  });

  sortSelect.addEventListener('change', async () => {
    state.sort = sortSelect.value;
    await renderResults();
  });

  verifiedCheckbox.addEventListener('change', async () => {
    state.verified = verifiedCheckbox.checked;
    await renderResults();
  });

  tierSelect.addEventListener('change', async () => {
    state.listingTier = tierSelect.value;
    await renderResults();
  });

  resetFilters.addEventListener('click', async () => {
    state.q = '';
    state.category = 'all';
    state.pricing = 'all';
    state.sort = 'featured';
    state.verified = false;
    state.listingTier = 'all';

    searchInput.value = '';
    pricingSelect.value = 'all';
    sortSelect.value = 'featured';
    verifiedCheckbox.checked = false;
    tierSelect.value = 'all';
    await renderResults();
  });

  await renderResults();

  if (state.q || state.category !== 'all') {
    const firstCard = document.querySelector('#directoryGrid .js-open-detail');
    if (firstCard) {
      await openDetail(firstCard.dataset.slug);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
