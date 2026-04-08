# TrendRush - 热词快速变现 Skill

> **⚡ 1小时内从热词到赚钱网站的完整自动化系统**

## 🎯 核心能力

- **5分钟**: 发现高价值热词
- **15分钟**: AI生成完整网站内容
- **30分钟**: 网站部署上线
- **1小时**: 开始赚钱

## 📋 SOP（标准操作流程）

### Phase 1: 热词发现 (5分钟)

```bash
# 1. 监控 Google Trends 实时热词
gt trends --realtime --region=US --category=all

# 2. 筛选高价值关键词
gt filter --cpc>=5 --volume>=10000 --competition<=0.3

# 3. 选择目标关键词
gt select --top=1
```

### Phase 2: 快速内容生成 (15分钟)

```bash
# 1. 生成SEO优化内容
gt generate --keyword="<热词>" --type="article" --words=2000

# 2. 生成相关页面
gt generate --type="about"
gt generate --type="contact"
gt generate --type="privacy"

# 3. 生成产品推荐内容（如果适用）
gt monetize --keyword="<热词>" --products
```

### Phase 3: 网站构建 (10分钟)

```bash
# 1. 初始化网站模板
gt init --template="monetized-blog" --name="<keyword>-site"

# 2. 插入生成的内容
gt insert --content="articles/"
gt insert --ads="amazon-associates"

# 3. 配置SEO元数据
gt seo --optimize
```

### Phase 4: 部署上线 (10分钟)

```bash
# 1. 连接部署平台
gt deploy --platform="vercel"

# 2. 自动配置域名
gt domain --auto --provider="namecheap"

# 3. 配置CDN和SSL
gt optimize --cdn --ssl

# 4. 提交搜索引擎
gt submit --sitemap --google --bing
```

### Phase 5: 变现激活 (20分钟)

```bash
# 1. 集成广告网络
gt ads --setup --networks="google-adSense,amazon-associates"

# 2. 配置联盟营销
gt affiliate --products --keyword="<keyword>"

# 3. 设置邮件收集
gt email --setup --provider="convertkit"

# 4. 启动付费内容（可选）
gt premium --enable --price="$9.99"
```

## 🎨 网站模板

### 1. Monetized Blog（博客型）
- Google AdSense 集成
- Amazon Associates 产品推荐
- 邮件订阅表单
- SEO 优化结构

### 2. Product Review（评测型）
- 产品对比表
- 评分系统
- 购买按钮（联盟链接）
- 用户评论区

### 3. News/Curation（新闻聚合型）
- 热点追踪
- 实时更新
- 广告位优化
- 社交分享

### 4. Tool/Calculator（工具型）
- 在线工具（计算器、转换器等）
- 高 CPC 广告位
- API 集成
- 数据可视化

## 💰 变现策略

### 快速变现（第1天）
1. **Google AdSense** - 每千次浏览 $5-50
2. **Amazon Associates** - 4-10% 佣金
3. **Raptive.com** - 高 RPM 广告网络

### 中期变现（第1周）
1. **联盟营销** - ShareASale, CJ Affiliate
2. **赞助文章** - $50-500/篇
3. **邮件列表** - 后端销售

### 长期变现（第1月）
1. **数字产品** - 电子书、课程
2. **会员制** - 月费访问
3. **白标工具** - SaaS 分成

## 🚀 快速开始

### 前置要求
```bash
# 1. 安装依赖
npm install -g vercel-cli
npm install -g @google-cloud/functions-framework

# 2. 配置 API 密钥
export GOOGLE_TRENDS_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export VERCEL_TOKEN="your-token"

# 3. 准备托管账户
- Vercel 账户（免费）
- Domain 账户（Namecheap, GoDaddy等）
- AdSense 账户
- Amazon Associates 账户
```

### 一键执行
```bash
# 使用 Claude Code 运行 skill
claude skill trend-rush --keyword="<发现的热词>"

# 或交互式模式
claude skill trend-rush --interactive
```

## 📊 关键指标追踪

```bash
# 1. 流量监控
gt analytics --traffic

# 2. 收入追踪
gt analytics --revenue

# 3. SEO 排名
gt analytics --ranking --keyword="<keyword>"

# 4. 转化率
gt analytics --conversion
```

## 🎯 成功案例模板

### 案例 1: "AI Writing Tool" 热词
- 发现时间: 09:00 AM
- 内容生成: 09:30 AM
- 网站上线: 10:15 AM
- 首个访客: 10:45 AM
- 首笔收入: 02:30 PM ($12.50)
- 第1天总收入: $87

### 案例 2: "Best VPN 2024" 热词
- 内容: 10 篇评测文章
- 部署: Vercel + 自定义域名
- 变现: VPN 联盟营销（$30-80/销售）
- 第1周收入: $1,240
- 第1月收入: $8,600

## ⚠️ 重要注意事项

1. **内容质量**: AI生成后人工审核和优化
2. **合规性**: 遵守 Google AdSense 政策
3. **速度优化**: Core Web Vitals 影响排名
4. **移动优先**: 70%+ 流量来自移动端
5. **持续更新**: 热点内容需要定期更新

## 📚 学习资源

- Google Trends API 文档
- SEO 最佳实践指南
- 变现策略优化
- 部署平台配置

---

**创建日期**: 2026-01-13
**版本**: 1.0.0
**作者**: Claude + 用户协作
