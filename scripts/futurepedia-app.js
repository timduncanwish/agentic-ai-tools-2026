const API = {
  home: '/api/home',
  categories: '/api/categories',
  tools: '/api/tools',
  favorites: '/api/favorites',
  toggleFavorite: '/api/favorites/toggle',
  newsletter: '/api/newsletter',
  submissions: '/api/submissions',
  adminOverview: '/api/admin/overview',
  adminTools: '/api/admin/tools'
};

function getClientId() {
  const storageKey = 'agentic-client-id';
  const existing = localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const generated = `client_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  localStorage.setItem(storageKey, generated);
  return generated;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getField(form, name) {
  return form.elements.namedItem(name);
}

function syncDirectoryUrl(state) {
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

  if (state.sort !== 'featured') {
    params.set('sort', state.sort);
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, '', nextUrl);
}

function createToolCard(tool, favoriteSlugs, options = {}) {
  const saved = favoriteSlugs.has(tool.slug);
  const reviewAction = tool.reviewUrl
    ? `<a class="button-ghost" href="${tool.reviewUrl}">Read review</a>`
    : '';
  const detailAction = options.enableDetail
    ? `<button class="button-ghost js-open-detail" data-slug="${tool.slug}" type="button">Quick view</button>`
    : '';

  return `
    <article class="tool-card">
      <div class="tool-head">
        <div>
          <h3 class="tool-name">${tool.name}</h3>
          <div class="tool-subcategory">${tool.subcategory}</div>
        </div>
        <span class="meta-chip rating-chip">Rating ${tool.rating.toFixed(1)}</span>
      </div>
      <p class="card-copy">${tool.description}</p>
      <div class="meta-row">
        <span class="meta-chip">${tool.categoryLabel}</span>
        <span class="meta-chip">${tool.pricingLabel}</span>
        ${tool.verified ? '<span class="meta-chip is-brand">Verified</span>' : ''}
        ${tool.featured ? '<span class="meta-chip is-accent">Featured</span>' : ''}
      </div>
      <div class="tag-row">
        ${tool.tags.slice(0, 4).map((tag) => `<span class="pill">${tag}</span>`).join('')}
      </div>
      <p class="meta-copy">${tool.editorialNote}</p>
      <div class="tool-actions">
        <button class="button-secondary js-toggle-save" data-slug="${tool.slug}">
          ${saved ? 'Saved' : 'Save'}
        </button>
        <a class="button" href="${tool.websiteUrl}" target="_blank" rel="noreferrer">Visit site</a>
        ${reviewAction}
        ${detailAction}
        ${
          options.showUpdated
            ? `<span class="meta-chip">Reviewed ${formatDate(tool.updatedAt)}</span>`
            : ''
        }
      </div>
    </article>
  `;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function wireFavoriteButtons(root, favoriteSlugs, onToggle) {
  root.querySelectorAll('.js-toggle-save').forEach((button) => {
    button.addEventListener('click', () => onToggle(button.dataset.slug));
  });
}

function wireDetailButtons(root, onOpen) {
  root.querySelectorAll('.js-open-detail').forEach((button) => {
    button.addEventListener('click', () => onOpen(button.dataset.slug));
  });
}

function renderShortlist(container, favorites, favoriteSlugs, options = {}) {
  if (!container) {
    return;
  }

  if (!favorites.length) {
    container.innerHTML = `
      <div class="shortlist-empty glass-card">
        <h3>No saved tools yet</h3>
        <p class="empty-copy">Save a few tools from the homepage or directory to build a practical shortlist.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = favorites
    .map((tool) => createToolCard(tool, favoriteSlugs, options))
    .join('');
}

async function loadFavorites(clientId) {
  const data = await requestJson(`${API.favorites}?clientId=${encodeURIComponent(clientId)}`);
  return data.items;
}

async function toggleFavorite(clientId, slug) {
  const data = await requestJson(API.toggleFavorite, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clientId, slug })
  });

  return data.items;
}

function setSaveCount(count) {
  document.querySelectorAll('[data-save-count]').forEach((node) => {
    node.textContent = formatCount(count);
  });
}

