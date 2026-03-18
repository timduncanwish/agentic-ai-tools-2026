const catalogRepository = require('../repositories/catalog.repository');
const stateRepository = require('../repositories/state.repository');
const {
  createSubmissionId,
  humanizeCategory,
  normalizeBoolean,
  normalizeClientId,
  sanitizeText,
  slugify,
  toNumber
} = require('../utils/common');
const discoveryService = require('./discovery.service');

function buildToolFromInput(input, existingTool = {}) {
  const name = sanitizeText(input.name);
  const category = sanitizeText(input.category).toLowerCase();
  const tags = Array.isArray(input.tags)
    ? input.tags.map((item) => sanitizeText(item)).filter(Boolean)
    : String(input.tags || '')
        .split(',')
        .map((item) => sanitizeText(item))
        .filter(Boolean);
  const useCases = Array.isArray(input.useCases)
    ? input.useCases.map((item) => sanitizeText(item)).filter(Boolean)
    : String(input.useCases || '')
        .split(',')
        .map((item) => sanitizeText(item))
        .filter(Boolean);

  return {
    slug: sanitizeText(input.slug) || existingTool.slug || slugify(name),
    name,
    category,
    categoryLabel: sanitizeText(input.categoryLabel) || existingTool.categoryLabel || humanizeCategory(category),
    subcategory: sanitizeText(input.subcategory) || existingTool.subcategory || '',
    description: sanitizeText(input.description) || existingTool.description || '',
    editorialNote: sanitizeText(input.editorialNote) || existingTool.editorialNote || '',
    pricingModel: sanitizeText(input.pricingModel) || existingTool.pricingModel || 'paid',
    pricingLabel: sanitizeText(input.pricingLabel) || existingTool.pricingLabel || '',
    rating: Number.parseFloat(input.rating ?? existingTool.rating ?? 4.0),
    trendingScore: Number.parseInt(input.trendingScore ?? existingTool.trendingScore ?? 50, 10),
    verified: input.verified === undefined ? normalizeBoolean(existingTool.verified) : normalizeBoolean(input.verified),
    featured: input.featured === undefined ? normalizeBoolean(existingTool.featured) : normalizeBoolean(input.featured),
    sponsored: input.sponsored === undefined ? normalizeBoolean(existingTool.sponsored) : normalizeBoolean(input.sponsored),
    tags,
    useCases,
    websiteUrl: sanitizeText(input.websiteUrl) || existingTool.websiteUrl || '',
    reviewUrl: sanitizeText(input.reviewUrl) || existingTool.reviewUrl || '',
    logoUrl: sanitizeText(input.logoUrl) || existingTool.logoUrl || '',
    listedAt: existingTool.listedAt || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    saveCount: toNumber(input.saveCount ?? existingTool.saveCount, 0),
    voteCount: toNumber(input.voteCount ?? existingTool.voteCount, 0)
  };
}

function validateToolInput(input) {
  if (!input.name) {
    return 'name is required';
  }

  if (!input.category) {
    return 'category is required';
  }

  if (!input.categoryLabel) {
    return 'categoryLabel is required';
  }

  if (!input.description) {
    return 'description is required';
  }

  if (!input.pricingModel) {
    return 'pricingModel is required';
  }

  if (!input.pricingLabel) {
    return 'pricingLabel is required';
  }

  if (!input.websiteUrl || !/^https?:\/\//.test(input.websiteUrl)) {
    return 'websiteUrl must start with http:// or https://';
  }

  return null;
}

function getAdminOverview() {
  const tools = catalogRepository.getTools();
  const state = stateRepository.getState();

  return {
    stats: {
      totalTools: tools.length,
      featuredTools: tools.filter((tool) => tool.featured).length,
      verifiedTools: tools.filter((tool) => tool.verified).length,
      newsletterLeads: state.newsletterLeads.length,
      pendingSubmissions: state.submissions.filter((submission) => submission.status === 'pending').length,
      approvedSubmissions: state.submissions.filter((submission) => submission.status === 'approved').length
    },
    submissions: [...state.submissions].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    tools: discoveryService.sortTools(tools, 'featured')
  };
}

function toggleFavorite(clientId, slug) {
  const normalizedClientId = normalizeClientId(clientId);
  const normalizedSlug = String(slug || '').trim();
  const tools = catalogRepository.getTools();

  if (!normalizedClientId || !normalizedSlug) {
    return { error: 'clientId and slug are required', status: 400 };
  }

  if (!tools.some((tool) => tool.slug === normalizedSlug)) {
    return { error: 'Tool not found', status: 404 };
  }

  const state = stateRepository.getState();
  const favorites = new Set(state.favoritesByClientId[normalizedClientId] || []);
  let saved;

  if (favorites.has(normalizedSlug)) {
    favorites.delete(normalizedSlug);
    saved = false;
  } else {
    favorites.add(normalizedSlug);
    saved = true;
  }

  state.favoritesByClientId[normalizedClientId] = Array.from(favorites);
  stateRepository.saveState(state);

  return {
    clientId: normalizedClientId,
    slug: normalizedSlug,
    saved,
    items: discoveryService.getFavoriteTools(normalizedClientId)
  };
}

