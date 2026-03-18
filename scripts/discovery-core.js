export const API = {
  home: '/api/home',
  homeFeed: '/api/home-feed',
  categories: '/api/categories',
  tools: '/api/tools',
  courses: '/api/courses',
  creators: '/api/creators',
  favorites: '/api/favorites',
  toggleFavorite: '/api/favorites/toggle',
  newsletter: '/api/newsletter'
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getClientId() {
  const storageKey = 'agentic-client-id';
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const generated = `client_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  localStorage.setItem(storageKey, generated);
  return generated;
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

export function formatCompactCount(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

export function setSaveCount(count) {
  document.querySelectorAll('[data-save-count]').forEach((node) => {
    node.textContent = formatCount(count);
  });
}

export async function loadFavorites(clientId) {
  const data = await requestJson(`${API.favorites}?clientId=${encodeURIComponent(clientId)}`);
  return data.items;
}

export async function toggleFavorite(clientId, slug) {
  const data = await requestJson(API.toggleFavorite, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clientId, slug })
  });

  return data.items;
}

function getInitials(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function createToolFeedCard(tool, favoriteSlugs, options = {}) {
  const saved = favoriteSlugs.has(tool.slug);
  const tags = Array.isArray(tool.tags) ? tool.tags.slice(0, 3) : [];

  return `
    <article class="feed-card tool-feed-card">
      <div class="feed-card-top">
        <div class="feed-card-brand">
          <div class="feed-card-logo">${escapeHtml(getInitials(tool.name))}</div>
          <div>
            <h3 class="feed-card-title">${escapeHtml(tool.name)}</h3>
            <div class="feed-card-subtitle">${escapeHtml(tool.subcategory || tool.categoryLabel)}</div>
          </div>
        </div>
        <div class="feed-card-metrics">
          <span class="meta-chip rating-chip">Rating ${escapeHtml(tool.rating.toFixed(1))}</span>
          ${options.showCounts === false ? '' : `<span class="meta-chip">${formatCompactCount(tool.saveCount)} saves</span>`}
        </div>
      </div>
      <p class="card-copy">${escapeHtml(tool.description)}</p>
      <div class="tag-row">
        ${tags.map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="meta-row">
        <span class="meta-chip">${escapeHtml(tool.categoryLabel)}</span>
        <span class="meta-chip">${escapeHtml(tool.pricingLabel)}</span>
        <span class="meta-chip">Listed ${escapeHtml(formatDate(tool.listedAt || tool.updatedAt))}</span>
        ${tool.verified ? '<span class="meta-chip is-brand">Verified</span>' : ''}
      </div>
      <div class="tool-actions">
        <button class="button-secondary js-toggle-save" data-slug="${escapeHtml(tool.slug)}" type="button">
          ${saved ? 'Saved' : 'Save'}
        </button>
        <a class="button" href="${escapeHtml(tool.websiteUrl)}" target="_blank" rel="noreferrer">Visit site</a>
        ${tool.reviewUrl ? `<a class="button-ghost" href="${escapeHtml(tool.reviewUrl)}">Read review</a>` : ''}
      </div>
    </article>
  `;
}

export function createCourseCard(course) {
  const tags = Array.isArray(course.tags) ? course.tags.slice(0, 3) : [];

  return `
    <article class="feed-card course-feed-card">
      <div class="course-media">
        <span class="course-media-badge">${escapeHtml(course.level)}</span>
      </div>
      <div class="course-copy">
        <div class="meta-row">
          <span class="meta-chip is-brand">${escapeHtml(course.provider)}</span>
          <span class="meta-chip">${formatCompactCount(course.popularityScore)} score</span>
        </div>
        <h3 class="feed-card-title">${escapeHtml(course.title)}</h3>
        <div class="feed-card-subtitle">With ${escapeHtml(course.instructor)}</div>
        <p class="card-copy">${escapeHtml(course.summary)}</p>
        <div class="tag-row">
          ${tags.map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="tool-actions">
          <a class="button" href="${escapeHtml(course.landingUrl)}" target="_blank" rel="noreferrer">Open course</a>
          <a class="button-ghost" href="${escapeHtml(course.previewUrl)}" target="_blank" rel="noreferrer">Watch preview</a>
        </div>
      </div>
    </article>
  `;
}

export function createCreatorCard(creator) {
  const focuses = Array.isArray(creator.categoryFocus) ? creator.categoryFocus.slice(0, 3) : [];

  return `
    <article class="creator-card panel">
      <div class="creator-card-head">
        <div class="creator-avatar">${escapeHtml(getInitials(creator.name))}</div>
        <div>
          <h3 class="feed-card-title">${escapeHtml(creator.name)}</h3>
          <div class="feed-card-subtitle">${escapeHtml(creator.roleLabel)}</div>
        </div>
      </div>
      <p class="card-copy">${escapeHtml(creator.bio)}</p>
      <div class="creator-metrics">
        <span class="meta-chip">${formatCompactCount(creator.subscriberCount)} audience</span>
        <span class="meta-chip">${formatCompactCount(creator.monthlyViews)} monthly views</span>
        <span class="meta-chip">${formatCount(creator.courseCount)} courses</span>
      </div>
      <div class="tag-row">
        ${focuses.map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join('')}
      </div>
      <div class="tool-actions">
        <a class="button" href="${escapeHtml(creator.channelUrl)}" target="_blank" rel="noreferrer">Open channel</a>
      </div>
    </article>
  `;
}

export function renderShortlist(container, favorites, favoriteSlugs) {
  if (!container) {
    return;
  }

  if (!favorites.length) {
    container.innerHTML = `
      <div class="shortlist-empty glass-card">
        <h3>No saved tools yet</h3>
        <p class="empty-copy">Save a few tools from the discovery feed or directory to build a shortlist.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = favorites
    .map((tool) => createToolFeedCard(tool, favoriteSlugs, { showCounts: false }))
    .join('');
}

export function wireFavoriteButtons(root, onToggle) {
  if (!root) {
    return;
  }

  root.querySelectorAll('.js-toggle-save').forEach((button) => {
    button.addEventListener('click', () => onToggle(button.dataset.slug));
  });
}

export function setGlobalStatus(message, isError = false) {
  const status = document.querySelector('[data-global-status]');
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle('error', isError);
}
