const catalogRepository = require('../repositories/catalog.repository');
const { readJson } = require('../utils/common');
const paths = require('../config/paths');
const fs = require('fs');
const toolsService = require('./tools.service');
const coursesService = require('./courses.service');
const creatorsService = require('./creators.service');
const categoriesService = require('./categories.service');

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

function buildCreatorSpotlight(creators, courses, tools, homeConfig) {
  const creatorSpotlight = creators.find((creator) => creator.slug === homeConfig.creatorSpotlightSlug) || creators[0] || null;
  const creatorSpotlightCourses = creatorSpotlight
    ? coursesService
        .sortCourses(
          courses.filter((course) => creatorSpotlight.categoryFocus.includes(course.category)),
          'popular'
        )
        .slice(0, 2)
    : [];
  const creatorSpotlightTools = creatorSpotlight
    ? toolsService
        .sortTools(
          tools.filter((tool) => creatorSpotlight.categoryFocus.includes(tool.category)),
          'featured'
        )
        .slice(0, 3)
    : [];

  if (!creatorSpotlight) {
    return null;
  }

  return {
    ...creatorSpotlight,
    featuredCourses: creatorSpotlightCourses,
    relatedTools: creatorSpotlightTools
  };
}

function getHomeFeedItems(tabKey) {
  switch (tabKey) {
    case 'recent-tools':
      return {
        type: 'tools',
        items: toolsService.sortTools(catalogRepository.getTools(), 'newest').slice(0, 6)
      };
    case 'popular-courses':
      return {
        type: 'courses',
        items: coursesService.sortCourses(catalogRepository.getCourses(), 'popular').slice(0, 4)
      };
    case 'popular-tools':
    default:
      return {
        type: 'tools',
        items: toolsService.sortTools(catalogRepository.getTools(), 'featured').slice(0, 6)
      };
  }
}

function getHomeSpotlights() {
  const tools = catalogRepository.getTools();
  const courses = catalogRepository.getCourses();
  const creators = catalogRepository.getCreators();
  let homeConfig = { hero: {}, trustStrip: [], feedTabs: [], creatorSpotlightSlug: '' };
  if (fs.existsSync(paths.HOME_CONFIG_FILE)) {
    homeConfig = readJson(paths.HOME_CONFIG_FILE);
  }

  return {
    generatedAt: new Date().toISOString(),
    trendingCategories: categoriesService.getShowcaseCategories().slice(0, 7),
    creatorSpotlight: buildCreatorSpotlight(creators, courses, tools, homeConfig),
    editorialCollections: createCuratedCollections(tools)
  };
}

function getHomePayload(favoriteTools = []) {
  const tools = catalogRepository.getTools();
  const courses = catalogRepository.getCourses();
  const creators = catalogRepository.getCreators();
  const categorySummaries = toolsService.getToolCategorySummaries(tools);
  const showcaseCategories = categoriesService.getShowcaseCategories();
  const homeConfig = catalogRepository.getHomeConfig();
  const creatorSpotlight = buildCreatorSpotlight(creators, courses, tools, homeConfig);
  const curatedCollections = createCuratedCollections(tools);

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
      categoryCount: categorySummaries.length,
      verifiedCount: tools.filter((tool) => tool.verified).length,
      featuredCount: tools.filter((tool) => tool.featured).length
    },
    categories: categorySummaries,
    showcaseCategories: showcaseCategories.slice(0, 7),
    featuredTools: toolsService
      .sortTools(
        tools.filter((tool) => tool.featured),
        'featured'
      )
      .slice(0, 6),
    trendingTools: toolsService.sortTools(tools, 'trending').slice(0, 8),
    featuredCourses: coursesService.sortCourses(courses, 'popular').slice(0, 4),
    featuredCreators: creatorsService.sortCreators(creators, 'featured').slice(0, 4),
    creatorSpotlight,
    curatedCollections,
    savedTools: favoriteTools
  };
}

module.exports = {
  getHomePayload,
  getHomeSpotlights,
  getHomeFeedItems
};