async function initHomePage(clientId) {
  const [home, favorites] = await Promise.all([
    requestJson(`${API.home}?clientId=${encodeURIComponent(clientId)}`),
    loadFavorites(clientId)
  ]);

  const favoriteSlugs = new Set(favorites.map((item) => item.slug));

  document.getElementById('toolCount').textContent = formatCount(home.stats.toolCount);
  document.getElementById('categoryCount').textContent = formatCount(home.stats.categoryCount);
  document.getElementById('verifiedCount').textContent = formatCount(home.stats.verifiedCount);
  document.getElementById('featuredCount').textContent = formatCount(home.stats.featuredCount);

  const categoryGrid = document.getElementById('categoryGrid');
  categoryGrid.innerHTML = home.categories
    .map(
      (item) => `
        <a class="category-card" href="/tools-directory.html?category=${item.slug}">
          <span class="count">${item.count} tools</span>
          <h3>${item.label}</h3>
          <p class="card-copy">${item.description}</p>
        </a>
      `
    )
    .join('');

  const featuredGrid = document.getElementById('featuredGrid');
  featuredGrid.innerHTML = home.featuredTools
    .map((tool) => createToolCard(tool, favoriteSlugs))
    .join('');

  const trendingGrid = document.getElementById('trendingGrid');
  trendingGrid.innerHTML = home.trendingTools
    .map((tool) => createToolCard(tool, favoriteSlugs, { showUpdated: true }))
    .join('');

  const collectionGrid = document.getElementById('collectionGrid');
  collectionGrid.innerHTML = home.curatedCollections
    .map((collection) => {
      return `
        <article class="collection-card">
          <h3>${collection.title}</h3>
          <p class="card-copy">${collection.description}</p>
          <div class="collection-tools">
            ${collection.tools.map((tool) => `<span class="pill">${tool.name}</span>`).join('')}
          </div>
        </article>
      `;
    })
    .join('');

  const savedStrip = document.getElementById('savedStrip');
  if (favorites.length > 0) {
    savedStrip.innerHTML = favorites
      .slice(0, 5)
      .map((tool) => `<span class="pill">${tool.name}</span>`)
      .join('');
  } else {
    savedStrip.innerHTML = '<span class="pill">Save tools to build your shortlist</span>';
  }

  setSaveCount(favorites.length);
  const shortlistGrid = document.getElementById('shortlistGrid');
  renderShortlist(shortlistGrid, favorites, favoriteSlugs);

  const rerenderHomeFavorites = async (slug) => {
    const updatedFavorites = await toggleFavorite(clientId, slug);
    const updatedSet = new Set(updatedFavorites.map((item) => item.slug));
    setSaveCount(updatedFavorites.length);
    favoriteSlugs.clear();
    updatedFavorites.forEach((item) => favoriteSlugs.add(item.slug));
    savedStrip.innerHTML =
      updatedFavorites.length > 0
        ? updatedFavorites.slice(0, 5).map((tool) => `<span class="pill">${tool.name}</span>`).join('')
        : '<span class="pill">Save tools to build your shortlist</span>';
    renderShortlist(shortlistGrid, updatedFavorites, updatedSet);
    wireFavoriteButtons(shortlistGrid, updatedSet, rerenderHomeFavorites);

    [featuredGrid, trendingGrid].forEach((grid) => {
      grid.querySelectorAll('.js-toggle-save').forEach((button) => {
        button.textContent = updatedSet.has(button.dataset.slug) ? 'Saved' : 'Save';
      });
    });
  };

  wireFavoriteButtons(featuredGrid, favoriteSlugs, rerenderHomeFavorites);
  wireFavoriteButtons(trendingGrid, favoriteSlugs, rerenderHomeFavorites);
  wireFavoriteButtons(shortlistGrid, favoriteSlugs, rerenderHomeFavorites);

  const searchForm = document.getElementById('heroSearchForm');
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = document.getElementById('heroSearchInput').value.trim();
    window.location.href = `/tools-directory.html?q=${encodeURIComponent(query)}`;
  });

  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterStatus = document.getElementById('newsletterStatus');

  newsletterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    newsletterStatus.textContent = 'Submitting...';
    newsletterStatus.classList.remove('error');

    try {
      await requestJson(API.newsletter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newsletterForm.email.value,
          role: newsletterForm.role.value
        })
      });

      newsletterStatus.textContent = 'Subscribed. You are on the weekly shortlist.';
      newsletterForm.reset();
    } catch (error) {
      newsletterStatus.textContent = error.message;
      newsletterStatus.classList.add('error');
    }
  });
}

