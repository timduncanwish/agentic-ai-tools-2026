const fs = require('fs');
const paths = require('../config/paths');
const { readJson, writeJson, toDateOnly, toNumber } = require('../utils/common');

function getTools() {
  return readJson(paths.TOOLS_FILE).map((tool, index) => {
    const trendingScore = Math.max(1, toNumber(tool.trendingScore, 50));
    const updatedAt = toDateOnly(tool.updatedAt, '2026-03-01');
    const listedAt = toDateOnly(tool.listedAt, updatedAt);

    return {
      ...tool,
      rating: toNumber(tool.rating, 4.0),
      trendingScore,
      listedAt,
      updatedAt,
      saveCount: Math.max(0, toNumber(tool.saveCount, trendingScore * 9 + index * 7)),
      voteCount: Math.max(0, toNumber(tool.voteCount, trendingScore * 7 + index * 5)),
      logoUrl: String(tool.logoUrl || '').trim()
    };
  });
}

function saveTools(tools) {
  writeJson(paths.TOOLS_FILE, tools);
}

function getCourses() {
  if (!fs.existsSync(paths.COURSES_FILE)) {
    return [];
  }

  return readJson(paths.COURSES_FILE).map((course) => ({
    ...course,
    popularityScore: toNumber(course.popularityScore, 50),
    listedAt: toDateOnly(course.listedAt, '2026-03-01'),
    updatedAt: toDateOnly(course.updatedAt, course.listedAt || '2026-03-01'),
    tags: Array.isArray(course.tags) ? course.tags : []
  }));
}

function getCreators() {
  if (!fs.existsSync(paths.CREATORS_FILE)) {
    return [];
  }

  return readJson(paths.CREATORS_FILE).map((creator) => ({
    ...creator,
    categoryFocus: Array.isArray(creator.categoryFocus) ? creator.categoryFocus : [],
    subscriberCount: toNumber(creator.subscriberCount, 0),
    monthlyViews: toNumber(creator.monthlyViews, 0),
    courseCount: toNumber(creator.courseCount, 0),
    featuredVideos: Array.isArray(creator.featuredVideos) ? creator.featuredVideos : []
  }));
}

function getCategoryCatalog() {
  if (!fs.existsSync(paths.CATEGORIES_FILE)) {
    return [];
  }

  return readJson(paths.CATEGORIES_FILE);
}

function getHomeConfig() {
  if (!fs.existsSync(paths.HOME_CONFIG_FILE)) {
    return {
      hero: {},
      trustStrip: [],
      feedTabs: [],
      creatorSpotlightSlug: ''
    };
  }

  return readJson(paths.HOME_CONFIG_FILE);
}

module.exports = {
  getTools,
  saveTools,
  getCourses,
  getCreators,
  getCategoryCatalog,
  getHomeConfig
};
