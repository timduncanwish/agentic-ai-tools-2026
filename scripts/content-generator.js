#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  outputDir: process.env.OUTPUT_DIR || './generated-content',
  targetWords: Number.parseInt(process.env.TARGET_WORDS || '2000', 10),
  keyword: (process.env.KEYWORD || '').trim(),
  tone: process.env.TONE || 'informative',
  language: process.env.LANGUAGE || 'en'
};

const CONTENT_STRATEGIES = {
  'blog-post': generateBlogPost,
  'product-review': generateProductReview,
  comparison: generateComparison,
  tutorial: generateTutorial,
  news: generateNewsArticle
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildLayout({ title, description, keyword, body, metadata }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeKeyword = escapeHtml(keyword);
  const jsonLd = JSON.stringify(metadata, null, 2);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(CONFIG.language)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta name="keywords" content="${safeKeyword}, ${safeKeyword} guide, ${safeKeyword} review">
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f1ea;
      --surface: #fffdf8;
      --surface-alt: #f0ebe2;
      --text: #18212f;
      --muted: #5b6470;
      --primary: #0e6b5c;
      --accent: #d97a2b;
      --border: #ddd2c4;
      --shadow: 0 20px 50px rgba(24, 33, 47, 0.08);
      --radius: 22px;
      --font-display: "Georgia", "Times New Roman", serif;
      --font-body: "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: var(--font-body);
      background:
        radial-gradient(circle at top left, rgba(217, 122, 43, 0.16), transparent 30%),
        linear-gradient(180deg, #faf6ef 0%, var(--bg) 100%);
      color: var(--text);
      line-height: 1.7;
    }

    .page {
      max-width: 980px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }

    .hero,
    .section,
    .faq,
    .cta {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }

    .hero {
      padding: 40px;
      margin-bottom: 28px;
      position: relative;
      overflow: hidden;
    }

    .hero::after {
      content: "";
      position: absolute;
      inset: auto -80px -80px auto;
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, rgba(14, 107, 92, 0.22), transparent 70%);
    }

    .eyebrow {
      display: inline-flex;
      padding: 8px 14px;
      border-radius: 999px;
      background: var(--surface-alt);
      color: var(--primary);
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h1, h2, h3 {
      font-family: var(--font-display);
      line-height: 1.15;
      margin: 0 0 16px;
    }

    h1 { font-size: clamp(2.4rem, 5vw, 4.2rem); margin-top: 18px; }
    h2 { font-size: clamp(1.8rem, 3vw, 2.5rem); }
    h3 { font-size: 1.25rem; }

    p { margin: 0 0 18px; color: var(--muted); }

    .lead {
      font-size: 1.1rem;
      max-width: 62ch;
    }

    .meta-grid,
    .cards,
    .pros-cons,
    .steps {
      display: grid;
      gap: 18px;
    }

    .meta-grid,
    .pros-cons {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .cards,
    .steps {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .metric,
    .card,
    .panel,
    .step {
      border-radius: 18px;
      background: var(--surface-alt);
      padding: 20px;
      border: 1px solid rgba(24, 33, 47, 0.06);
    }

    .metric strong,
    .card strong,
    .step strong,
    .panel strong {
      color: var(--text);
    }

    .section,
    .faq,
    .cta {
      padding: 32px;
      margin-top: 22px;
    }

    ul {
      padding-left: 20px;
      margin: 0;
      color: var(--muted);
    }

    li + li { margin-top: 10px; }

    .cta {
      background: linear-gradient(135deg, #0e6b5c, #16404d);
      color: #f7f3eb;
    }

    .cta p,
    .cta li { color: rgba(247, 243, 235, 0.88); }

    .cta a {
      display: inline-block;
      margin-top: 12px;
      padding: 12px 18px;
      border-radius: 999px;
      background: #f7f3eb;
      color: #16404d;
      text-decoration: none;
      font-weight: 700;
    }

    .faq-item + .faq-item {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 640px) {
      .page { padding: 24px 14px 40px; }
      .hero,
      .section,
      .faq,
      .cta { padding: 22px; }
    }
  </style>
  <script type="application/ld+json">
${jsonLd}
  </script>
</head>
<body>
  <main class="page">
    ${body}
  </main>
</body>
</html>`;
}

function renderCardGrid(items) {
  return `<div class="cards">${items
    .map(
      (item) => `<article class="card">
  <h3>${escapeHtml(item.title)}</h3>
  <p>${escapeHtml(item.body)}</p>
</article>`
    )
    .join('')}</div>`;
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function renderFaq(items) {
  return `<section class="faq">
  <h2>Frequently asked questions</h2>
  ${items
    .map(
      (item) => `<div class="faq-item">
    <h3>${escapeHtml(item.question)}</h3>
    <p>${escapeHtml(item.answer)}</p>
  </div>`
    )
    .join('')}
</section>`;
}

function generateIntro(keyword) {
  return `If you are researching ${keyword}, this guide gives you a practical overview, the main tradeoffs, and the fastest way to act on the topic without wasting time on generic advice.`;
}

function generateDefinition(keyword) {
  return `${titleCase(keyword)} usually refers to the tools, workflows, and decisions people compare when they want a reliable way to evaluate the space and choose what to use next.`;
}

function generateBenefits(keyword, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return `${number}. ${titleCase(keyword)} can improve speed, reduce manual work, and make decision-making more consistent when you define clear selection criteria.`;
  });
}

function generateGuide(keyword) {
  return [
    `Define the main outcome you want from ${keyword} before comparing vendors or tutorials.`,
    `Shortlist options based on pricing, integrations, and maintenance overhead instead of feature count alone.`,
    `Test a realistic workflow, capture blockers, and choose the option that reduces ongoing operational cost.`
  ];
}

function generateReviews(keyword, count) {
  return Array.from({ length: count }, (_, index) => ({
    title: `${titleCase(keyword)} option ${index + 1}`,
    body: `A strong choice when you need predictable setup, clear documentation, and room to scale without changing tools too quickly.`
  }));
}

function generateFAQ(keyword, count) {
  return Array.from({ length: count }, (_, index) => ({
    question: `What should I check before choosing ${keyword}?`,
    answer:
      index === 0
        ? `Start with fit, implementation cost, and how quickly your team can get value from ${keyword} in production.`
        : `Compare the learning curve, recurring cost, and whether ${keyword} solves the exact problem you have today.`
  }));
}

function generateConclusion(keyword) {
  return `The best ${keyword} decision is usually the one that solves a narrow problem well, can be validated quickly, and does not create unnecessary operational complexity later.`;
}

function generateFeatures(keyword) {
  return [
    `${titleCase(keyword)} setup workflow with clear onboarding`,
    `Automation hooks that reduce repetitive manual work`,
    `Reporting and visibility so results can be measured`
  ];
}

function generatePricing(keyword) {
  return `${titleCase(keyword)} pricing typically ranges from entry-level plans for experimentation to enterprise contracts that add security, governance, and support.`;
}

function generateVerdict(keyword) {
  return `Treat ${keyword} as a practical business tool, not a novelty. If the workflow is clear and the economics work, it is worth piloting.`;
}

function generateAlternatives(keyword, count) {
  return Array.from({ length: count }, (_, index) => ({
    title: `Alternative ${index + 1}`,
    body: `Useful if you need a different pricing model, deeper customization, or a lighter implementation footprint than the default ${keyword} option.`
  }));
}

function generateCTA(keyword) {
  const href = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
  return `<section class="cta">
  <h2>Ready to evaluate ${escapeHtml(keyword)}?</h2>
  <p>Use this page as a checklist, test one real workflow, and document the outcome before committing to a larger rollout.</p>
  <a href="${href}" target="_blank" rel="noreferrer">Research ${escapeHtml(keyword)}</a>
</section>`;
}

function renderProsCons(data) {
  return `<div class="pros-cons">
  <div class="panel">
    <h3>Pros</h3>
    ${renderList(data.pros)}
  </div>
  <div class="panel">
    <h3>Cons</h3>
    ${renderList(data.cons)}
  </div>
</div>`;
}

async function generateBlogPost(keyword) {
  const title = `The Ultimate Guide to ${titleCase(keyword)}`;
  const description = `A practical guide to ${keyword}, including benefits, evaluation criteria, and next steps.`;
  const benefits = generateBenefits(keyword, 6);
  const guideSteps = generateGuide(keyword);
  const reviewCards = generateReviews(keyword, 3);
  const faqs = generateFAQ(keyword, 4);

  const body = `<section class="hero">
  <span class="eyebrow">Guide</span>
  <h1>${escapeHtml(title)}</h1>
  <p class="lead">${escapeHtml(generateIntro(keyword))}</p>
  <div class="meta-grid">
    <div class="metric"><strong>Intent</strong><p>Commercial research</p></div>
    <div class="metric"><strong>Best for</strong><p>Readers comparing tools and execution paths</p></div>
    <div class="metric"><strong>Read time</strong><p>${Math.max(8, Math.round(CONFIG.targetWords / 220))} minutes</p></div>
  </div>
</section>

<section class="section">
  <h2>What is ${escapeHtml(titleCase(keyword))}?</h2>
  <p>${escapeHtml(generateDefinition(keyword))}</p>
</section>

<section class="section">
  <h2>Why people care about ${escapeHtml(titleCase(keyword))}</h2>
  ${renderList(benefits)}
</section>

<section class="section">
  <h2>How to evaluate it</h2>
  <div class="steps">${guideSteps
    .map(
      (step, index) => `<div class="step">
    <strong>Step ${index + 1}</strong>
    <p>${escapeHtml(step)}</p>
  </div>`
    )
    .join('')}</div>
</section>

<section class="section">
  <h2>Popular approaches</h2>
  ${renderCardGrid(reviewCards)}
</section>

${renderFaq(faqs)}
${generateCTA(keyword)}`;

  return buildLayout({
    title,
    description,
    keyword,
    body,
    metadata: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      keywords: [keyword, `${keyword} guide`, `${keyword} review`]
    }
  });
}

async function generateProductReview(keyword) {
  const title = `${titleCase(keyword)} Review`;
  const description = `An opinionated review of ${keyword}, covering features, pros and cons, pricing, and alternatives.`;
  const body = `<section class="hero">
  <span class="eyebrow">Review</span>
  <h1>${escapeHtml(title)}</h1>
  <p class="lead">${escapeHtml(
    `This review focuses on practical value: what ${keyword} does well, where it falls short, and how to decide whether it fits your workflow.`
  )}</p>
  <div class="meta-grid">
    <div class="metric"><strong>Overall</strong><p>4.4 / 5</p></div>
    <div class="metric"><strong>Fit</strong><p>Best when speed matters more than extreme customization</p></div>
    <div class="metric"><strong>Risk</strong><p>Review integrations and long-term cost before scaling</p></div>
  </div>
</section>

<section class="section">
  <h2>Key features</h2>
  ${renderList(generateFeatures(keyword))}
</section>

<section class="section">
  <h2>Pros and cons</h2>
  ${renderProsCons({
    pros: [
      `Fast path to initial value for ${keyword}`,
      'Lower effort to validate than building from scratch',
      'Useful for teams that need a documented process'
    ],
    cons: [
      'Recurring cost may rise with adoption',
      'Fit depends on integration depth and data quality',
      'Some teams may need more control than the default setup allows'
    ]
  })}
</section>

<section class="section">
  <h2>Pricing</h2>
  <p>${escapeHtml(generatePricing(keyword))}</p>
</section>

<section class="section">
  <h2>Verdict</h2>
  <p>${escapeHtml(generateVerdict(keyword))}</p>
</section>

<section class="section">
  <h2>Alternatives</h2>
  ${renderCardGrid(generateAlternatives(keyword, 3))}
</section>

${renderFaq(generateFAQ(keyword, 3))}
${generateCTA(keyword)}`;

  return buildLayout({
    title,
    description,
    keyword,
    body,
    metadata: {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Thing',
        name: titleCase(keyword)
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.4',
        bestRating: '5'
      },
      name: title,
      description
    }
  });
}

async function generateComparison(keyword) {
  return buildLayout({
    title: `${titleCase(keyword)} Comparison`,
    description: `A comparison template for ${keyword}.`,
    keyword,
    body: `<section class="hero">
  <span class="eyebrow">Comparison</span>
  <h1>${escapeHtml(titleCase(keyword))} Comparison</h1>
  <p class="lead">Use this template to compare leading options by fit, cost, and operational complexity.</p>
</section>`,
    metadata: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${titleCase(keyword)} Comparison`
    }
  });
}

async function generateTutorial(keyword) {
  return buildLayout({
    title: `${titleCase(keyword)} Tutorial`,
    description: `A tutorial template for ${keyword}.`,
    keyword,
    body: `<section class="hero">
  <span class="eyebrow">Tutorial</span>
  <h1>${escapeHtml(titleCase(keyword))} Tutorial</h1>
  <p class="lead">Follow a real workflow from setup to validation so you can confirm ${escapeHtml(keyword)} works in practice.</p>
</section>`,
    metadata: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `${titleCase(keyword)} Tutorial`
    }
  });
}

