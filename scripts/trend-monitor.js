#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const googleTrends = require('google-trends-api');

const CONFIG = {
  region: process.env.REGION || 'US',
  category: process.env.CATEGORY || 'all',
  minVolume: Number.parseInt(process.env.MIN_VOLUME || '10000', 10),
  minScore: Number.parseInt(process.env.MIN_SCORE || '5', 10),
  outputFile: process.env.OUTPUT_FILE || 'trending-keywords.json'
};

function parseTraffic(formattedTraffic) {
  if (!formattedTraffic) {
    return 0;
  }

  const normalized = String(formattedTraffic).replace(/,/g, '').trim().toUpperCase();
  const match = normalized.match(/(\d+(?:\.\d+)?)([KMB])?/);

  if (!match) {
    return Number.parseInt(normalized, 10) || 0;
  }

  const value = Number.parseFloat(match[1]);
  const suffix = match[2];
  const multiplier = suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : suffix === 'K' ? 1_000 : 1;

  return Math.round(value * multiplier);
}

function calculateValueScore(item) {
  const keyword = (item.keyword || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const traffic = parseTraffic(item.traffic);

  const highIntentTerms = ['best', 'review', 'pricing', 'cost', 'compare', 'comparison', 'guide', 'tutorial', 'tool'];
  const productCategories = ['business', 'technology', 'finance', 'shopping'];

  let score = 0;

  if (highIntentTerms.some((term) => keyword.includes(term))) {
    score += 3;
  }

  if (productCategories.some((term) => category.includes(term))) {
    score += 2;
  }

  if (traffic >= 100000) {
    score += 3;
  } else if (traffic >= 50000) {
    score += 2;
  } else if (traffic >= CONFIG.minVolume) {
    score += 1;
  }

  if (keyword.split(/\s+/).length >= 3) {
    score += 1;
  }

  return score;
}

async function getTrendingKeywords(region, category) {
  const response = await googleTrends.realTimeTrends({
    geo: region,
    category
  });

  const parsed = JSON.parse(response);
  const rankings = parsed?.storySummaries?.trendingStories || parsed?.default?.rankings || [];

  if (parsed?.default?.rankings) {
    return parsed.default.rankings.flatMap((ranking) =>
      (ranking.rankedKeywords || []).map((item) => ({
        keyword: item?.title || '',
        traffic: item?.formattedTraffic || '0',
        category: ranking?.category || category
      }))
    );
  }

  return rankings.map((story) => ({
    keyword: story?.title || '',
    traffic: story?.formattedTraffic || '0',
    category: story?.entityNames?.join(', ') || category
  }));
}

async function main() {
  console.log('TrendRush trend monitor');
  console.log(`Region: ${CONFIG.region}`);
  console.log(`Category: ${CONFIG.category}`);
  console.log(`Min score: ${CONFIG.minScore}`);
  console.log('');

  let keywords;

  try {
    keywords = await getTrendingKeywords(CONFIG.region, CONFIG.category);
  } catch (error) {
    console.error(`Failed to fetch Google Trends data: ${error.message}`);
    process.exit(1);
  }

  const enriched = keywords
    .filter((item) => item.keyword)
    .map((item) => ({
      ...item,
      trafficValue: parseTraffic(item.traffic),
      score: calculateValueScore(item)
    }))
    .filter((item) => item.trafficValue >= CONFIG.minVolume || item.score >= CONFIG.minScore)
    .sort((left, right) => right.score - left.score || right.trafficValue - left.trafficValue);

  const outputPath = path.resolve(process.cwd(), CONFIG.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), 'utf8');

  console.log(`Found ${enriched.length} candidate keywords`);
  enriched.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. ${item.keyword} | traffic: ${item.traffic} | score: ${item.score}`);
  });
  console.log('');
  console.log(`Saved ${path.basename(outputPath)} to ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  calculateValueScore,
  getTrendingKeywords,
  parseTraffic
};
