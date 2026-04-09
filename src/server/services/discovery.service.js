const catalogRepository = require('../repositories/catalog.repository');
const { humanizeCategory, normalizeClientId } = require('../utils/common');
const toolsService = require('./tools.service');
const coursesService = require('./courses.service');
const creatorsService = require('./creators.service');
const categoriesService = require('./categories.service');
const homeService = require('./home.service');

function getFavoriteSlugs(clientId) {
  return catalogRepository.getFavoriteSlugs(clientId);
}

function getFavoriteTools(clientId) {
  const tools = catalogRepository.getTools();
  const favoriteSlugs = new Set(getFavoriteSlugs(clientId));
  return tools.filter((tool) => favoriteSlugs.has(tool.slug));
}

function getHomePayload(clientId) {
  const favoriteTools = clientId ? getFavoriteTools(clientId) : [];
  return homeService.getHomePayload(favoriteTools);
}

function getHomeSpotlights() {
  return homeService.getHomeSpotlights();
}

function getHomeFeedItems(tabKey) {
  return homeService.getHomeFeedItems(tabKey);
}

function listTools(query) {
  return toolsService.listTools(query);
}

function getToolBySlug(slug) {
  return toolsService.getToolBySlug(slug);
}

function listCourses(query) {
  return coursesService.listCourses(query);
}

function getCourseBySlug(slug) {
  return coursesService.getCourseBySlug(slug);
}

function listCreators(query) {
  return creatorsService.listCreators(query);
}

function getCreatorBySlug(slug) {
  return creatorsService.getCreatorBySlug(slug);
}

function getCategoryBySlug(slug) {
  return categoriesService.getCategoryBySlug(slug);
}

function getCategoryOptions() {
  return categoriesService.getCategoryOptions();
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

module.exports = {
  getHomePayload,
  getHomeSpotlights,
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
  sortTools: toolsService.sortTools,
  normalizeClientId,
  humanizeCategory
};
