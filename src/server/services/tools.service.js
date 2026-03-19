const catalogRepository = require('../repositories/catalog.repository');

function getToolCategorySummaries(tools) {
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
      return items.sort((left, right) => {
        const leftDate = left.listedAt || left.updatedAt;
        const rightDate = right.listedAt || right.updatedAt;
        return new Date(rightDate) - new Date(leftDate);
      });
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

function listTools(query) {
  const tools = catalogRepository.getTools();
  const filtered = filterTools(tools, query);
  const items = sortTools(filtered, query.sort || 'featured');
  return {
    total: items.length,
    items
  };
}

function getToolBySlug(slug) {
  return catalogRepository.getTools().find((item) => item.slug === slug) || null;
}

module.exports = {
  getToolCategorySummaries,
  sortTools,
  listTools,
  getToolBySlug
};
