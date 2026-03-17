#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const STYLES_DIR = path.join(ROOT_DIR, 'styles');
const SCRIPTS_DIR = path.join(ROOT_DIR, 'scripts');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const STATE_FILE = path.join(DATA_DIR, 'app-state.json');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/styles', express.static(STYLES_DIR));
app.use('/scripts', express.static(SCRIPTS_DIR));
app.use(express.static(DIST_DIR));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function humanizeCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  const overrides = {
    assistant: 'Assistants',
    coding: 'Coding',
    automation: 'Automation',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    productivity: 'Productivity'
  };

  if (overrides[normalized]) {
    return overrides[normalized];
  }

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function getTools() {
  return readJson(TOOLS_FILE);
}

function saveTools(tools) {
  writeJson(TOOLS_FILE, tools);
}

function createSubmissionId() {
  return `sub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function getState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      favoritesByClientId: {},
      newsletterLeads: [],
      submissions: []
    };
  }

  const state = readJson(STATE_FILE);
  state.favoritesByClientId = state.favoritesByClientId || {};
  state.newsletterLeads = state.newsletterLeads || [];
  state.submissions = (state.submissions || []).map((submission) => ({
    id: submission.id || createSubmissionId(),
    status: submission.status || 'pending',
    createdAt: submission.createdAt || new Date().toISOString(),
    ...submission
  }));
  return state;
}

function saveState(state) {
  writeJson(STATE_FILE, state);
}

function getCategories(tools) {
  const categories = new Map();

  for (const tool of tools) {
    if (!categories.has(tool.category)) {
      categories.set(tool.category, {
        slug: tool.category,
        label: tool.categoryLabel,
        description: tool.subcategory,
        count: 0
      });
    }

    categories.get(tool.category).count += 1;
  }

  return Array.from(categories.values()).sort((left, right) => right.count - left.count);
}

function sortTools(tools, sort) {
  const items = [...tools];

  switch (sort) {
    case 'trending':
      return items.sort((left, right) => right.trendingScore - left.trendingScore);
    case 'rating':
      return items.sort((left, right) => right.rating - left.rating);
    case 'newest':
      return items.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
    case 'alphabetical':
      return items.sort((left, right) => left.name.localeCompare(right.name));
    case 'featured':
    default:
      return items.sort((left, right) => {
        if (left.featured !== right.featured) {
          return Number(right.featured) - Number(left.featured);
        }

        if (left.verified !== right.verified) {
          return Number(right.verified) - Number(left.verified);
        }

        return right.trendingScore - left.trendingScore;
      });
  }
}

function filterTools(tools, query) {
  const q = (query.q || '').trim().toLowerCase();
  const category = (query.category || 'all').toLowerCase();
  const pricing = (query.pricing || 'all').toLowerCase();
  const verifiedOnly = String(query.verified || '').toLowerCase() === 'true';
  const tag = (query.tag || '').trim().toLowerCase();

  return tools.filter((tool) => {
    if (category !== 'all' && tool.category !== category) {
      return false;
    }

    if (pricing !== 'all' && tool.pricingModel !== pricing) {
      return false;
    }

    if (verifiedOnly && !tool.verified) {
      return false;
    }

    if (tag && !tool.tags.some((item) => item.toLowerCase() === tag)) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = [
      tool.name,
      tool.categoryLabel,
      tool.subcategory,
      tool.description,
      tool.editorialNote,
      ...(tool.tags || []),
      ...(tool.useCases || [])
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

function getFavoriteSlugs(clientId) {
  const state = getState();
  return state.favoritesByClientId[clientId] || [];
}

function getFavoriteTools(clientId) {
  const tools = getTools();
  const favoriteSlugs = new Set(getFavoriteSlugs(clientId));
  return tools.filter((tool) => favoriteSlugs.has(tool.slug));
}

function createCuratedCollections(tools) {
  const toolMap = new Map(tools.map((tool) => [tool.slug, tool]));
  const collections = [
    {
      slug: 'builders-stack',
      title: 'For builders shipping fast',
      description: 'A compact stack for coding, orchestration, and debugging without over-committing to one vendor.',
      toolSlugs: ['claude-code', 'cursor', 'autogen', 'langchain']
    },
    {
      slug: 'solo-creator-stack',
      title: 'For solo creators',
      description: 'Create scripts, visuals, voiceovers, and launch assets from one shortlist.',
      toolSlugs: ['chatgpt', 'midjourney', 'elevenlabs', 'runway']
    },
    {
      slug: 'ops-automation-stack',
      title: 'For operators and analysts',
      description: 'Research, summarize, automate, and hand results back to the team with minimal tooling sprawl.',
      toolSlugs: ['claude', 'perplexity', 'langflow', 'notion-ai']
    }
  ];

  return collections.map((collection) => ({
    ...collection,
    tools: collection.toolSlugs.map((slug) => toolMap.get(slug)).filter(Boolean)
  }));
}

function getHomePayload(clientId) {
  const tools = getTools();
  const categories = getCategories(tools);
  const favoriteTools = clientId ? getFavoriteTools(clientId) : [];

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      toolCount: tools.length,
      categoryCount: categories.length,
      verifiedCount: tools.filter((tool) => tool.verified).length,
      featuredCount: tools.filter((tool) => tool.featured).length
    },
    categories,
    featuredTools: sortTools(
      tools.filter((tool) => tool.featured),
      'featured'
    ).slice(0, 6),
    trendingTools: sortTools(tools, 'trending').slice(0, 8),
    curatedCollections: createCuratedCollections(tools),
    savedTools: favoriteTools
  };
}

function normalizeBoolean(value) {
  return String(value).toLowerCase() === 'true';
}

function sanitizeText(value) {
  return String(value || '').trim();
}

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
    updatedAt: new Date().toISOString().split('T')[0]
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

function normalizeClientId(clientId) {
  return String(clientId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    date: new Date().toISOString()
  });
});

app.get('/api/home', (req, res) => {
  const clientId = normalizeClientId(req.query.clientId);
  res.json(getHomePayload(clientId));
});

app.get('/api/categories', (_req, res) => {
  res.json({
    items: getCategories(getTools())
  });
});

app.get('/api/tools', (req, res) => {
  const tools = getTools();
  const filtered = filterTools(tools, req.query);
  const sorted = sortTools(filtered, req.query.sort || 'featured');

  res.json({
    total: sorted.length,
    items: sorted
  });
});

app.get('/api/tools/:slug', (req, res) => {
  const tool = getTools().find((item) => item.slug === req.params.slug);

  if (!tool) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  res.json(tool);
});

app.get('/api/admin/overview', (_req, res) => {
  const tools = getTools();
  const state = getState();

  res.json({
    stats: {
      totalTools: tools.length,
      featuredTools: tools.filter((tool) => tool.featured).length,
      verifiedTools: tools.filter((tool) => tool.verified).length,
      newsletterLeads: state.newsletterLeads.length,
      pendingSubmissions: state.submissions.filter((submission) => submission.status === 'pending').length,
      approvedSubmissions: state.submissions.filter((submission) => submission.status === 'approved').length
    },
    submissions: [...state.submissions].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    tools: sortTools(tools, 'featured')
  });
});

app.get('/api/favorites', (req, res) => {
  const clientId = normalizeClientId(req.query.clientId);

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  res.json({
    clientId,
    items: getFavoriteTools(clientId)
  });
});

app.post('/api/favorites/toggle', (req, res) => {
  const clientId = normalizeClientId(req.body.clientId);
  const slug = String(req.body.slug || '').trim();
  const tools = getTools();

  if (!clientId || !slug) {
    res.status(400).json({ error: 'clientId and slug are required' });
    return;
  }

  if (!tools.some((tool) => tool.slug === slug)) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  const state = getState();
  const favorites = new Set(state.favoritesByClientId[clientId] || []);
  let saved;

  if (favorites.has(slug)) {
    favorites.delete(slug);
    saved = false;
  } else {
    favorites.add(slug);
    saved = true;
  }

  state.favoritesByClientId[clientId] = Array.from(favorites);
  saveState(state);

  res.json({
    clientId,
    slug,
    saved,
    items: getFavoriteTools(clientId)
  });
});

app.post('/api/newsletter', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = String(req.body.role || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }

  const state = getState();
  const exists = state.newsletterLeads.some((item) => item.email === email);

  if (!exists) {
    state.newsletterLeads.push({
      email,
      role,
      source: 'site-redesign',
      createdAt: new Date().toISOString()
    });
    saveState(state);
  }

  res.json({
    ok: true,
    message: 'Subscribed successfully'
  });
});

app.post('/api/submissions', (req, res) => {
  const payload = {
    name: String(req.body.name || '').trim(),
    url: String(req.body.url || '').trim(),
    category: String(req.body.category || '').trim(),
    contactEmail: String(req.body.contactEmail || '').trim().toLowerCase(),
    pricingModel: String(req.body.pricingModel || '').trim(),
    notes: String(req.body.notes || '').trim()
  };

  if (!payload.name || !payload.url || !payload.category || !payload.contactEmail) {
    res.status(400).json({ error: 'name, url, category, and contactEmail are required' });
    return;
  }

  if (!/^https?:\/\//.test(payload.url)) {
    res.status(400).json({ error: 'url must start with http:// or https://' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)) {
    res.status(400).json({ error: 'contactEmail is invalid' });
    return;
  }

  const state = getState();
  state.submissions.push({
    id: createSubmissionId(),
    ...payload,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  saveState(state);

  res.status(201).json({
    ok: true,
    message: 'Submission received'
  });
});

app.post('/api/admin/submissions/:id/approve', (req, res) => {
  const state = getState();
  const submission = state.submissions.find((item) => item.id === req.params.id);

  if (!submission) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  const tools = getTools();
  const existing = tools.find((tool) => tool.slug === slugify(submission.name));
  if (existing) {
    res.status(409).json({ error: 'A tool with this slug already exists' });
    return;
  }

  const toolInput = {
    name: submission.name,
    category: submission.category,
    categoryLabel: sanitizeText(req.body.categoryLabel) || humanizeCategory(submission.category),
    subcategory: sanitizeText(req.body.subcategory) || 'Submitted tool',
    description: sanitizeText(req.body.description) || sanitizeText(submission.notes) || `${submission.name} submitted for review.`,
    editorialNote: sanitizeText(req.body.editorialNote) || `Approved from submission queue on ${new Date().toISOString().split('T')[0]}.`,
    pricingModel: sanitizeText(submission.pricingModel) || sanitizeText(req.body.pricingModel) || 'paid',
    pricingLabel: sanitizeText(req.body.pricingLabel) || sanitizeText(submission.pricingModel) || 'Pricing not provided',
    rating: req.body.rating || 4.0,
    trendingScore: req.body.trendingScore || 40,
    verified: true,
    featured: normalizeBoolean(req.body.featured),
    sponsored: false,
    tags: req.body.tags || submission.category,
    useCases: req.body.useCases || submission.notes,
    websiteUrl: submission.url,
    reviewUrl: sanitizeText(req.body.reviewUrl)
  };

  const tool = buildToolFromInput(toolInput);
  const validationError = validateToolInput(tool);

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  tools.push(tool);
  saveTools(tools);

  submission.status = 'approved';
  submission.reviewedAt = new Date().toISOString();
  submission.approvedToolSlug = tool.slug;
  saveState(state);

  res.json({
    ok: true,
    tool,
    submission
  });
});

app.post('/api/admin/submissions/:id/reject', (req, res) => {
  const state = getState();
  const submission = state.submissions.find((item) => item.id === req.params.id);

  if (!submission) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  submission.status = 'rejected';
  submission.reviewedAt = new Date().toISOString();
  submission.rejectionReason = sanitizeText(req.body.reason);
  saveState(state);

  res.json({
    ok: true,
    submission
  });
});

app.post('/api/admin/tools', (req, res) => {
  const tool = buildToolFromInput(req.body);
  const validationError = validateToolInput(tool);

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const tools = getTools();

  if (tools.some((item) => item.slug === tool.slug)) {
    res.status(409).json({ error: 'Tool slug already exists' });
    return;
  }

  tools.push(tool);
  saveTools(tools);

  res.status(201).json({
    ok: true,
    tool
  });
});

app.patch('/api/admin/tools/:slug', (req, res) => {
  const tools = getTools();
  const index = tools.findIndex((item) => item.slug === req.params.slug);

  if (index === -1) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  const updatedTool = buildToolFromInput(req.body, tools[index]);
  const validationError = validateToolInput(updatedTool);

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  if (updatedTool.slug !== req.params.slug && tools.some((item) => item.slug === updatedTool.slug)) {
    res.status(409).json({ error: 'Updated slug already exists' });
    return;
  }

  tools[index] = updatedTool;
  saveTools(tools);

  res.json({
    ok: true,
    tool: updatedTool
  });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.get('/tools-directory.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'tools-directory.html'));
});

app.get('/submit-tool.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'submit-tool.html'));
});

app.get('/admin.html', (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'admin.html'));
});

function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`Agentic AI Tools server running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