async function initDirectoryPage(clientId) {
  const params = new URLSearchParams(window.location.search);
  const state = {
    q: params.get('q') || '',
    category: params.get('category') || 'all',
    pricing: params.get('pricing') || 'all',
    verified: params.get('verified') === 'true',
    sort: params.get('sort') || 'featured'
  };

  const [categoryData, favorites] = await Promise.all([requestJson(API.categories), loadFavorites(clientId)]);
  const favoriteSlugs = new Set(favorites.map((item) => item.slug));
  setSaveCount(favorites.length);

  const searchInput = document.getElementById('directorySearch');
  const pricingSelect = document.getElementById('pricingFilter');
  const sortSelect = document.getElementById('sortFilter');
  const verifiedCheckbox = document.getElementById('verifiedFilter');
  const categoryFilters = document.getElementById('categoryFilters');
  const resultsCount = document.getElementById('resultsCount');
  const resultGrid = document.getElementById('directoryGrid');
  const emptyState = document.getElementById('emptyState');
  const resetFilters = document.getElementById('resetFilters');
  const detailCard = document.getElementById('toolDetailCard');
  const detailName = document.getElementById('toolDetailName');
  const detailSubcategory = document.getElementById('toolDetailSubcategory');
  const detailDescription = document.getElementById('toolDetailDescription');
  const detailMeta = document.getElementById('toolDetailMeta');
  const detailTags = document.getElementById('toolDetailTags');
  const detailEditorial = document.getElementById('toolDetailEditorial');
  const detailWebsite = document.getElementById('toolDetailWebsite');
  const detailReview = document.getElementById('toolDetailReview');
  const detailSave = document.getElementById('toolDetailSave');
  let currentDetailSlug = '';

  searchInput.value = state.q;
  pricingSelect.value = state.pricing;
  sortSelect.value = state.sort;
  verifiedCheckbox.checked = state.verified;

  categoryFilters.innerHTML = [
    '<button class="filter-pill" data-category="all">All categories</button>',
    ...categoryData.items.map(
      (item) =>
        `<button class="filter-pill" data-category="${item.slug}">${item.label} (${item.count})</button>`
    )
  ].join('');

  function syncCategoryPills() {
    categoryFilters.querySelectorAll('.filter-pill').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.category === state.category);
    });
  }

  async function openDetail(slug) {
    const tool = await requestJson(`${API.tools}/${slug}`);
    currentDetailSlug = tool.slug;
    detailName.textContent = tool.name;
    detailSubcategory.textContent = tool.subcategory;
    detailDescription.textContent = tool.description;
    detailEditorial.textContent = tool.editorialNote;
    detailWebsite.href = tool.websiteUrl;
    detailReview.href = tool.reviewUrl || '#';
    detailReview.classList.toggle('hidden', !tool.reviewUrl);
    detailSave.textContent = favoriteSlugs.has(tool.slug) ? 'Saved' : 'Save';
    detailTags.innerHTML = tool.tags.map((tag) => `<span class="pill">${tag}</span>`).join('');
    detailMeta.innerHTML = [
      ['Category', tool.categoryLabel],
      ['Pricing', tool.pricingLabel],
      ['Rating', tool.rating.toFixed(1)],
      ['Updated', formatDate(tool.updatedAt)]
    ]
      .map(
        ([label, value]) => `
          <div class="detail-metric">
            <strong>${label}</strong>
            <div class="meta-copy">${value}</div>
          </div>
        `
      )
      .join('');
    detailCard.classList.remove('hidden');
  }

  async function renderResults() {
    syncDirectoryUrl(state);
    const query = new URLSearchParams({
      q: state.q,
      category: state.category,
      pricing: state.pricing,
      sort: state.sort,
      verified: String(state.verified)
    });

    const data = await requestJson(`${API.tools}?${query.toString()}`);
    resultsCount.textContent = `${data.total} tools`;
    resultGrid.innerHTML = data.items
      .map((tool) => createToolCard(tool, favoriteSlugs, { showUpdated: true, enableDetail: true }))
      .join('');
    emptyState.classList.toggle('hidden', data.total > 0);

    if (data.total === 0) {
      currentDetailSlug = '';
      detailCard.classList.add('hidden');
    }

    wireFavoriteButtons(resultGrid, favoriteSlugs, async (slug) => {
      const updated = await toggleFavorite(clientId, slug);
      favoriteSlugs.clear();
      updated.forEach((item) => favoriteSlugs.add(item.slug));
      setSaveCount(updated.length);
      if (slug === currentDetailSlug) {
        detailSave.textContent = favoriteSlugs.has(slug) ? 'Saved' : 'Save';
      }
      await renderResults();
    });
    wireDetailButtons(resultGrid, openDetail);
  }

  detailSave.addEventListener('click', async () => {
    if (!currentDetailSlug) {
      return;
    }

    const updated = await toggleFavorite(clientId, currentDetailSlug);
    favoriteSlugs.clear();
    updated.forEach((item) => favoriteSlugs.add(item.slug));
    detailSave.textContent = favoriteSlugs.has(currentDetailSlug) ? 'Saved' : 'Save';
    setSaveCount(updated.length);
    await renderResults();
  });

  categoryFilters.addEventListener('click', async (event) => {
    const button = event.target.closest('.filter-pill');
    if (!button) {
      return;
    }

    state.category = button.dataset.category;
    syncCategoryPills();
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

  resetFilters.addEventListener('click', async () => {
    state.q = '';
    state.category = 'all';
    state.pricing = 'all';
    state.sort = 'featured';
    state.verified = false;

    searchInput.value = '';
    pricingSelect.value = 'all';
    sortSelect.value = 'featured';
    verifiedCheckbox.checked = false;
    syncCategoryPills();
    await renderResults();
  });

  syncCategoryPills();
  await renderResults();

  if (state.q || state.category !== 'all') {
    const firstCard = resultGrid.querySelector('.js-open-detail');
    if (firstCard) {
      await openDetail(firstCard.dataset.slug);
    }
  }
}

async function initSubmitPage() {
  const form = document.getElementById('submitToolForm');
  const status = document.getElementById('submitStatus');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Submitting...';
    status.classList.remove('error');

    try {
      await requestJson(API.submissions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: getField(form, 'name').value,
          url: getField(form, 'url').value,
          category: getField(form, 'category').value,
          contactEmail: getField(form, 'contactEmail').value,
          pricingModel: getField(form, 'pricingModel').value,
          notes: getField(form, 'notes').value
        })
      });

      status.textContent = 'Submission received. Editorial review will follow.';
      form.reset();
    } catch (error) {
      status.textContent = error.message;
      status.classList.add('error');
    }
  });
}

