const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { readJson } = require('../utils/common');

const DATA_DIR = path.resolve(__dirname, '..', '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'agentic.db');

let db = null;

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema();
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'assistant',
      category_label TEXT NOT NULL DEFAULT 'Assistants',
      subcategory TEXT DEFAULT '',
      description TEXT DEFAULT '',
      editorial_note TEXT DEFAULT '',
      pricing_model TEXT DEFAULT 'freemium',
      pricing_label TEXT DEFAULT '',
      rating REAL DEFAULT 4.0,
      trending_score INTEGER DEFAULT 50,
      verified INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      sponsored INTEGER DEFAULT 0,
      listing_tier TEXT DEFAULT 'free' CHECK(listing_tier IN ('free', 'enhanced', 'verified', 'featured')),
      tags TEXT DEFAULT '[]',
      use_cases TEXT DEFAULT '[]',
      website_url TEXT DEFAULT '',
      review_url TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      save_count INTEGER DEFAULT 0,
      vote_count INTEGER DEFAULT 0,
      listed_at TEXT DEFAULT (date('now')),
      updated_at TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      short_description TEXT DEFAULT '',
      hero_copy TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      ranking INTEGER DEFAULT 99,
      related_tool_slugs TEXT DEFAULT '[]',
      related_course_slugs TEXT DEFAULT '[]',
      related_creator_slugs TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      instructor TEXT DEFAULT '',
      category TEXT DEFAULT '',
      difficulty TEXT DEFAULT 'beginner',
      duration TEXT DEFAULT '',
      popularity_score INTEGER DEFAULT 50,
      tags TEXT DEFAULT '[]',
      listed_at TEXT DEFAULT (date('now')),
      updated_at TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      category_focus TEXT DEFAULT '[]',
      subscriber_count INTEGER DEFAULT 0,
      monthly_views INTEGER DEFAULT 0,
      course_count INTEGER DEFAULT 0,
      featured_videos TEXT DEFAULT '[]',
      website_url TEXT DEFAULT '',
      social_links TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      source TEXT DEFAULT 'website',
      subscribed_at TEXT DEFAULT (datetime('now')),
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tool_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT UNIQUE NOT NULL,
      tool_name TEXT NOT NULL,
      tool_url TEXT NOT NULL,
      submitter_name TEXT DEFAULT '',
      submitter_email TEXT DEFAULT '',
      category TEXT DEFAULT '',
      description TEXT DEFAULT '',
      pricing_model TEXT DEFAULT '',
      listing_tier TEXT DEFAULT 'free',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'approved', 'rejected')),
      admin_notes TEXT DEFAULT '',
      submitted_at TEXT DEFAULT (datetime('now')),
      reviewed_at TEXT DEFAULT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
    CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
    CREATE INDEX IF NOT EXISTS idx_tools_listing_tier ON tools(listing_tier);
    CREATE INDEX IF NOT EXISTS idx_tools_verified ON tools(verified);
    CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_categories_ranking ON categories(ranking);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON tool_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
  `);
}

function migrateFromJson() {
  const d = getDb();
  const toolCount = d.prepare('SELECT COUNT(*) as count FROM tools').get().count;

  if (toolCount > 0) {
    return { skipped: true, reason: 'Database already has data' };
  }

  const insertTool = d.prepare(`
    INSERT OR IGNORE INTO tools (
      slug, name, category, category_label, subcategory, description,
      editorial_note, pricing_model, pricing_label, rating, trending_score,
      verified, featured, sponsored, listing_tier, tags, use_cases,
      website_url, review_url, logo_url, save_count, vote_count,
      listed_at, updated_at
    ) VALUES (
      @slug, @name, @category, @categoryLabel, @subcategory, @description,
      @editorialNote, @pricingModel, @pricingLabel, @rating, @trendingScore,
      @verified, @featured, @sponsored, @listingTier, @tags, @useCases,
      @websiteUrl, @reviewUrl, @logoUrl, @saveCount, @voteCount,
      @listedAt, @updatedAt
    )
  `);

  const insertCategory = d.prepare(`
    INSERT OR IGNORE INTO categories (
      slug, label, short_description, hero_copy, icon, ranking,
      related_tool_slugs, related_course_slugs, related_creator_slugs
    ) VALUES (
      @slug, @label, @shortDescription, @heroCopy, @icon, @ranking,
      @relatedToolSlugs, @relatedCourseSlugs, @relatedCreatorSlugs
    )
  `);

  let toolsMigrated = 0;
  let categoriesMigrated = 0;

  // Migrate tools
  const toolsPath = path.join(DATA_DIR, 'tools.json');
  if (fs.existsSync(toolsPath)) {
    const tools = readJson(toolsPath);
    for (const tool of tools) {
      const trendingScore = Number(tool.trendingScore) || 50;
      insertTool.run({
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
        trendingScore,
        verified: tool.verified ? 1 : 0,
        featured: tool.featured ? 1 : 0,
        sponsored: tool.sponsored ? 1 : 0,
        listingTier: tool.featured ? 'featured' : (tool.verified ? 'verified' : 'free'),
        tags: JSON.stringify(tool.tags || []),
        useCases: JSON.stringify(tool.useCases || []),
        websiteUrl: tool.websiteUrl || '',
        reviewUrl: tool.reviewUrl || '',
        logoUrl: tool.logoUrl || '',
        saveCount: trendingScore * 9 + toolsMigrated * 7,
        voteCount: trendingScore * 7 + toolsMigrated * 5,
        listedAt: tool.listedAt || tool.updatedAt || '2026-03-01',
        updatedAt: tool.updatedAt || '2026-03-01'
      });
      toolsMigrated++;
    }
  }

  // Migrate categories
  const categoriesPath = path.join(DATA_DIR, 'categories.json');
  if (fs.existsSync(categoriesPath)) {
    const categories = readJson(categoriesPath);
    for (const cat of categories) {
      insertCategory.run({
        slug: cat.slug,
        label: cat.label,
        shortDescription: cat.shortDescription || '',
        heroCopy: cat.heroCopy || '',
        icon: cat.icon || '',
        ranking: cat.ranking || 99,
        relatedToolSlugs: JSON.stringify(cat.relatedToolSlugs || []),
        relatedCourseSlugs: JSON.stringify(cat.relatedCourseSlugs || []),
        relatedCreatorSlugs: JSON.stringify(cat.relatedCreatorSlugs || [])
      });
      categoriesMigrated++;
    }
  }

  return { toolsMigrated, categoriesMigrated };
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, migrateFromJson, closeDb };
