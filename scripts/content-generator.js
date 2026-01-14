#!/usr/bin/env node
/**
 * TrendRush - AI内容生成器
 * 用途: 基于热词快速生成SEO优化内容
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const CONFIG = {
    outputDir: process.env.OUTPUT_DIR || './generated-content',
    targetWords: parseInt(process.env.TARGET_WORDS) || 2000,
    keyword: process.env.KEYWORD || '',
    tone: process.env.TONE || 'informative',
    language: process.env.LANGUAGE || 'en'
};

/**
 * 内容生成策略
 */
const CONTENT_STRATEGIES = {
    'blog-post': generateBlogPost,
    'product-review': generateProductReview,
    'comparison': generateComparison,
    'tutorial': generateTutorial,
    'news': generateNewsArticle
};

/**
 * 生成博客文章
 */
async function generateBlogPost(keyword) {
    const structure = {
        title: `The Ultimate Guide to ${keyword}: Everything You Need to Know in 2024`,
        sections: [
            { type: 'h1', content: `${keyword}: Complete Guide` },
            { type: 'intro', content: generateIntro(keyword) },
            { type: 'h2', content: `What is ${keyword}?` },
            { type: 'definition', content: generateDefinition(keyword) },
            { type: 'h2', content: `Top 10 Benefits of ${keyword}` },
            { type: 'list', content: generateBenefits(keyword, 10) },
            { type: 'h2', content: `How to Choose the Right ${keyword}` },
            { type: 'guide', content: generateGuide(keyword) },
            { type: 'h2', content: `${keyword} Reviews: Top Picks` },
            { type: 'reviews', content: generateReviews(keyword, 5) },
            { type: 'h2', content: `FAQ: Common Questions About ${keyword}` },
            { type: 'faq', content: generateFAQ(keyword, 5) },
            { type: 'conclusion', content: generateConclusion(keyword) }
        ]
    };

    return renderHTML(structure, keyword);
}

/**
 * 生成产品评测
 */
async function generateProductReview(keyword) {
    const structure = {
        title: `${keyword} Review 2024: Is It Worth Your Money?`,
        sections: [
            { type: 'h1', content: `${keyword} - Complete Review` },
            { type: 'rating-box', content: generateRatingBox() },
            { type: 'intro', content: generateReviewIntro(keyword) },
            { type: 'h2', content: `Key Features` },
            { type: 'features', content: generateFeatures(keyword) },
            { type: 'h2', content: `Pros and Cons` },
            { type: 'pros-cons', content: generateProsCons(keyword) },
            { type: 'h2', content: `Pricing` },
            { type: 'pricing', content: generatePricing(keyword) },
            { type: 'h2', content: `Our Verdict` },
            { type: 'verdict', content: generateVerdict(keyword) },
            { type: 'h2', content: `Alternatives to ${keyword}` },
            { type: 'alternatives', content: generateAlternatives(keyword, 3) },
            { type: 'cta', content: generateCTA(keyword) }
        ]
    };

    return renderHTML(structure, keyword);
}

/**
 * HTML渲染器
 */
function renderHTML(structure, keyword) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${structure.title}</title>
    <meta name="description" content="Discover ${keyword}: Complete guide, reviews, and tips.">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <article class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">${structure.title}</h1>
`;

    structure.sections.forEach(section => {
        html += renderSection(section, keyword);
    });

    html += `
    </article>

    <!-- 变现元素 -->
    <div class="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 class="text-xl font-semibold mb-4">Recommended Products</h3>
        <div id="amazon-products"></div>
    </div>

    <!-- 邮件订阅 -->
    <div class="mt-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
        <h3 class="text-xl font-semibold mb-2">Stay Updated</h3>
        <p class="mb-4">Get the latest tips and deals delivered to your inbox.</p>
        <form class="flex gap-2">
            <input type="email" placeholder="Your email" class="flex-1 px-4 py-2 rounded text-gray-900">
            <button class="px-6 py-2 bg-white text-purple-600 font-semibold rounded hover:bg-gray-100">
                Subscribe
            </button>
        </form>
    </div>

    <script>
        // 动态加载 Amazon 产品
        fetch('/api/products?keyword=${encodeURIComponent(keyword)}')
            .then(res => res.json())
            .then(products => {
                document.getElementById('amazon-products').innerHTML = products.map(p => `
                    <div class="flex items-center gap-4 mb-4">
                        <img src="${p.image}" alt="${p.title}" class="w-20 h-20 object-cover rounded">
                        <div class="flex-1">
                            <h4 class="font-semibold">${p.title}</h4>
                            <div class="flex items-center gap-2">
                                <span class="text-yellow-500">${'★'.repeat(Math.floor(p.rating))}</span>
                                <span class="text-gray-600">(${p.reviews})</span>
                            </div>
                            <p class="text-lg font-bold text-green-600">$${p.price}</p>
                        </div>
                        <a href="${p affiliate}" target="_blank" class="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded hover:bg-yellow-500">
                            View on Amazon
                        </a>
                    </div>
                `).join('');
            });
    </script>
