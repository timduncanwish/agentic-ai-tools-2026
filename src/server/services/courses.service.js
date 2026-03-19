const catalogRepository = require('../repositories/catalog.repository');

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

module.exports = {
  sortCourses,
  listCourses,
  getCourseBySlug
};
