#!/usr/bin/env node

/**
 * HTML SEO Meta Tag Optimizer
 * Automatically checks and optimizes HTML meta tags for all pages
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const DOMAIN = 'https://agenticaitools2026.com';
const TODAY = new Date().toISOString().split('T')[0];

// Page-specific SEO metadata
const seoMetadata = {
  'index.html': {
    title: 'Agentic AI Tools 2026 - Complete Guide to Autonomous AI Agents',
    description: 'Discover the best Agentic AI Tools for 2026: Complete reviews, comparison, and expert tips on AutoGPT, Claude Code, CrewAI, and more.',
    keywords: 'Agentic AI Tools 2026, autonomous AI, AI agents, AutoGPT, Claude Code, CrewAI, AgentGPT, best AI tools'
  },
  'claude-code-ultimate-guide.html': {
    title: 'Claude Code Ultimate Guide 2026 - Master Anthropic\'s AI Coding Assistant',
    description: 'Complete guide to Claude Code: Learn how to use Anthropic\'s AI assistant for coding, debugging, and development workflows in 2026.',
    keywords: 'Claude Code, Anthropic Claude, AI coding assistant, AI programming, Claude Code tutorial, AI developer tools'
  },
  'chatgpt-complete-guide-2026.html': {
    title: 'ChatGPT Complete Guide 2026 - Master OpenAI\'s AI Assistant',
    description: 'Ultimate ChatGPT guide for 2026: Tips, tricks, prompts, and best practices for using OpenAI\'s ChatGPT effectively.',
    keywords: 'ChatGPT, OpenAI, AI assistant, GPT-4, ChatGPT prompts, AI conversation, ChatGPT tutorial'
  },
  'auto-gpt-complete-review.html': {
    title: 'AutoGPT Complete Review 2026 - Autonomous AI Agent Explained',
    description: 'In-depth AutoGPT review: How this autonomous AI agent works, features, use cases, and alternatives in 2026.',
    keywords: 'AutoGPT, autonomous AI, AI agents, AutoGPT review, AutoGPT tutorial, AI automation'
  },
  'top-10-ai-tools-2026.html': {
    title: 'Top 10 AI Tools 2026 - Best Artificial Intelligence Software Reviewed',
    description: 'Discover the top 10 AI tools for 2026: Comprehensive reviews of the best AI software for productivity, coding, and creativity.',
    keywords: 'top AI tools 2026, best AI software, AI tools review, artificial intelligence tools, AI productivity tools'
  },
  'best-ai-agents-2026.html': {
    title: 'Best AI Agents 2026 - Top Autonomous AI Tools Compared',
    description: 'Compare the best AI agents of 2026: AutoGPT, Claude, CrewAI, and more. Features, pricing, and use cases.',
    keywords: 'best AI agents, autonomous AI, AI agent comparison, AutoGPT alternatives, AI tools 2026'
  },
  'agentic-ai-best-practices.html': {
    title: 'Agentic AI Best Practices 2026 - Building Effective AI Agents',
    description: 'Learn best practices for building and deploying agentic AI systems in 2026. Expert tips on architecture, testing, and scaling.',
    keywords: 'agentic AI best practices, AI agent development, autonomous AI design, AI architecture'
  },
  'beginners-guide-to-ai-agents.html': {
    title: 'Beginners Guide to AI Agents 2026 - Understanding Autonomous AI',
    description: 'Complete beginner\'s guide to AI agents: Learn what autonomous AI is, how it works, and how to get started in 2026.',
    keywords: 'AI agents for beginners, autonomous AI introduction, AI agent tutorial, learn AI agents'
  },
  'ai-seo-guide.html': {
    title: 'AI SEO Guide 2026 - Using Artificial Intelligence for Search Optimization',
    description: 'Master AI-powered SEO in 2026: Learn how to use AI tools for keyword research, content optimization, and ranking higher.',
    keywords: 'AI SEO, artificial intelligence SEO, SEO automation, AI content optimization, SEO tools 2026'
  },
  'rag-complete-guide-2026.html': {
    title: 'RAG Complete Guide 2026 - Retrieval-Augmented Generation Explained',
    description: 'Comprehensive RAG guide: Learn Retrieval-Augmented Generation, implementation, best practices, and tools for 2026.',
    keywords: 'RAG, Retrieval-Augmented Generation, RAG tutorial, AI knowledge base, vector database'
  },
  'prompt-engineering-guide.html': {
    title: 'Prompt Engineering Guide 2026 - Master AI Prompt Writing',
    description: 'Ultimate prompt engineering guide for 2026: Learn techniques, templates, and best practices for effective AI prompts.',
    keywords: 'prompt engineering, AI prompts, prompt design, ChatGPT prompts, prompt templates'
  },
  'local-llms-guide.html': {
    title: 'Local LLMs Guide 2026 - Run Large Language Models Offline',
    description: 'Complete guide to local LLMs: Learn how to run and optimize large language models on your own hardware in 2026.',
    keywords: 'local LLMs, offline AI, run LLM locally, local AI models, Ollama, Llama'
  },
  'ai-in-healthcare-2026.html': {
    title: 'AI in Healthcare 2026 - Medical AI Applications and Innovations',
    description: 'Explore AI applications in healthcare for 2026: Diagnosis, drug discovery, telemedicine, and medical AI innovations.',
    keywords: 'AI in healthcare, medical AI, healthcare technology, AI diagnosis, medical AI applications'
  },
  'ai-in-finance-2026.html': {
    title: 'AI in Finance 2026 - Financial AI and Fintech Innovations',
    description: 'Discover how AI is transforming finance in 2026: Trading, fraud detection, robo-advisors, and banking innovations.',
    keywords: 'AI in finance, fintech AI, financial AI, trading algorithms, AI banking'
  },
  'cursor-ai-review.html': {
    title: 'Cursor AI Review 2026 - The AI-Powered Code Editor',
    description: 'In-depth Cursor AI review: Features, pricing, pros and cons of this AI-powered code editor for developers.',
    keywords: 'Cursor AI, AI code editor, Cursor review, AI programming tools, code editor'
  },
};

// Default metadata for pages without specific config
const defaultMetadata = {
  description: 'Explore Agentic AI Tools 2026: Your comprehensive guide to autonomous AI agents, AI-powered tools, and the future of artificial intelligence.',
  keywords: 'AI tools 2026, artificial intelligence, AI agents, machine learning, automation'
};

function getSeoMetadata(filename) {
  const metadata = seoMetadata[filename];
  if (!metadata) {
    // Generate title from filename
    const title = filename
      .replace('.html', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return {
      title: `${title} - Agentic AI Tools 2026`,
      ...defaultMetadata
    };
  }
  return metadata;
}

function checkHtmlSeo(html, filename) {
  const issues = [];
  const metadata = getSeoMetadata(filename);

  // Check for title tag
  if (!html.match(/<title[^>]*>([^<]+)<\/title>/i)) {
    issues.push({ type: 'error', message: 'Missing <title> tag' });
  }

  // Check for meta description
  if (!html.match(/<meta[^>]*name=["']description["'][^>]*>/i)) {
    issues.push({ type: 'error', message: 'Missing meta description' });
  }

  // Check for meta keywords
  if (!html.match(/<meta[^>]*name=["']keywords["'][^>]*>/i)) {
    issues.push({ type: 'warning', message: 'Missing meta keywords' });
  }

  // Check for canonical URL
  if (!html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i)) {
    issues.push({ type: 'warning', message: 'Missing canonical link' });
  }

  // Check for Open Graph tags
  if (!html.match(/<meta[^>]*property=["']og:title["'][^>]*>/i)) {
    issues.push({ type: 'warning', message: 'Missing og:title' });
  }
  if (!html.match(/<meta[^>]*property=["']og:description["'][^>]*>/i)) {
    issues.push({ type: 'warning', message: 'Missing og:description' });
  }
  if (!html.match(/<meta[^>]*property=["']og:image["'][^>]*>/i)) {
    issues.push({ type: 'warning', message: 'Missing og:image' });
  }

  // Check for Twitter Card
  if (!html.match(/<meta[^>]*name=["']twitter:card["'][^>]*>/i)) {
    issues.push({ type: 'info', message: 'Missing twitter:card' });
  }

  // Check for structured data
  if (!html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i)) {
    issues.push({ type: 'info', message: 'Missing structured data (JSON-LD)' });
  }

  return issues;
}

function generateSeoReport() {
  const htmlFiles = fs.readdirSync(DIST_DIR)
    .filter(file => file.endsWith('.html'))
    .sort();

  const report = {
    generated: TODAY,
    totalFiles: htmlFiles.length,
    issues: {
      error: 0,
      warning: 0,
      info: 0
    },
    files: []
  };

  htmlFiles.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const issues = checkHtmlSeo(html, file);

    issues.forEach(issue => {
      report.issues[issue.type]++;
    });

    report.files.push({
      file,
      issues: issues.length,
      details: issues
    });
  });

  return report;
}

function main() {
  console.log('🔍 SEO Audit Report\n');
  console.log('=' .repeat(60));

  const report = generateSeoReport();

  console.log(`\n📊 Summary:`);
  console.log(`   Total files: ${report.totalFiles}`);
  console.log(`   Errors: ${report.issues.error}`);
  console.log(`   Warnings: ${report.issues.warning}`);
  console.log(`   Info: ${report.issues.info}`);

  console.log(`\n📁 Files with issues:\n`);

  report.files
    .filter(f => f.issues > 0)
    .forEach(file => {
      console.log(`\n${file.file}:`);
      file.details.forEach(issue => {
        const icon = {
          error: '❌',
          warning: '⚠️',
          info: 'ℹ️'
        }[issue.type];
        console.log(`  ${icon} ${issue.message}`);
      });
    });

  // Save report
  const reportPath = path.join(__dirname, 'seo-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n💾 Full report saved to: ${reportPath}`);
  console.log('\n✅ SEO audit complete!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkHtmlSeo, getSeoMetadata, generateSeoReport };