function subscribeNewsletter(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const role = String(input.role || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'A valid email is required', status: 400 };
  }

  const state = stateRepository.getState();
  const exists = state.newsletterLeads.some((item) => item.email === email);

  if (!exists) {
    state.newsletterLeads.push({
      email,
      role,
      source: 'site-redesign',
      createdAt: new Date().toISOString()
    });
    stateRepository.saveState(state);
  }

  return {
    ok: true,
    message: 'Subscribed successfully'
  };
}

function createSubmission(input) {
  const payload = {
    name: String(input.name || '').trim(),
    url: String(input.url || '').trim(),
    category: String(input.category || '').trim(),
    contactEmail: String(input.contactEmail || '').trim().toLowerCase(),
    pricingModel: String(input.pricingModel || '').trim(),
    notes: String(input.notes || '').trim()
  };

  if (!payload.name || !payload.url || !payload.category || !payload.contactEmail) {
    return { error: 'name, url, category, and contactEmail are required', status: 400 };
  }

  if (!/^https?:\/\//.test(payload.url)) {
    return { error: 'url must start with http:// or https://', status: 400 };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)) {
    return { error: 'contactEmail is invalid', status: 400 };
  }

  const state = stateRepository.getState();
  state.submissions.push({
    id: createSubmissionId(),
    ...payload,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  stateRepository.saveState(state);

  return {
    ok: true,
    message: 'Submission received',
    status: 201
  };
}

function approveSubmission(id, input) {
  const state = stateRepository.getState();
  const submission = state.submissions.find((item) => item.id === id);

  if (!submission) {
    return { error: 'Submission not found', status: 404 };
  }

  const tools = catalogRepository.getTools();
  const existing = tools.find((tool) => tool.slug === slugify(submission.name));
  if (existing) {
    return { error: 'A tool with this slug already exists', status: 409 };
  }

  const toolInput = {
    name: submission.name,
    category: submission.category,
    categoryLabel: sanitizeText(input.categoryLabel) || humanizeCategory(submission.category),
    subcategory: sanitizeText(input.subcategory) || 'Submitted tool',
    description: sanitizeText(input.description) || sanitizeText(submission.notes) || `${submission.name} submitted for review.`,
    editorialNote: sanitizeText(input.editorialNote) || `Approved from submission queue on ${new Date().toISOString().split('T')[0]}.`,
    pricingModel: sanitizeText(submission.pricingModel) || sanitizeText(input.pricingModel) || 'paid',
    pricingLabel: sanitizeText(input.pricingLabel) || sanitizeText(submission.pricingModel) || 'Pricing not provided',
    rating: input.rating || 4.0,
    trendingScore: input.trendingScore || 40,
    verified: true,
    featured: normalizeBoolean(input.featured),
    sponsored: false,
    tags: input.tags || submission.category,
    useCases: input.useCases || submission.notes,
    websiteUrl: submission.url,
    reviewUrl: sanitizeText(input.reviewUrl)
  };

  const tool = buildToolFromInput(toolInput);
  const validationError = validateToolInput(tool);

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  tools.push(tool);
  catalogRepository.saveTools(tools);

  submission.status = 'approved';
  submission.reviewedAt = new Date().toISOString();
  submission.approvedToolSlug = tool.slug;
  stateRepository.saveState(state);

  return {
    ok: true,
    tool,
    submission
  };
}

function rejectSubmission(id, reason) {
  const state = stateRepository.getState();
  const submission = state.submissions.find((item) => item.id === id);

  if (!submission) {
    return { error: 'Submission not found', status: 404 };
  }

  submission.status = 'rejected';
  submission.reviewedAt = new Date().toISOString();
  submission.rejectionReason = sanitizeText(reason);
  stateRepository.saveState(state);

  return {
    ok: true,
    submission
  };
}

function createTool(input) {
  const tool = buildToolFromInput(input);
  const validationError = validateToolInput(tool);

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  const tools = catalogRepository.getTools();
  if (tools.some((item) => item.slug === tool.slug)) {
    return { error: 'Tool slug already exists', status: 409 };
  }

  tools.push(tool);
  catalogRepository.saveTools(tools);

  return {
    ok: true,
    tool,
    status: 201
  };
}

function updateTool(slug, input) {
  const tools = catalogRepository.getTools();
  const index = tools.findIndex((item) => item.slug === slug);

  if (index === -1) {
    return { error: 'Tool not found', status: 404 };
  }

  const updatedTool = buildToolFromInput(input, tools[index]);
  const validationError = validateToolInput(updatedTool);

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  if (updatedTool.slug !== slug && tools.some((item) => item.slug === updatedTool.slug)) {
    return { error: 'Updated slug already exists', status: 409 };
  }

  tools[index] = updatedTool;
  catalogRepository.saveTools(tools);

  return {
    ok: true,
    tool: updatedTool
  };
}

module.exports = {
  getAdminOverview,
  toggleFavorite,
  subscribeNewsletter,
  createSubmission,
  approveSubmission,
  rejectSubmission,
  createTool,
  updateTool
};