</body>
</html>`;

    return html;
}

function renderSection(section, keyword) {
    const sectionMap = {
        'h1': (s) => `<h1 class="text-4xl font-bold text-gray-900 mb-6">${s.content}</h1>`,
        'h2': (s) => `<h2 class="text-3xl font-bold text-gray-800 mt-12 mb-6">${s.content}</h2>`,
        'intro': (s) => `<p class="text-xl text-gray-700 leading-relaxed mb-6">${s.content}</p>`,
        'list': (s) => `<ul class="list-disc list-inside space-y-3 mb-8">${s.content.map(item => `<li class="text-gray-700">${item}</li>`).join('')}</ul>`,
        'pros-cons': (s) => renderProsCons(s.content),
        'rating-box': (s) => `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">${s.content}</div>`,
        'cta': (s) => `<div class="mt-12 p-8 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg text-center">${s.content}</div>`
    };

    return sectionMap[section.type]?.(section) || `<div>${section.content}</div>`;
}

// 内容生成辅助函数
function generateIntro(keyword) {
    return `Are you looking for information about ${keyword}? You're in the right place. In this comprehensive guide, we'll cover everything you need to know about ${keyword}, from the basics to advanced tips and tricks.`;
}

function generateBenefits(keyword, count) {
    return Array.from({length: count}, (_, i) => `Benefit ${i + 1}: How ${keyword} helps you achieve your goals`);
}

function generateReviews(keyword, count) {
    return Array.from({length: count}, (_, i) => ({
        title: `Product ${i + 1}`,
        rating: 4 + Math.random(),
        description: `Great ${keyword} option`
    }));
}

function generateProsCons(keyword) {
    return {
        pros: ['Benefit 1', 'Benefit 2', 'Benefit 3'],
        cons: ['Drawback 1', 'Drawback 2']
    };
}

function renderProsCons(data) {
    return `
        <div class="grid md:grid-cols-2 gap-6 mb-8">
            <div class="bg-green-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-green-800 mb-4">✓ Pros</h3>
                <ul class="space-y-2">
                    ${data.pros.map(p => `<li class="text-green-700">${p}</li>`).join('')}
                </ul>
            </div>
            <div class="bg-red-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold text-red-800 mb-4">✗ Cons</h3>
                <ul class="space-y-2">
                    ${data.cons.map(c => `<li class="text-red-700">${c}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function generateRatingBox() {
    return `
        <div class="flex items-center justify-between">
            <div>
                <div class="text-5xl font-bold text-gray-900">4.5</div>
                <div class="text-yellow-500 text-2xl">★★★★★</div>
                <div class="text-gray-600">Based on 1,234 reviews</div>
            </div>
            <div class="text-right">
                <div class="text-sm text-gray-600">Our Verdict</div>
                <div class="text-xl font-bold text-green-600">Excellent Choice</div>
            </div>
        </div>
    `;
}

function generateFAQ(keyword, count) {
    return Array.from({length: count}, (_, i) => ({
        q: `Question ${i + 1} about ${keyword}?`,
        a: `Detailed answer to help users understand ${keyword} better.`
    }));
}

function generateCTA(keyword) {
    return `
        <h3 class="text-2xl font-bold mb-4">Ready to Get Started with ${keyword}?</h3>
        <p class="mb-6">Join thousands of satisfied users who have already discovered the benefits of ${keyword}.</p>
        <a href="#" class="inline-block px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-lg hover:bg-gray-100">
            Get Started Now →
        </a>
    `;
}

// 其他生成函数...
function generateDefinition(keyword) { return `${keyword} is...`; }
function generateGuide(keyword) { return `Step-by-step guide...`; }
function generateReviewIntro(keyword) { return `Our expert review...`; }
function generateFeatures(keyword) { return ['Feature 1', 'Feature 2', 'Feature 3']; }
function generatePricing(keyword) { return '$9.99/month'; }
function generateVerdict(keyword) { return 'Highly recommended'; }
function generateAlternatives(keyword, count) { return []; }
function generateConclusion(keyword) { return `Final thoughts...`; }

/**
 * 主执行函数
 */
async function main() {
    const keyword = CONFIG.keyword;

    if (!keyword) {
        console.error('❌ 请提供 KEYWORD 环境变量');
        console.log('用法: KEYWORD="your-keyword" node content-generator.js');
        process.exit(1);
    }

    console.log(`🚀 TrendRush 内容生成器`);
    console.log(`关键词: ${keyword}`);
    console.log(`目标字数: ${CONFIG.targetWords}`);
    console.log('');

    // 创建输出目录
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    // 生成不同类型的内容
    const types = ['blog-post', 'product-review'];
    const generated = [];

    for (const type of types) {
        console.log(`📝 生成 ${type}...`);
        const content = await CONTENT_STRATEGIES[type](keyword);
        const filename = `${type}.html`;
        const filepath = path.join(CONFIG.outputDir, filename);

        await fs.writeFile(filepath, content);
        generated.push(filepath);
        console.log(`✅ 已保存: ${filepath}`);
    }

    // 生成元数据
    const metadata = {
        keyword,
        generatedAt: new Date().toISOString(),
        files: generated,
        seo: {
            title: `${keyword} - Complete Guide 2024`,
            description: `Discover ${keyword}: Comprehensive reviews, guides, and tips.`,
            keywords: [keyword, `${keyword} reviews`, `best ${keyword}`, `${keyword} guide`]
        }
    };

    await fs.writeFile(
        path.join(CONFIG.outputDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );

    console.log('');
    console.log('✅ 内容生成完成!');
    console.log(`📂 输出目录: ${CONFIG.outputDir}`);
    console.log(`📄 生成文件: ${generated.length} 个`);
}

// 运行
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateBlogPost, generateProductReview };
