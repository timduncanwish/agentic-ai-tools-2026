/**
 * Batch Migration Script - Convert Tailwind pages to Optimized Design
 *
 * This script updates all HTML pages to use the new optimized-frontend.css
 * instead of Tailwind CSS, applying the cyber-brutalist tech aesthetic.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');

// New navigation HTML
const NEW_NAV = `    <nav class="nav">
        <div class="nav-container">
            <a href="/" class="nav-logo">AGENTIC_AI_TOOLS_2026</a>
            <ul class="nav-links">
                <li><a href="/#reviews" class="nav-link">Reviews</a></li>
                <li><a href="/tools-directory.html" class="nav-link">Tools</a></li>
                <li><a href="/#categories" class="nav-link">Categories</a></li>
                <li><a href="/#comparison" class="nav-link">Compare</a></li>
                <li><a href="/#faq" class="nav-link">FAQ</a></li>
            </ul>
        </div>
    </nav>`;

// New footer HTML
const NEW_FOOTER = `    <footer class="footer">
        <div class="footer-content">
            <div class="footer-section">
                <h4>About</h4>
                <p style="color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.8;">
                    Your trusted source for autonomous AI agent reviews, comparisons, and implementation guides.
                </p>
            </div>
            <div class="footer-section">
                <h4>Quick Links</h4>
                <ul class="footer-links">
                    <li><a href="/#reviews">Reviews</a></li>
                    <li><a href="/#comparison">Comparison</a></li>
                    <li><a href="/#guide">Guide</a></li>
                    <li><a href="/#faq">FAQ</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Legal & Contact</h4>
                <ul class="footer-links">
                    <li><a href="/about.html">About Us</a></li>
                    <li><a href="/privacy.html">Privacy Policy</a></li>
                    <li><a href="/terms.html">Terms of Service</a></li>
                    <li><a href="/contact.html">Contact Us</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Top Tools</h4>
                <ul class="footer-links">
                    <li><a href="https://www.anthropic.com/claude-code" target="_blank" rel="nofollow">Claude Code</a></li>
                    <li><a href="https://www.crewai.com" target="_blank" rel="nofollow">CrewAI</a></li>
                    <li><a href="https://github.com/Significant-Gravitas/AutoGPT" target="_blank" rel="nofollow">AutoGPT</a></li>
                    <li><a href="/agentgpt-tutorial.html">AgentGPT</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Agentic AI Tools 2026. All rights reserved.</p>
            <p style="margin-top: var(--space-sm); font-size: 0.75rem;">Last updated: January 19, 2026</p>
            <p style="margin-top: var(--space-md); font-size: 0.75rem; color: var(--color-text-muted);">
                Affiliate Disclosure: We may earn a commission when you purchase through our links.
            </p>
        </div>
    </footer>`;

/**
 * Convert Tailwind classes to optimized design classes
 */
