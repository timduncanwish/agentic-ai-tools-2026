import {
  API,
  createCourseCard,
  escapeHtml,
  formatCount,
  requestJson,
  setGlobalStatus
} from './discovery-core.js';

const state = {
  items: [],
  category: 'all',
  sort: 'popular',
  q: '',
  level: 'all'
};

function renderCategoryFilters(categories) {
  const container = document.getElementById('courseCategoryFilters');
  container.innerHTML = [
    '<button class="filter-pill is-active" data-category="all" type="button">All categories</button>',
    ...categories.map(
      (category) => `<button class="filter-pill" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`
    )
  ].join('');

  container.querySelectorAll('.filter-pill').forEach((button) => {
    button.addEventListener('click', async () => {
      state.category = button.dataset.category;
      await loadCourses();
    });
  });
}

function syncFilterPills() {
  document.querySelectorAll('#courseCategoryFilters .filter-pill').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.category === state.category);
  });
}

function renderCourses() {
  const grid = document.getElementById('coursesGrid');
  const count = document.getElementById('courseResultsCount');
  const spotlight = document.getElementById('courseSpotlight');
  const empty = document.getElementById('courseEmptyState');

  count.textContent = `${formatCount(state.items.length)} courses`;
  empty.classList.toggle('hidden', state.items.length > 0);

  if (!state.items.length) {
    grid.innerHTML = '';
    spotlight.innerHTML = '';
    syncFilterPills();
    return;
  }

  const [featured, ...rest] = state.items;

  spotlight.innerHTML = `
    <div class="glass-card">
      <strong>Current spotlight</strong>
      <h2 style="margin-top: 14px;">${escapeHtml(featured.title)}</h2>
      <p class="card-copy" style="margin-top: 12px;">${escapeHtml(featured.summary)}</p>
      <div class="meta-row" style="margin-top: 14px;">
        <span class="meta-chip is-brand">${escapeHtml(featured.provider)}</span>
        <span class="meta-chip">${escapeHtml(featured.level)}</span>
        <span class="meta-chip">${escapeHtml(featured.category)}</span>
      </div>
      <div class="tool-actions" style="margin-top: 16px;">
        <a class="button" href="${escapeHtml(featured.landingUrl)}" target="_blank" rel="noreferrer">Open course</a>
        <a class="button-ghost" href="${escapeHtml(featured.previewUrl)}" target="_blank" rel="noreferrer">Watch preview</a>
      </div>
    </div>
  `;

  grid.innerHTML = [featured, ...rest].map((course) => createCourseCard(course)).join('');
  syncFilterPills();
}

async function loadCourses() {
  const query = new URLSearchParams({
    category: state.category,
    sort: state.sort,
    q: state.q,
    level: state.level
  });
  const data = await requestJson(`${API.courses}?${query.toString()}`);
  state.items = data.items;
  renderCourses();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const initial = await requestJson(`${API.courses}?category=all&sort=popular`);
    state.items = initial.items;
    renderCategoryFilters([...new Set(initial.items.map((item) => item.category))]);
    document.getElementById('courseSearch').addEventListener('input', async (event) => {
      state.q = event.target.value.trim();
      await loadCourses();
    });
    document.getElementById('courseLevel').addEventListener('change', async (event) => {
      state.level = event.target.value;
      await loadCourses();
    });
    document.getElementById('courseSort').addEventListener('change', async (event) => {
      state.sort = event.target.value;
      await loadCourses();
    });
    renderCourses();
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
