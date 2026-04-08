const { getDb } = require('../services/db.service');

function parseToolRow(row) {
  return {
    ...row,
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    sponsored: Boolean(row.sponsored),
    tags: JSON.parse(row.tags || '[]'),
    useCases: JSON.parse(row.use_cases || '[]'),
    categoryLabel: row.category_label,
    editorialNote: row.editorial_note,
    pricingModel: row.pricing_model,
    pricingLabel: row.pricing_label,
    trendingScore: row.trending_score,
    listingTier: row.listing_tier,
    saveCount: row.save_count,
    voteCount: row.vote_count,
    websiteUrl: row.website_url,
    reviewUrl: row.review_url,
    logoUrl: row.logo_url,
    listedAt: row.listed_at,
    updatedAt: row.updated_at
  };
}

function getTools() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM tools ORDER BY trending_score DESC').all();
  return rows.map(parseToolRow);
}

function getToolBySlug(slug) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tools WHERE slug = ?').get(slug);
  return row ? parseToolRow(row) : null;
}

function saveTools(tools) {
  const db = getDb();
  const update = db.prepare(`
    UPDATE tools SET
      name = @name,
      category = @category,
      category_label = @categoryLabel,
      subcategory = @subcategory,
      description = @description,
      editorial_note = @editorialNote,
      pricing_model = @pricingModel,
      pricing_label = @pricingLabel,
      rating = @rating,
      trending_score = @trendingScore,
      verified = @verified,
      featured = @featured,
      sponsored = @sponsored,
      listing_tier = @listingTier,
      tags = @tags,
      use_cases = @useCases,
      website_url = @websiteUrl,
      review_url = @reviewUrl,
      updated_at = date('now')
    WHERE slug = @slug
  `);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO tools (slug, name, category, category_label, description, tags, use_cases)
    VALUES (@slug, @name, @category, @categoryLabel, @description, @tags, @useCases)
  `);

  const txn = db.transaction((items) => {
    for (const tool of items) {
      const row = {
        slug: tool.slug,
        name: tool.name,
        category: tool.category || 'assistant',
        categoryLabel: tool.categoryLabel || 'Assistants',
        subcategory: tool.subcategory || '',
        description: tool.description || '',
        editorialNote: tool.editorialNote || '',
        pricingModel: tool.pricingModel || 'freemium',
        pricingLabel: tool.pricingLabel || '',
        rating: Number(tool.rating) || 4.0,
        trendingScore: Number(tool.trendingScore) || 50,
        verified: tool.verified ? 1 : 0,
        featured: tool.featured ? 1 : 0,
        sponsored: tool.sponsored ? 1 : 0,
        listingTier: tool.listingTier || 'free',
        tags: JSON.stringify(tool.tags || []),
        useCases: JSON.stringify(tool.useCases || []),
        websiteUrl: tool.websiteUrl || '',
        reviewUrl: tool.reviewUrl || ''
      };
      const changed = update.run(row).changes;
      if (changed === 0) {
        insert.run(row);
      }
    }
  });

  txn(tools);
}

function getCategories() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY ranking ASC').all();
  return rows.map((row) => ({
    ...row,
    shortDescription: row.short_description,
    heroCopy: row.hero_copy,
    relatedToolSlugs: JSON.parse(row.related_tool_slugs || '[]'),
    relatedCourseSlugs: JSON.parse(row.related_course_slugs || '[]'),
    relatedCreatorSlugs: JSON.parse(row.related_creator_slugs || '[]')
  }));
}

function getCourses() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM courses ORDER BY popularity_score DESC').all();
  return rows.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    popularityScore: row.popularity_score,
    listedAt: row.listed_at,
    updatedAt: row.updated_at
  }));
}

function getCreators() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM creators').all();
  return rows.map((row) => ({
    ...row,
    categoryFocus: JSON.parse(row.category_focus || '[]'),
    subscriberCount: row.subscriber_count,
    monthlyViews: row.monthly_views,
    courseCount: row.course_count,
    featuredVideos: JSON.parse(row.featured_videos || '[]'),
    socialLinks: JSON.parse(row.social_links || '{}')
  }));
}

function submitTool(submission) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO tool_submissions (submission_id, tool_name, tool_url, submitter_name, submitter_email, category, description, pricing_model, listing_tier)
    VALUES (@submissionId, @toolName, @toolUrl, @submitterName, @submitterEmail, @category, @description, @pricingModel, @listingTier)
  `);
  insert.run(submission);
  return submission.submissionId;
}

function getSubmissions(status) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM tool_submissions WHERE status = ? ORDER BY submitted_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM tool_submissions ORDER BY submitted_at DESC').all();
}

function subscribeNewsletter(email, name, source) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO newsletter_subscribers (email, name, source)
    VALUES (@email, @name, @source)
  `);
  return insert.run({ email, name: name || '', source: source || 'website' }).changes;
}

function getNewsletterCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1').get().count;
}

module.exports = {
  getTools,
  getToolBySlug,
  saveTools,
  getCategories,
  getCourses,
  getCreators,
  submitTool,
  getSubmissions,
  subscribeNewsletter,
  getNewsletterCount
};