function renderAdminStats(stats) {
  const container = document.getElementById('adminStats');
  container.innerHTML = [
    ['Total tools', stats.totalTools],
    ['Featured tools', stats.featuredTools],
    ['Verified tools', stats.verifiedTools],
    ['Newsletter leads', stats.newsletterLeads],
    ['Pending submissions', stats.pendingSubmissions],
    ['Approved submissions', stats.approvedSubmissions]
  ]
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <strong>${formatCount(value)}</strong>
          <div class="meta-copy">${label}</div>
        </article>
      `
    )
    .join('');
}

function renderSubmissionQueue(submissions, onApprove, onReject) {
  const container = document.getElementById('submissionQueue');

  if (!submissions.length) {
    container.innerHTML = `
      <div class="shortlist-empty glass-card">
        <h3>No submissions yet</h3>
        <p class="empty-copy">New tool submissions will appear here for editorial triage.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = submissions
    .map(
      (submission) => `
        <article class="tool-card">
          <div class="tool-head">
            <div>
              <h3 class="tool-name">${submission.name}</h3>
              <div class="tool-subcategory">${submission.category} | ${submission.pricingModel || 'pricing unknown'}</div>
            </div>
            <span class="meta-chip ${submission.status === 'approved' ? 'is-brand' : submission.status === 'rejected' ? 'is-accent' : ''}">
              ${submission.status}
            </span>
          </div>
          <p class="card-copy">${submission.notes || 'No notes provided.'}</p>
          <div class="meta-row">
            <span class="meta-chip">${submission.contactEmail}</span>
            <span class="meta-chip">${formatDate(submission.createdAt)}</span>
            ${
              submission.approvedToolSlug
                ? `<span class="meta-chip is-brand">Tool: ${submission.approvedToolSlug}</span>`
                : ''
            }
          </div>
          <div class="tool-actions">
            <a class="button" href="${submission.url}" target="_blank" rel="noreferrer">Visit site</a>
            <button class="button-secondary js-admin-approve" data-id="${submission.id}" type="button">Approve</button>
            <button class="button-ghost js-admin-reject" data-id="${submission.id}" type="button">Reject</button>
          </div>
        </article>
      `
    )
    .join('');

  container.querySelectorAll('.js-admin-approve').forEach((button) => {
    button.addEventListener('click', () => onApprove(button.dataset.id));
  });

  container.querySelectorAll('.js-admin-reject').forEach((button) => {
    button.addEventListener('click', () => onReject(button.dataset.id));
  });
}

