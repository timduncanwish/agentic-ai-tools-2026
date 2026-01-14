#!/usr/bin/env node
/**
 * TrendRush - 一键部署脚本
 * 支持: Vercel, Netlify, Cloudflare Pages
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
    platform: process.env.DEPLOY_PLATFORM || 'vercel',
    keyword: process.env.KEYWORD,
    domain: process.env.DOMAIN,
    outputDir: process.env.OUTPUT_DIR || './dist'
};

/**
 * Vercel 部署
 */
async function deployToVercel() {
    console.log('🚀 部署到 Vercel...');

    try {
        // 检查 vercel CLI
        execSync('vercel --version', { stdio: 'inherit' });
    } catch {
        console.log('📦 安装 Vercel CLI...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
    }

    // 创建 vercel.json 配置
    const vercelConfig = {
        version: 2,
        name: `${CONFIG.keyword}-site`,
        buildCommand: 'echo "Static site - no build needed"',
        outputDirectory: 'dist',
        routes: [
            { src: '/(.*)', dest: '/$1' }
        ],
        env: {
            KEYWORD: CONFIG.keyword
        }
    };

    await fs.writeFile('vercel.json', JSON.stringify(vercelConfig, null, 2));

    // 部署
    console.log('📤 开始部署...');
    const deployCmd = CONFIG.domain
        ? `vercel --prod --yes ${CONFIG.outputDir}`
        : `vercel --yes ${CONFIG.outputDir}`;

    const output = execSync(deployCmd, { encoding: 'utf-8' });

    // 提取部署 URL
    const urlMatch = output.match(/https?:\/\/[^\s]+vercel\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    if (deployUrl) {
        console.log(`✅ 部署成功: ${deployUrl}`);

        // 配置自定义域名（如果提供）
        if (CONFIG.domain) {
            console.log(`🌐 配置自定义域名: ${CONFIG.domain}`);
            execSync(`vercel domains add ${CONFIG.domain}`, { stdio: 'inherit' });
        }

        return deployUrl;
    }

    throw new Error('部署失败: 无法获取 URL');
}

/**
 * Netlify 部署
 */
async function deployToNetlify() {
    console.log('🚀 部署到 Netlify...');

    try {
        execSync('netlify --version', { stdio: 'inherit' });
    } catch {
        console.log('📦 安装 Netlify CLI...');
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    }

    // 创建 netlify.toml
    const netlifyConfig = `
[build]
  publish = "${CONFIG.outputDir}"
  command = "echo 'Static site'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

    await fs.writeFile('netlify.toml', netlifyConfig);

    // 部署
    console.log('📤 开始部署...');
    const deployCmd = CONFIG.domain
        ? `netlify deploy --prod --dir=${CONFIG.outputDir} --alias=${CONFIG.domain}`
        : `netlify deploy --prod --dir=${CONFIG.outputDir}`;

    const output = execSync(deployCmd, { encoding: 'utf-8' });

    const urlMatch = output.match(/https?:\/\/[^\s]+netlify\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    if (deployUrl) {
        console.log(`✅ 部署成功: ${deployUrl}`);
        return deployUrl;
    }

    throw new Error('部署失败');
}

/**
 * Cloudflare Pages 部署
 */
async function deployToCloudflare() {
    console.log('🚀 部署到 Cloudflare Pages...');

    // 需要 wrangler CLI
    try {
        execSync('wrangler --version', { stdio: 'inherit' });
    } catch {
        console.log('📦 安装 Wrangler CLI...');
        execSync('npm install -g wrangler', { stdio: 'inherit' });
    }

    const projectName = `${CONFIG.keyword.toLowerCase().replace(/\s+/g, '-')}-site`;

    // 创建构建配置
    const buildConfig = {
        name: projectName,
        production_branch: 'main',
        preview_deployment_setting: 'custom'
    };

    await fs.writeFile('wrangler.toml', `
name = "${projectName}"
type = "webpack"
account_id = "${process.env.CLOUDFLARE_ACCOUNT_ID || ''}"
workers_dev = true
`);

    console.log('📤 开始部署...');
    console.log('⚠️  Cloudflare Pages 需要手动配置，请访问:');
    console.log(`https://dash.cloudflare.com/`);

    return 'https://pages.cloudflare.com';
}

/**
 * 提交搜索引擎
 */
async function submitToSearchEngines(siteUrl, keyword) {
    console.log('\n🔍 提交到搜索引擎...');

    // 生成 sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${siteUrl}/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${siteUrl}/#${keyword}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <priority>0.8</priority>
    </url>
</urlset>`;

    await fs.writeFile(path.join(CONFIG.outputDir, 'sitemap.xml'), sitemap);

    // Google Search Console
    console.log(`📊 Google Search Console:`);
    console.log(`   1. 访问: https://search.google.com/search-console`);
    console.log(`   2. 添加资源: ${siteUrl}`);
    console.log(`   3. 提交 sitemap: ${siteUrl}/sitemap.xml`);

    // Bing Webmaster Tools
    console.log(`\n📊 Bing Webmaster Tools:`);
    console.log(`   1. 访问: https://www.bing.com/webmasters`);
    console.log(`   2. 添加网站: ${siteUrl}`);
    console.log(`   3. 提交 sitemap`);

    console.log('\n✅ 记得完成搜索引擎验证!');
}

/**
 * 配置 DNS 和域名
 */
async function setupDomain(domain, deployUrl) {
    if (!domain) return;

    console.log('\n🌐 配置自定义域名...');

    const instructions = {
        vercel: `
1. 在 Vercel 中添加域名: vercel domains add ${domain}
2. 配置 DNS 记录:
   Type: CNAME
   Name: ${domain.split('.')[0]}
   Value: cname.vercel-dns.com
3. 等待 DNS 传播（最多 48 小时）`,
        netlify: `
1. 在 Netlify 中添加域名: netlify domains add ${domain}
2. 配置 DNS 记录:
   Type: CNAME
   Name: ${domain.split('.')[0]}
   Value: <your-site>.netlify.app
3. 等待验证`,
        cloudflare: `
1. 在 Cloudflare Pages 添加自定义域名
2. 配置会自动完成（Cloudflare DNS）`
    };

    console.log(instructions[CONFIG.platform] || instructions.vercel);
}

/**
 * 初始化变现
 */
async function setupMonetization(siteUrl, keyword) {
    console.log('\n💰 变现设置指南...\n');

    const monetization = {
        adsense: `
【Google AdSense 设置】
1. 访问: https://www.google.com/adsense
2. 添加新网站: ${siteUrl}
3. 复制广告代码到网站的 <head> 标签
4. 创建广告单元并添加到页面
5. 等待审核（通常 1-2 周）`,
        amazon: `
【Amazon Associates 设置】
1. 访问: https://affiliate-program.amazon.com
2. 注册账户
3. 创建产品链接 API
4. 将产品推荐添加到网站
5. 佣金: 4-10% 每笔销售`,
        email: `
【邮件营销设置】
1. 选择服务商: ConvertKit, Mailchimp, 或 Beehiiv
2. 创建订阅表单（已在模板中）
3. 设置自动化欢迎邮件
4. 添加产品推荐链接
5. 目标: 建立长期资产`,
        analytics: `
【分析工具设置】
1. Google Analytics: https://analytics.google.com
2. Google Search Console: https://search.google.com/search-console
3. 跟踪代码已添加到模板
4. 监控关键指标:
   - 页面浏览量
   - 跳出率
   - 会话时长
   - 转化率`
    };

    Object.entries(monetization).forEach(([key, value]) => {
        console.log(value);
        console.log('---\n');
    });
}

/**
 * 生成部署后报告
 */
async function generateReport(deployUrl, keyword) {
    const report = {
        deployment: {
            url: deployUrl,
            platform: CONFIG.platform,
            timestamp: new Date().toISOString(),
            keyword: keyword
        },
        nextSteps: [
            '✅ 提交 sitemap 到 Google Search Console',
            '✅ 申请 Google AdSense（需要内容稳定 1-2 周后）',
            '✅ 注册 Amazon Associates',
            '✅ 设置邮件营销（ConvertKit/Mailchimp）',
            '✅ 创建社交媒体账号推广',
            '✅ 建立反向链接（guest posting）',
            '✅ 定期更新内容（每周 2-3 篇）',
            '✅ 监控 Google Analytics 数据'
        ],
        revenue: {
            day1: '预计: $0-10（初期流量低）',
            week1: '预计: $10-50（SEO 开始见效）',
            month1: '预计: $100-500（稳定流量）',
            month3: '预计: $500-2000（建立权威）'
        },
        metrics: {
            targetViews: '1000+ visits/day',
            targetCTR: '3-5%',
            targetRPM: '$10-30',
            targetConversion: '2-5%'
        }
    };

    await fs.writeFile('deployment-report.json', JSON.stringify(report, null, 2));

    return report;
}

/**
 * 主部署流程
 */
async function main() {
    console.log('🚀 TrendRush 一键部署系统');
    console.log('=========================\n');
    console.log(`平台: ${CONFIG.platform}`);
    console.log(`关键词: ${CONFIG.keyword}`);
    console.log(`域名: ${CONFIG.domain || '使用默认域名'}`);
    console.log('');

    // 部署
    let deployUrl;
    switch (CONFIG.platform) {
        case 'vercel':
            deployUrl = await deployToVercel();
            break;
        case 'netlify':
            deployUrl = await deployToNetlify();
            break;
        case 'cloudflare':
            deployUrl = await deployToCloudflare();
            break;
        default:
            throw new Error(`不支持的平台: ${CONFIG.platform}`);
    }

    // 后续步骤
    await submitToSearchEngines(deployUrl, CONFIG.keyword);
    await setupDomain(CONFIG.domain, deployUrl);
    await setupMonetization(deployUrl, CONFIG.keyword);

    // 生成报告
    const report = await generateReport(deployUrl, CONFIG.keyword);

    console.log('\n✅ 部署完成!\n');
    console.log(`🌐 网站 URL: ${deployUrl}`);
    console.log(`📊 报告已保存: deployment-report.json\n`);

    console.log('📈 下一步行动:');
    report.nextSteps.forEach(step => console.log(`  ${step}`));

    console.log('\n💰 预期收益:');
    Object.entries(report.revenue).forEach(([period, amount]) => {
        console.log(`  ${period}: ${amount}`);
    });
}

// 运行
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 部署失败:', error.message);
        process.exit(1);
    });
}

module.exports = { deployToVercel, deployToNetlify, deployToCloudflare };