async function generateNewsArticle(keyword) {
  return buildLayout({
    title: `${titleCase(keyword)} News`,
    description: `A news template for ${keyword}.`,
    keyword,
    body: `<section class="hero">
  <span class="eyebrow">News</span>
  <h1>${escapeHtml(titleCase(keyword))} News Roundup</h1>
  <p class="lead">Summarize the latest developments, what changed, and why it matters to buyers and builders.</p>
</section>`,
    metadata: {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: `${titleCase(keyword)} News`
    }
  });
}

async function main() {
  const keyword = CONFIG.keyword;

  if (!keyword) {
    console.error('KEYWORD environment variable is required.');
    console.error('Example: KEYWORD="ai agent builder" npm run generate');
    process.exit(1);
  }

  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  const types = ['blog-post', 'product-review'];
  const files = [];

  for (const type of types) {
    const content = await CONTENT_STRATEGIES[type](keyword);
    const filename = `${slugify(keyword)}-${type}.html`;
    const filepath = path.join(CONFIG.outputDir, filename);

    await fs.writeFile(filepath, content, 'utf8');
    files.push(filepath);
    console.log(`Generated ${filepath}`);
  }

  const metadata = {
    keyword,
    tone: CONFIG.tone,
    language: CONFIG.language,
    targetWords: CONFIG.targetWords,
    generatedAt: new Date().toISOString(),
    files
  };

  const metadataPath = path.join(CONFIG.outputDir, `${slugify(keyword)}-metadata.json`);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`Generated metadata ${metadataPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  generateBlogPost,
  generateProductReview,
  generateComparison,
  generateTutorial,
  generateNewsArticle
};
