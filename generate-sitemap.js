#!/usr/bin/env node

/**
 * SEO Sitemap Generator
 * Automatically generates sitemap.xml with proper SEO optimization
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://agenticaitools2026.com';
const DIST_DIR = path.join(__dirname, 'dist');
const TODAY = new Date().toISOString().split('T')[0]; // Format: 2026-01-24

// Priority and change frequency configuration
const pageConfig = {
  'index.html': { priority: '1.0', changefreq: 'daily' },
  'index-optimized.html': { priority: '0.9', changefreq: 'weekly' },
  'index-quantum.html': { priority: '0.9', changefreq: 'weekly' },

  // High-priority reviews
  'claude-code-ultimate-guide.html': { priority: '0.9', changefreq: 'weekly' },
  'chatgpt-complete-guide-2026.html': { priority: '0.9', changefreq: 'weekly' },
  'auto-gpt-complete-review.html': { priority: '0.9', changefreq: 'weekly' },
  'microsoft-autogen-review.html': { priority: '0.9', changefreq: 'weekly' },
  'top-10-ai-tools-2026.html': { priority: '0.9', changefreq: 'weekly' },
  'best-ai-agents-2026.html': { priority: '0.9', changefreq: 'weekly' },

  // Comparisons
  'autogen-vs-crewai-comparison.html': { priority: '0.8', changefreq: 'weekly' },
  'crewai-vs-autogen-comparison.html': { priority: '0.8', changefreq: 'weekly' },
  'langchain-vs-autogen-comparison.html': { priority: '0.8', changefreq: 'weekly' },

  // Important guides
  'agentic-ai-best-practices.html': { priority: '0.8', changefreq: 'monthly' },
  'beginners-guide-to-ai-agents.html': { priority: '0.8', changefreq: 'monthly' },
  'building-chatbots-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'prompt-engineering-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'rag-complete-guide-2026.html': { priority: '0.8', changefreq: 'monthly' },
  'fine-tuning-guide-2026.html': { priority: '0.8', changefreq: 'monthly' },
  'local-llms-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'vector-database-guide.html': { priority: '0.7', changefreq: 'monthly' },

  // Tool reviews
  'cursor-ai-review.html': { priority: '0.8', changefreq: 'weekly' },
  'github-copilot-review.html': { priority: '0.8', changefreq: 'monthly' },
  'sourcegraph-cody-review.html': { priority: '0.7', changefreq: 'monthly' },
  'codeium-ai-review.html': { priority: '0.7', changefreq: 'monthly' },
  'tabnine-ai-review.html': { priority: '0.7', changefreq: 'monthly' },

  // AI model guides
  'claude-ai-complete-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'google-gemini-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'midjourney-complete-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'dalle-3-guide.html': { priority: '0.7', changefreq: 'monthly' },
  'stable-diffusion-guide.html': { priority: '0.7', changefreq: 'monthly' },

  // Industry applications
  'ai-in-healthcare-2026.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-in-finance-2026.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-in-ecommerce-2026.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-in-education-2026.html': { priority: '0.7', changefreq: 'monthly' },

  // Tool tutorials
  'agentgpt-tutorial.html': { priority: '0.8', changefreq: 'monthly' },
  'getting-started-with-autogen.html': { priority: '0.8', changefreq: 'monthly' },
  'langchain-agents-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'langflow-tutorial.html': { priority: '0.7', changefreq: 'monthly' },
  'flowise-ai-guide.html': { priority: '0.7', changefreq: 'monthly' },
  'dify-ai-guide.html': { priority: '0.7', changefreq: 'monthly' },

  // Use case guides
  'ai-content-creation-guide.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-email-marketing-guide.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-customer-support-guide.html': { priority: '0.7', changefreq: 'monthly' },
  'ai-seo-guide.html': { priority: '0.8', changefreq: 'monthly' },
  'ai-workflow-automation-guide.html': { priority: '0.7', changefreq: 'monthly' },

  // Low priority pages
  'about.html': { priority: '0.5', changefreq: 'monthly' },
  'contact.html': { priority: '0.5', changefreq: 'monthly' },
  'privacy.html': { priority: '0.3', changefreq: 'yearly' },
  'terms.html': { priority: '0.3', changefreq: 'yearly' },

  // Verification files (lowest priority)
  'google6964fbc8e0c4d0a5.html': { priority: '0.1', changefreq: 'yearly' },
};

// Default configuration for uncategorized pages
const defaultConfig = {
  priority: '0.6',
  changefreq: 'monthly'
};

function generateSitemap() {
  const htmlFiles = fs.readdirSync(DIST_DIR)
    .filter(file => file.endsWith('.html'))
    .sort();

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  sitemap += `  <!-- Generated on ${TODAY} -->\n\n`;

  htmlFiles.forEach(file => {
    const config = pageConfig[file] || defaultConfig;
    const url = file === 'index.html' ? '/' : `/${file}`;

    sitemap += `  <url>\n`;
    sitemap += `    <loc>${DOMAIN}${url}</loc>\n`;
    sitemap += `    <lastmod>${TODAY}</lastmod>\n`;
    sitemap += `    <changefreq>${config.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${config.priority}</priority>\n`;
    sitemap += `  </url>\n\n`;
  });

  sitemap += `</urlset>`;

  // Write sitemap
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
  console.log(`✅ Sitemap generated with ${htmlFiles.length} URLs`);
  console.log(`📁 Location: ${path.join(DIST_DIR, 'sitemap.xml')}`);
  console.log(`🌐 Domain: ${DOMAIN}`);
  console.log(`📅 Date: ${TODAY}`);
}

function generateRobotsTxt() {
  let robots = `# robots.txt for Agentic AI Tools 2026\n`;
  robots += `# Last updated: ${TODAY}\n\n`;
  robots += `User-agent: *\n`;
  robots += `Allow: /\n\n`;
  robots += `# Disallow specific paths\n`;
  robots += `Disallow: /node_modules/\n`;
  robots += `Disallow: /scripts/\n`;
  robots += `Disallow: /.git/\n\n`;
  robots += `# Sitemap location\n`;
  robots += `Sitemap: ${DOMAIN}/sitemap.xml\n`;

  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robots);
  console.log(`✅ robots.txt generated`);
}

// Run generators
console.log('🚀 Starting SEO sitemap generation...\n');
generateSitemap();
console.log();
generateRobotsTxt();
console.log('\n✨ SEO optimization complete!');