function renderToolCatalog(tools, onLoadTool) {
  const container = document.getElementById('toolCatalog');
  container.innerHTML = tools
    .map(
      (tool) => `
        <article class="tool-card">
          <div class="tool-head">
            <div>
              <h3 class="tool-name">${tool.name}</h3>
              <div class="tool-subcategory">${tool.categoryLabel} | ${tool.pricingLabel}</div>
            </div>
            <span class="meta-chip rating-chip">Rating ${tool.rating.toFixed(1)}</span>
          </div>
          <p class="card-copy">${tool.description}</p>
          <div class="meta-row">
            ${tool.featured ? '<span class="meta-chip is-accent">Featured</span>' : ''}
            ${tool.verified ? '<span class="meta-chip is-brand">Verified</span>' : ''}
            <span class="meta-chip">Updated ${formatDate(tool.updatedAt)}</span>
          </div>
          <div class="tool-actions">
            <button class="button-ghost js-load-tool" data-slug="${tool.slug}" type="button">Load into editor</button>
            <a class="button" href="${tool.websiteUrl}" target="_blank" rel="noreferrer">Visit site</a>
          </div>
        </article>
      `
    )
    .join('');

  container.querySelectorAll('.js-load-tool').forEach((button) => {
    button.addEventListener('click', () => onLoadTool(button.dataset.slug));
  });
}

function assignToolForm(form, tool) {
  getField(form, 'slug').value = tool.slug || '';
  getField(form, 'name').value = tool.name || '';
  getField(form, 'category').value = tool.category || '';
  getField(form, 'categoryLabel').value = tool.categoryLabel || '';
  getField(form, 'subcategory').value = tool.subcategory || '';
  getField(form, 'description').value = tool.description || '';
  getField(form, 'editorialNote').value = tool.editorialNote || '';
  getField(form, 'pricingModel').value = tool.pricingModel || '';
  getField(form, 'pricingLabel').value = tool.pricingLabel || '';
  getField(form, 'rating').value = tool.rating ?? 4.0;
  getField(form, 'trendingScore').value = tool.trendingScore ?? 50;
  getField(form, 'websiteUrl').value = tool.websiteUrl || '';
  getField(form, 'reviewUrl').value = tool.reviewUrl || '';
  getField(form, 'tags').value = (tool.tags || []).join(', ');
  getField(form, 'useCases').value = (tool.useCases || []).join(', ');
  getField(form, 'verified').checked = Boolean(tool.verified);
  getField(form, 'featured').checked = Boolean(tool.featured);
  getField(form, 'sponsored').checked = Boolean(tool.sponsored);
}

