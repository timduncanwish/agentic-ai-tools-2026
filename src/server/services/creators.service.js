const catalogRepository = require('../repositories/catalog.repository');

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

module.exports = {
  sortCreators,
  listCreators,
  getCreatorBySlug
};
