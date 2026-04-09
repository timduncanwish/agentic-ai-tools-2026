const { getDb } = require('../services/db.service');
const { readJson } = require('../utils/common');
const paths = require('../config/paths');
const fs = require('fs');

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
    INSERT OR IGNORE INTO tools (
      slug, name, category, category_label, subcategory, description,
      editorial_note, pricing_model, pricing_label, rating, trending_score,
      verified, featured, sponsored, listing_tier, tags, use_cases,
      website_url, review_url, logo_url, save_count, vote_count
    ) VALUES (
      @slug, @name, @category, @categoryLabel, @subcategory, @description,
      @editorialNote, @pricingModel, @pricingLabel, @rating, @trendingScore,
      @verified, @featured, @sponsored, @listingTier, @tags, @useCases,
      @websiteUrl, @reviewUrl, @logoUrl, @saveCount, @voteCount
    )
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
        reviewUrl: tool.reviewUrl || '',
        logoUrl: tool.logoUrl || '',
        saveCount: Number(tool.saveCount) || 0,
        voteCount: Number(tool.voteCount) || 0
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
    level: row.difficulty,
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
    platform: row.platform || '',
    subscriberCount: row.subscriber_count,
    monthlyViews: row.monthly_views,
    courseCount: row.course_count,
    featured: Boolean(row.featured),
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
  const sql = status
    ? 'SELECT * FROM tool_submissions WHERE status = ? ORDER BY submitted_at DESC'
    : 'SELECT * FROM tool_submissions ORDER BY submitted_at DESC';
  const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  return rows.map((row) => ({
    id: row.submission_id,
    name: row.tool_name,
    url: row.tool_url,
    category: row.category || '',
    contactEmail: row.submitter_email || '',
    pricingModel: row.pricing_model || '',
    notes: row.description || '',
    status: row.status,
    createdAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    adminNotes: row.admin_notes
  }));
}

function getSubmissionById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tool_submissions WHERE submission_id = ?').get(id);
  if (!row) return null;
  return {
    id: row.submission_id,
    name: row.tool_name,
    url: row.tool_url,
    category: row.category || '',
    contactEmail: row.submitter_email || '',
    pricingModel: row.pricing_model || '',
    notes: row.description || '',
    status: row.status,
    createdAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    adminNotes: row.admin_notes
  };
}

function updateSubmissionStatus(id, status, extra = {}) {
  const db = getDb();
  const fields = ['status = @status', 'reviewed_at = datetime("now")'];
  const params = { submission_id: id, status };

  if (extra.adminNotes !== undefined) {
    fields.push('admin_notes = @adminNotes');
    params.adminNotes = extra.adminNotes;
  }

  db.prepare(`UPDATE tool_submissions SET ${fields.join(', ')} WHERE submission_id = @submission_id`).run(params);
}

function subscribeNewsletter(email, name, source) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO newsletter_subscribers (email, name, source)
    VALUES (@email, @name, @source)
  `);
  return insert.run({ email, name: name || '', source: source || 'website' }).changes;
}

function getNewsletterSubscribers() {
  const db = getDb();
  return db.prepare('SELECT * FROM newsletter_subscribers WHERE active = 1 ORDER BY subscribed_at DESC').all()
    .map((row) => ({
      email: row.email,
      name: row.name,
      source: row.source,
      createdAt: row.subscribed_at
    }));
}

function getNewsletterCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1').get().count;
}

// --- Favorites ---

function getFavoriteSlugs(clientId) {
  const db = getDb();
  const rows = db.prepare('SELECT tool_slug FROM favorites WHERE client_id = ?').all(clientId);
  return rows.map((r) => r.tool_slug);
}

function toggleFavorite(clientId, toolSlug) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM favorites WHERE client_id = ? AND tool_slug = ?').get(clientId, toolSlug);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
    return false;
  }
  db.prepare('INSERT INTO favorites (client_id, tool_slug) VALUES (?, ?)').run(clientId, toolSlug);
  return true;
}

function getHomeConfig() {
  const defaults = { hero: {}, trustStrip: [], feedTabs: [], creatorSpotlightSlug: '' };
  if (!fs.existsSync(paths.HOME_CONFIG_FILE)) {
    return defaults;
  }
  return { ...defaults, ...readJson(paths.HOME_CONFIG_FILE) };
}

module.exports = {
  getTools,
  getToolBySlug,
  saveTools,
  getCategories,
  getCourses,
  getCreators,
  getHomeConfig,
  submitTool,
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  subscribeNewsletter,
  getNewsletterSubscribers,
  getNewsletterCount,
  getFavoriteSlugs,
  toggleFavorite
};
