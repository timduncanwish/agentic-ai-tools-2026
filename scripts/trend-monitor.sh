#!/bin/bash
# TrendRush - Google Trends Monitoring Script
# 用途: 实时监控并发现高价值热词

set -e

# 配置
REGION="${REGION:-US}"
CATEGORY="${CATEGORY:-all}"
MIN_VOLUME="${MIN_VOLUME:-10000}"
MIN_CPC="${MIN_CPC:-5}"
MAX_COMPETITION="${MAX_COMPETITION:-0.3}"
OUTPUT_FILE="${OUTPUT_FILE:-trending-keywords.json}"

echo "🔍 TrendRush - 热词监控系统"
echo "================================"
echo "地区: $REGION"
echo "分类: $CATEGORY"
echo "最低搜索量: $MIN_VOLUME"
echo "最低CPC: $MIN_CPC"
echo "最高竞争度: $MAX_COMPETITION"
echo ""

# 检查依赖
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装 Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ 需要安装 npm"; exit 1; }

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install google-trends-api axios cheerio
fi

# 创建监控脚本
cat > monitor-trends.js << 'EOF'
const googleTrends = require('google-trends-api');
const fs = require('fs');

async function getTrendingKeywords(region, category) {
    try {
        // 获取实时搜索趋势
        const trends = await googleTrends.realTimeTrends({
            geo: region,
            category: category
        });

        const data = JSON.parse(trends);
        const rankings = data.default.rankings || [];
        const keywords = [];

        // 提取关键词和指标
        rankings.forEach(ranking => {
            ranking.rankedKeywords.forEach(item => {
                keywords.push({
                    keyword: item.title,
                    traffic: item.formattedTraffic,
                    category: ranking.category
                });
            });
        });

        return keywords;
    } catch (error) {
        console.error('获取趋势失败:', error.message);
        return [];
    }
}

async function filterByValue(keywords, minVolume, minCpc, maxCompetition) {
    // 这里可以集成 SEMRush, Ahrefs 或其他关键词工具 API
    // 简化版本：基于启发式规则过滤

    return keywords.filter(kw => {
        // 示例过滤规则
        const valueScore = calculateValueScore(kw);
        return valueScore >= 7;
    });
}

function calculateValueScore(keyword) {
    let score = 0;

    // 规则1: 包含"best", "top", "review"等高价值词
    const highValueTerms = ['best', 'top', 'review', 'vs', 'guide', 'tutorial', 'how to', 'buy'];
    if (highValueTerms.some(term => keyword.keyword.toLowerCase().includes(term))) {
        score += 3;
    }

    // 规则2: 产品类别
    const productCategories = ['software', 'tool', 'service', 'app', 'game', 'product'];
    if (productCategories.some(cat => keyword.category && keyword.category.toLowerCase().includes(cat))) {
        score += 2;
    }

    // 规则3: 流量等级
    const traffic = parseInt(keyword.traffic) || 0;
    if (traffic >= 50000) score += 3;
    else if (traffic >= 20000) score += 2;
    else if (traffic >= 10000) score += 1;

    return score;
}

// 主函数
(async () => {
    const region = process.env.REGION || 'US';
    const category = process.env.CATEGORY || 'all';

    console.log('📊 获取 Google Trends 数据...');
    const keywords = await getTrendingKeywords(region, category);
    console.log(`✅ 找到 ${keywords.length} 个热词`);

    console.log('🔍 分析价值...');
    const valuable = await filterByValue(keywords);
    console.log(`💰 发现 ${valuable.length} 个高价值关键词`);

    // 输出结果
    fs.writeFileSync(process.env.OUTPUT_FILE || 'trending-keywords.json',
        JSON.stringify(valuable, null, 2));

    // 显示Top 10
    console.log('\n🎯 TOP 10 高价值关键词:');
    valuable.slice(0, 10).forEach((kw, i) => {
        console.log(`${i + 1}. ${kw.keyword} (${kw.traffic} 搜索量) - 价值分: ${calculateValueScore(kw)}`);
    });
})();
EOF

# 运行监控
node monitor-trends.js

echo ""
echo "✅ 热词分析完成!"
echo "📄 结果保存至: $OUTPUT_FILE"
echo ""
echo "💡 下一步:"
echo "   gt generate --keyword=<选定的关键词> --template=monetized-blog"
