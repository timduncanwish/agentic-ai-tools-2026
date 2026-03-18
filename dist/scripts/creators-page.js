import {
  API,
  createCreatorCard,
  escapeHtml,
  formatCompactCount,
  formatCount,
  requestJson,
  setGlobalStatus
} from './discovery-core.js';

const state = {
  items: [],
  category: 'all',
  sort: 'featured',
  q: '',
  platform: 'all'
};

function renderCategoryFilters(categories) {
  const container = document.getElementById('creatorCategoryFilters');
  container.innerHTML = [
    '<button class="filter-pill is-active" data-category="all" type="button">All focuses</button>',
    ...categories.map(
      (category) => `<button class="filter-pill" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`
    )
  ].join('');

  container.querySelectorAll('.filter-pill').forEach((button) => {
    button.addEventListener('click', async () => {
      state.category = button.dataset.category;
      await loadCreators();
    });
  });
}

function syncFilterPills() {
  document.querySelectorAll('#creatorCategoryFilters .filter-pill').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.category === state.category);
  });
}

function renderCreators() {
  const grid = document.getElementById('creatorsGrid');
  const count = document.getElementById('creatorResultsCount');
  const spotlight = document.getElementById('creatorPageSpotlight');
  const empty = document.getElementById('creatorEmptyState');

  count.textContent = `${formatCount(state.items.length)} creators`;
  empty.classList.toggle('hidden', state.items.length > 0);

  if (!state.items.length) {
    grid.innerHTML = '';
    spotlight.innerHTML = '';
    syncFilterPills();
    return;
  }

  const featured = state.items[0];
  spotlight.innerHTML = `
    <div class="glass-card">
      <strong>Featured creator</strong>
      <h2 style="margin-top: 14px;">${escapeHtml(featured.name)}</h2>
      <p class="card-copy" style="margin-top: 12px;">${escapeHtml(featured.bio)}</p>
      <div class="meta-row" style="margin-top: 14px;">
        <span class="meta-chip is-brand">${escapeHtml(featured.platform)}</span>
        <span class="meta-chip">${formatCompactCount(featured.subscriberCount)} audience</span>
        <span class="meta-chip">${formatCompactCount(featured.monthlyViews)} views</span>
      </div>
      <div class="tag-row" style="margin-top: 14px;">
        ${(featured.categoryFocus || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}
      </div>
      <div class="tool-actions" style="margin-top: 16px;">
        <a class="button" href="${escapeHtml(featured.channelUrl)}" target="_blank" rel="noreferrer">Open channel</a>
      </div>
    </div>
  `;

  grid.innerHTML = state.items.map((creator) => createCreatorCard(creator)).join('');
  syncFilterPills();
}

async function loadCreators() {
  const query = new URLSearchParams({
    category: state.category,
    sort: state.sort,
    q: state.q,
    platform: state.platform
  });
  const data = await requestJson(`${API.creators}?${query.toString()}`);
  state.items = data.items;
  renderCreators();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const initial = await requestJson(`${API.creators}?category=all&sort=featured`);
    state.items = initial.items;
    renderCategoryFilters(
      [...new Set(initial.items.flatMap((item) => item.categoryFocus || []))]
    );
    document.getElementById('creatorSearch').addEventListener('input', async (event) => {
      state.q = event.target.value.trim();
      await loadCreators();
    });
    document.getElementById('creatorPlatform').addEventListener('change', async (event) => {
      state.platform = event.target.value;
      await loadCreators();
    });
    document.getElementById('creatorSort').addEventListener('change', async (event) => {
      state.sort = event.target.value;
      await loadCreators();
    });
    renderCreators();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
