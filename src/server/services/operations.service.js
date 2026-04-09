const catalogRepository = require('../repositories/catalog.repository');
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
    listingTier: sanitizeText(input.listingTier) || existingTool.listingTier || 'free',
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
  const submissions = catalogRepository.getSubmissions();

  return {
    stats: {
      totalTools: tools.length,
      featuredTools: tools.filter((tool) => tool.featured).length,
      verifiedTools: tools.filter((tool) => tool.verified).length,
      newsletterLeads: catalogRepository.getNewsletterCount(),
      pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
      approvedSubmissions: submissions.filter((s) => s.status === 'approved').length
    },
    submissions: [...submissions].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    tools: discoveryService.sortTools(tools, 'featured')
  };
}

function toggleFavorite(clientId, slug) {
  const normalizedClientId = normalizeClientId(clientId);
  const normalizedSlug = String(slug || '').trim();

  if (!normalizedClientId || !normalizedSlug) {
    return { error: 'clientId and slug are required', status: 400 };
  }

  const tool = catalogRepository.getToolBySlug(normalizedSlug);
  if (!tool) {
    return { error: 'Tool not found', status: 404 };
  }

  const saved = catalogRepository.toggleFavorite(normalizedClientId, normalizedSlug);

  return {
    clientId: normalizedClientId,
    slug: normalizedSlug,
    saved,
    items: discoveryService.getFavoriteTools(normalizedClientId)
  };
}

function subscribeNewsletter(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const name = String(input.name || input.role || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'A valid email is required', status: 400 };
  }

  catalogRepository.subscribeNewsletter(email, name, 'site-redesign');

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

  catalogRepository.submitTool({
    submissionId: createSubmissionId(),
    toolName: payload.name,
    toolUrl: payload.url,
    submitterName: '',
    submitterEmail: payload.contactEmail,
    category: payload.category,
    description: payload.notes,
    pricingModel: payload.pricingModel,
    listingTier: 'free'
  });

  return {
    ok: true,
    message: 'Submission received',
    status: 201
  };
}

function approveSubmission(id, input) {
  const submission = catalogRepository.getSubmissionById(id);

  if (!submission) {
    return { error: 'Submission not found', status: 404 };
  }

  const existingTool = catalogRepository.getToolBySlug(slugify(submission.name));
  if (existingTool) {
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

  catalogRepository.saveTools([tool]);
  catalogRepository.updateSubmissionStatus(id, 'approved');

  return {
    ok: true,
    tool,
    submission: { ...submission, status: 'approved', reviewedAt: new Date().toISOString() }
  };
}

function rejectSubmission(id, reason) {
  const submission = catalogRepository.getSubmissionById(id);

  if (!submission) {
    return { error: 'Submission not found', status: 404 };
  }

  catalogRepository.updateSubmissionStatus(id, 'rejected', { adminNotes: sanitizeText(reason) });

  return {
    ok: true,
    submission: { ...submission, status: 'rejected', reviewedAt: new Date().toISOString() }
  };
}

function createTool(input) {
  const tool = buildToolFromInput(input);
  const validationError = validateToolInput(tool);

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  if (catalogRepository.getToolBySlug(tool.slug)) {
    return { error: 'Tool slug already exists', status: 409 };
  }

  catalogRepository.saveTools([tool]);

  return {
    ok: true,
    tool,
    status: 201
  };
}

function updateTool(slug, input) {
  const existingTool = catalogRepository.getToolBySlug(slug);

  if (!existingTool) {
    return { error: 'Tool not found', status: 404 };
  }

  const updatedTool = buildToolFromInput(input, existingTool);
  const validationError = validateToolInput(updatedTool);

  if (validationError) {
    return { error: validationError, status: 400 };
  }

  if (updatedTool.slug !== slug && catalogRepository.getToolBySlug(updatedTool.slug)) {
    return { error: 'Updated slug already exists', status: 409 };
  }

  catalogRepository.saveTools([updatedTool]);

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
