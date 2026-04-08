const catalogRepository = require('../repositories/catalog.repository');
const toolsService = require('./tools.service');

function getShowcaseCategories() {
  const tools = catalogRepository.getTools();
  const courses = catalogRepository.getCourses();
  const creators = catalogRepository.getCreators();
  const toolMap = new Map(tools.map((item) => [item.slug, item]));
  const courseMap = new Map(courses.map((item) => [item.slug, item]));
  const creatorMap = new Map(creators.map((item) => [item.slug, item]));

  return catalogRepository
    .getCategories()
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
        href: `/category/${encodeURIComponent(category.slug)}`
      };
    })
    .sort((left, right) => left.ranking - right.ranking);
}

function getCategoryBySlug(slug) {
  return getShowcaseCategories().find((item) => item.slug === slug) || null;
}

function getCategoryOptions() {
  return {
    items: toolsService.getToolCategorySummaries(catalogRepository.getTools())
  };
}

module.exports = {
  getShowcaseCategories,
  getCategoryBySlug,
  getCategoryOptions
};
