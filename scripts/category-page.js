import {
  API,
  createCourseCard,
  createCreatorCard,
  createToolFeedCard,
  escapeHtml,
  formatCount,
  getClientId,
  loadFavorites,
  requestJson,
  setGlobalStatus,
  setSaveCount,
  toggleFavorite,
  wireFavoriteButtons
} from './discovery-core.js';

const state = {
  clientId: '',
  category: null,
  favorites: [],
  favoriteSlugs: new Set()
};

function getSlug() {
  const pathMatch = window.location.pathname.match(/^\/category\/([^/?#]+)/);
  if (pathMatch && pathMatch[1]) {
    try {
      return decodeURIComponent(pathMatch[1]);
    } catch (_error) {
      return pathMatch[1];
    }
  }

  return new URLSearchParams(window.location.search).get('slug') || '';
}

function renderCategory(category) {
  document.getElementById('categoryLabel').textContent = category.label;
  document.getElementById('categoryHeroCopy').textContent = category.heroCopy;
  document.getElementById('categoryDescription').textContent = category.shortDescription;
  document.getElementById('categoryToolCount').textContent = formatCount(category.toolCount);
  document.getElementById('categoryCourseCount').textContent = formatCount(category.courseCount);
  document.getElementById('categoryCreatorCount').textContent = formatCount(category.creatorCount);

  const toolsGrid = document.getElementById('categoryToolsGrid');
  toolsGrid.innerHTML = category.relatedTools
    .map((tool) => createToolFeedCard(tool, state.favoriteSlugs, { showCounts: false }))
    .join('');
  wireFavoriteButtons(toolsGrid, handleToggleFavorite);

  const coursesGrid = document.getElementById('categoryCoursesGrid');
  coursesGrid.innerHTML = category.relatedCourses.length
    ? category.relatedCourses.map((course) => createCourseCard(course)).join('')
    : '<div class="empty-state"><h3>No courses yet</h3><p class="empty-copy">This category does not have attached courses yet.</p></div>';

  const creatorsGrid = document.getElementById('categoryCreatorsGrid');
  creatorsGrid.innerHTML = category.relatedCreators.length
    ? category.relatedCreators.map((creator) => createCreatorCard(creator)).join('')
    : '<div class="empty-state"><h3>No creators yet</h3><p class="empty-copy">This category does not have attached creators yet.</p></div>';
}

async function handleToggleFavorite(slug) {
  state.favorites = await toggleFavorite(state.clientId, slug);
  state.favoriteSlugs = new Set(state.favorites.map((item) => item.slug));
  setSaveCount(state.favorites.length);
  renderCategory(state.category);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const slug = getSlug();
    if (!slug) {
      throw new Error('Category slug is required');
    }

    state.clientId = getClientId();
    const [category, favorites] = await Promise.all([
      requestJson(`${API.categories}/${encodeURIComponent(slug)}`),
      loadFavorites(state.clientId)
    ]);

    state.category = category;
    state.favorites = favorites;
    state.favoriteSlugs = new Set(favorites.map((item) => item.slug));
    setSaveCount(favorites.length);
    renderCategory(category);
  } catch (error) {
    setGlobalStatus(error.message, true);
  }
});