async function initAdminPage() {
  const statsStatus = document.getElementById('adminStatus');
  const toolForm = document.getElementById('toolEditorForm');
  const approveForm = document.getElementById('approvalForm');
  const editorMode = document.getElementById('editorMode');
  let currentTools = [];
  let currentSubmissions = [];
  let activeToolSlug = '';

  async function refreshAdmin() {
    const data = await requestJson(API.adminOverview);
    currentTools = data.tools;
    currentSubmissions = data.submissions;
    renderAdminStats(data.stats);
    renderSubmissionQueue(
      data.submissions,
      async (submissionId) => {
        const submission = currentSubmissions.find((item) => item.id === submissionId);
        if (!submission) {
          return;
        }

        getField(approveForm, 'submissionId').value = submission.id;
        getField(approveForm, 'categoryLabel').value = submission.category;
        getField(approveForm, 'subcategory').value = 'Submitted tool';
        getField(approveForm, 'description').value = submission.notes || `${submission.name} submitted for review.`;
        getField(approveForm, 'editorialNote').value = `Approved from submission queue on ${new Date().toISOString().split('T')[0]}.`;
        getField(approveForm, 'pricingLabel').value = submission.pricingModel || 'Pricing not provided';
        getField(approveForm, 'tags').value = submission.category;
        getField(approveForm, 'useCases').value = submission.notes || submission.category;
        getField(approveForm, 'reviewUrl').value = '';
        getField(approveForm, 'featured').checked = false;
        statsStatus.textContent = `Loaded submission "${submission.name}" into approval form.`;
        statsStatus.classList.remove('error');
        approveForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      async (submissionId) => {
        await requestJson(`/api/admin/submissions/${submissionId}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: 'Rejected from local admin panel' })
        });
        statsStatus.textContent = 'Submission rejected.';
        statsStatus.classList.remove('error');
        await refreshAdmin();
      }
    );
    renderToolCatalog(data.tools, async (slug) => {
      const tool = currentTools.find((item) => item.slug === slug);
      if (!tool) {
        return;
      }

      activeToolSlug = slug;
      editorMode.textContent = `Editing ${tool.name}`;
      assignToolForm(toolForm, tool);
      statsStatus.textContent = `Loaded ${tool.name} into editor.`;
      statsStatus.classList.remove('error');
      toolForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  approveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submissionId = getField(approveForm, 'submissionId').value;

    if (!submissionId) {
      statsStatus.textContent = 'Load a submission first.';
      statsStatus.classList.add('error');
      return;
    }

    try {
      await requestJson(`/api/admin/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryLabel: getField(approveForm, 'categoryLabel').value,
          subcategory: getField(approveForm, 'subcategory').value,
          description: getField(approveForm, 'description').value,
          editorialNote: getField(approveForm, 'editorialNote').value,
          pricingLabel: getField(approveForm, 'pricingLabel').value,
          tags: getField(approveForm, 'tags').value,
          useCases: getField(approveForm, 'useCases').value,
          reviewUrl: getField(approveForm, 'reviewUrl').value,
          featured: getField(approveForm, 'featured').checked
        })
      });

      approveForm.reset();
      statsStatus.textContent = 'Submission approved and added to catalog.';
      statsStatus.classList.remove('error');
      await refreshAdmin();
    } catch (error) {
      statsStatus.textContent = error.message;
      statsStatus.classList.add('error');
    }
  });

  toolForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      slug: getField(toolForm, 'slug').value,
      name: getField(toolForm, 'name').value,
      category: getField(toolForm, 'category').value,
      categoryLabel: getField(toolForm, 'categoryLabel').value,
      subcategory: getField(toolForm, 'subcategory').value,
      description: getField(toolForm, 'description').value,
      editorialNote: getField(toolForm, 'editorialNote').value,
      pricingModel: getField(toolForm, 'pricingModel').value,
      pricingLabel: getField(toolForm, 'pricingLabel').value,
      rating: getField(toolForm, 'rating').value,
      trendingScore: getField(toolForm, 'trendingScore').value,
      websiteUrl: getField(toolForm, 'websiteUrl').value,
      reviewUrl: getField(toolForm, 'reviewUrl').value,
      tags: getField(toolForm, 'tags').value,
      useCases: getField(toolForm, 'useCases').value,
      verified: getField(toolForm, 'verified').checked,
      featured: getField(toolForm, 'featured').checked,
      sponsored: getField(toolForm, 'sponsored').checked
    };

    try {
      if (activeToolSlug) {
        await requestJson(`/api/admin/tools/${activeToolSlug}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        statsStatus.textContent = 'Tool updated.';
      } else {
        await requestJson(API.adminTools, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        statsStatus.textContent = 'Tool created.';
      }

      statsStatus.classList.remove('error');
      toolForm.reset();
      activeToolSlug = '';
      editorMode.textContent = 'Create new tool';
      await refreshAdmin();
    } catch (error) {
      statsStatus.textContent = error.message;
      statsStatus.classList.add('error');
    }
  });

  document.getElementById('resetToolEditor').addEventListener('click', () => {
    activeToolSlug = '';
    toolForm.reset();
    editorMode.textContent = 'Create new tool';
    statsStatus.textContent = 'Tool editor reset.';
    statsStatus.classList.remove('error');
  });

  await refreshAdmin();
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;
  const clientId = getClientId();

  try {
    if (page === 'home') {
      await initHomePage(clientId);
    }

    if (page === 'directory') {
      await initDirectoryPage(clientId);
    }

    if (page === 'submit') {
      await initSubmitPage();
    }

    if (page === 'admin') {
      await initAdminPage();
    }
  } catch (error) {
    const fallback = document.querySelector('[data-global-status]');
    if (fallback) {
      fallback.textContent = error.message;
      fallback.classList.add('error');
    }
  }
});