function convertContent(html) {
    let content = html;

    // Remove body bg-gray-50 class (handled by CSS)
    content = content.replace(/<body class="bg-gray-50">/g, '<body>');

    // Convert sections
    content = content.replace(
        /<div class="max-w-4xl mx-auto px-4 py-16">\s*<div class="bg-white rounded-lg shadow-lg p-8">/g,
        '<main class="main-content">\n        <section class="section-intro">'
    );

    content = content.replace(
        /<\/div>\s*<\/div>\s*<nav/g,
        '</section>\n    </main>\n\n    <nav'
    );

    // Convert headings
    content = content.replace(
        /<h1 class="text-4xl font-bold text-gray-900 mb-4">([^<]+)<\/h1>/g,
        '<h1 class="hero-title">$1</h1>'
    );

    content = content.replace(
        /<h2 class="text-2xl font-bold text-gray-800 mb-4">([^<]+)<\/h2>/g,
        '<h2>$1</h2>'
    );

    content = content.replace(
        /<h2 class="text-3xl font-bold text-gray-900 mb-6">([^<]+)<\/h2>/g,
        '<h2>$1</h2>'
    );

    content = content.replace(
        /<h3 class="text-xl font-semibold text-gray-800 mb-3">([^<]+)<\/h3>/g,
        '<h3>$1</h3>'
    );

    // Convert paragraphs
    content = content.replace(
        /<p class="text-xl text-gray-600 mb-8">([^<]+)<\/p>/g,
        '<p class="hero-subtitle">$1</p>'
    );

    content = content.replace(
        /<p class="text-gray-700 mb-4">/g,
        '<p>'
    );

    content = content.replace(
        /<p class="text-gray-700">/g,
        '<p>'
    );

    content = content.replace(
        /<p class="text-gray-800">/g,
        '<p>'
    );

    // Convert colored boxes to meta-item
    content = content.replace(
        /<div class="bg-blue-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    content = content.replace(
        /<div class="bg-green-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    content = content.replace(
        /<div class="bg-purple-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    content = content.replace(
        /<div class="bg-orange-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    content = content.replace(
        /<div class="bg-red-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    content = content.replace(
        /<div class="bg-teal-50 p-4 rounded">\s*<h3 class="font-semibold mb-2">([^<]+)<\/h3>\s*<p class="text-sm">([^<]+)<\/p>\s*<\/div>/g,
        '<div class="meta-item">\n                        <div class="meta-label">$1</div>\n                        <div class="meta-value">$2</div>\n                    </div>'
    );

    // Convert grid containers
    content = content.replace(
        /<div class="grid md:grid-cols-2 gap-4">/g,
        '<div class="product-meta">'
    );

    // Convert sections
    content = content.replace(
        /<section class="mb-10">/g,
        '<div style="margin-bottom: var(--space-2xl);">'
    );

    content = content.replace(
        /<\/section>/g,
        '</div>'
    );

    // Convert links
    content = content.replace(
        /class="text-blue-600 underline font-semibold"/g,
        'style="color: var(--color-primary);"'
    );

    content = content.replace(
        /class="text-blue-600 hover:text-blue-800"/g,
        ''
    );

    content = content.replace(
        /class="text-gray-600 hover:text-blue-600"/g,
        ''
    );

    // Convert info boxes
    content = content.replace(
        /<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">/g,
        '<div class="meta-item" style="background: rgba(0, 240, 255, 0.05); margin-bottom: var(--space-lg);">'
    );

    return content;
}

/**
 * Update a single HTML file
 */
function updateFile(filePath) {
    console.log(`Processing: ${path.basename(filePath)}`);

    let html = fs.readFileSync(filePath, 'utf-8');

    // Replace Tailwind CDN with optimized CSS
    html = html.replace(
        /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/g,
        '    <!-- Optimized Frontend Design -->\n    <link rel="stylesheet" href="../styles/optimized-frontend.css">\n\n'
    );

    // Update body class
    html = html.replace(/<body class="bg-gray-50">/g, '<body>');

    // Replace navigation
    html = html.replace(
        /<nav class="bg-white shadow-md">[\s\S]*?<\/nav>/,
        NEW_NAV
    );

    // Replace footer
    html = html.replace(
        /<footer class="bg-gray-900[\s\S]*?<\/footer>/,
        NEW_FOOTER
    );

    // Convert content
    html = convertContent(html);

    // Write updated file
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✓ Updated: ${path.basename(filePath)}`);
}

/**
 * Main migration function
 */
function migrate() {
    console.log('Starting migration to optimized design...\n');

    // Get all HTML files
    const files = fs.readdirSync(DIST_DIR)
        .filter(f => f.endsWith('.html') && f !== 'index-optimized.html')
        .map(f => path.join(DIST_DIR, f));

    console.log(`Found ${files.length} HTML files to process\n`);

    // Process each file
    let processed = 0;
    let skipped = 0;

    files.forEach(file => {
        try {
            updateFile(file);
            processed++;
        } catch (error) {
            console.error(`✗ Error processing ${path.basename(file)}:`, error.message);
            skipped++;
        }
    });

    console.log('\n=================================');
    console.log(`Migration complete!`);
    console.log(`✓ Processed: ${processed} files`);
    console.log(`✗ Skipped: ${skipped} files`);
    console.log('=================================\n');
}

// Run migration
if (require.main === module) {
    migrate();
}

module.exports = { migrate, updateFile, convertContent };
