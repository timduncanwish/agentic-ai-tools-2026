const catalogRepository = require('../repositories/catalog.repository');
const stateRepository = require('../repositories/state.repository');
const {
  humanizeCategory,
  normalizeClientId
} = require('../utils/common');

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

function sortCourses(courses, sort = 'popular') {
  const items = [...courses];

  switch (sort) {
    case 'newest':
      return items.sort((left, right) => new Date(right.listedAt) - new Date(left.listedAt));
    case 'alphabetical':
      return items.sort((left, right) => left.title.localeCompare(right.title));
    case 'popular':
    default:
      return items.sort((left, right) => right.popularityScore - left.popularityScore);
  }
}

function sortCreators(creators, sort = 'featured') {
  const items = [...creators];

  switch (sort) {
    case 'audience':
      return items.sort((left, right) => right.subscriberCount - left.subscriberCount);
    case 'views':
      return items.sort((left, right) => right.monthlyViews - left.monthlyViews);
    case 'alphabetical':
      return items.sort((left, right) => left.name.localeCompare(right.name));
    case 'featured':
    default:
      return items.sort((left, right) => {
        if (left.featured !== right.featured) {
          return Number(right.featured) - Number(left.featured);
        }

        return right.subscriberCount - left.subscriberCount;
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
  const state = stateRepository.getState();
  return state.favoritesByClientId[clientId] || [];
}

function getFavoriteTools(clientId) {
  const tools = catalogRepository.getTools();
  const favoriteSlugs = new Set(getFavoriteSlugs(clientId));
  return tools.filter((tool) => favoriteSlugs.has(tool.slug));
}

function getHomeFeedItems(tabKey) {
  switch (tabKey) {
    case 'recent-tools':
      return {
        type: 'tools',
        items: sortTools(catalogRepository.getTools(), 'newest').slice(0, 6)
      };
    case 'popular-courses':
      return {
        type: 'courses',
        items: sortCourses(catalogRepository.getCourses(), 'popular').slice(0, 4)
      };
    case 'popular-tools':
    default:
      return {
        type: 'tools',
        items: sortTools(catalogRepository.getTools(), 'featured').slice(0, 6)
      };
  }
}

function getShowcaseCategories() {
  const tools = catalogRepository.getTools();
  const courses = catalogRepository.getCourses();
  const creators = catalogRepository.getCreators();
  const toolMap = new Map(tools.map((item) => [item.slug, item]));
  const courseMap = new Map(courses.map((item) => [item.slug, item]));
  const creatorMap = new Map(creators.map((item) => [item.slug, item]));

  return catalogRepository
    .getCategoryCatalog()
    .map((category) => {
      const relatedTools = (category.relatedToolSlugs || []).map((slug) => toolMap.get(slug)).filter(Boolean);
      const relatedCourses = (category.relatedCourseSlugs || []).map((slug) => courseMap.get(slug)).filter(Boolean);
      const relatedCreators = (category.relatedCreatorSlugs || []).map((slug) => creatorMap.get(slug)).filter(Boolean);

      return {
        ...category,
        toolCount: relatedTools.length,
        courseCount: relatedCourses.length,
        creatorCount: relatedCreators.length,
        relatedTools,
        relatedCourses,
        relatedCreators,
        href: `/category.html?slug=${encodeURIComponent(category.slug)}`
      };
    })
    .sort((left, right) => left.ranking - right.ranking);
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
  const tools = catalogRepository.getTools();
  const courses = catalogRepository.getCourses();
  const creators = catalogRepository.getCreators();
  const categories = getCategories(tools);
  const showcaseCategories = getShowcaseCategories();
  const favoriteTools = clientId ? getFavoriteTools(clientId) : [];
  const homeConfig = catalogRepository.getHomeConfig();
  const creatorSpotlight = creators.find((creator) => creator.slug === homeConfig.creatorSpotlightSlug) || creators[0] || null;
  const creatorSpotlightCourses = creatorSpotlight
    ? sortCourses(
        courses.filter((course) => creatorSpotlight.categoryFocus.includes(course.category)),
        'popular'
      ).slice(0, 2)
    : [];
  const creatorSpotlightTools = creatorSpotlight
    ? sortTools(
        tools.filter((tool) => creatorSpotlight.categoryFocus.includes(tool.category)),
        'featured'
      ).slice(0, 3)
    : [];

  return {
    generatedAt: new Date().toISOString(),
    hero: homeConfig.hero,
    trustStrip: homeConfig.trustStrip || [],
    feedTabs: (homeConfig.feedTabs || []).map((tab) => ({
      ...tab,
      ...getHomeFeedItems(tab.key)
    })),
    stats: {
      toolCount: tools.length,
      courseCount: courses.length,
      creatorCount: creators.length,
      categoryCount: categories.length,
      verifiedCount: tools.filter((tool) => tool.verified).length,
      featuredCount: tools.filter((tool) => tool.featured).length
    },
    categories,
    showcaseCategories: showcaseCategories.slice(0, 7),
    featuredTools: sortTools(
      tools.filter((tool) => tool.featured),
      'featured'
    ).slice(0, 6),
    trendingTools: sortTools(tools, 'trending').slice(0, 8),
    featuredCourses: sortCourses(courses, 'popular').slice(0, 4),
    featuredCreators: sortCreators(creators, 'featured').slice(0, 4),
    creatorSpotlight: creatorSpotlight
      ? {
          ...creatorSpotlight,
          featuredCourses: creatorSpotlightCourses,
          relatedTools: creatorSpotlightTools
        }
      : null,
    curatedCollections: createCuratedCollections(tools),
    savedTools: favoriteTools
  };
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

function listCourses(query) {
  const category = String(query.category || 'all').toLowerCase();
  const sort = String(query.sort || 'popular').toLowerCase();
  const level = String(query.level || 'all').toLowerCase();
  const q = String(query.q || '').trim().toLowerCase();
  const courses = catalogRepository.getCourses().filter((course) => {
    if (category !== 'all' && course.category !== category) {
      return false;
    }

    if (level !== 'all' && String(course.level || '').toLowerCase() !== level) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = [
      course.title,
      course.provider,
      course.instructor,
      course.summary,
      ...(course.tags || [])
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
  const items = sortCourses(courses, sort);

  return {
    total: items.length,
    items
  };
}

function getCourseBySlug(slug) {
  return catalogRepository.getCourses().find((item) => item.slug === slug) || null;
}

function listCreators(query) {
  const category = String(query.category || 'all').toLowerCase();
  const sort = String(query.sort || 'featured').toLowerCase();
  const platform = String(query.platform || 'all').toLowerCase();
  const q = String(query.q || '').trim().toLowerCase();
  const creators = catalogRepository.getCreators().filter((creator) => {
    if (category !== 'all' && !creator.categoryFocus.includes(category)) {
      return false;
    }

    if (platform !== 'all' && String(creator.platform || '').toLowerCase() !== platform) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = [
      creator.name,
      creator.roleLabel,
      creator.bio,
      creator.platform,
      ...(creator.categoryFocus || [])
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
  const items = sortCreators(creators, sort);

  return {
    total: items.length,
    items
  };
}

function getCreatorBySlug(slug) {
  return catalogRepository.getCreators().find((item) => item.slug === slug) || null;
}

function getCategoryBySlug(slug) {
  return getShowcaseCategories().find((item) => item.slug === slug) || null;
}

function getFavorites(clientId) {
  const normalizedClientId = normalizeClientId(clientId);
  if (!normalizedClientId) {
    return { error: 'clientId is required' };
  }

  return {
    clientId: normalizedClientId,
    items: getFavoriteTools(normalizedClientId)
  };
}

function getCategoryOptions() {
  return {
    items: getCategories(catalogRepository.getTools())
  };
}

module.exports = {
  getHomePayload,
  getHomeFeedItems,
  getCategoryOptions,
  getCategoryBySlug,
  listTools,
  getToolBySlug,
  listCourses,
  getCourseBySlug,
  listCreators,
  getCreatorBySlug,
  getFavorites,
  getFavoriteTools,
  sortTools,
  normalizeClientId,
  humanizeCategory
};
