# Claude Code Skills 集成说明

本项目已集成两大官方/社区 Skills 仓库，提供丰富的 AI 辅助开发能力。

## 📦 已集成的 Skills 仓库

### 1. 官方 Skills (Anthropic)
**仓库地址**: https://github.com/anthropics/skills
**本地位置**: `official-skills/`
**集成位置**: `skills/`

包含以下官方 skills：
- `algorithmic-art` - 算法艺术生成
- `brand-guidelines` - 品牌指南应用
- `canvas-design` - Canvas 设计
- `doc-coauthoring` - 文档协作创作
- `docx` - Word 文档处理
- `frontend-design` - 前端设计（本次使用的量子终端设计）
- `internal-comms` - 内部沟通
- `mcp-builder` - MCP 服务器构建
- `pdf` - PDF 处理
- `pptx` - PowerPoint 演示文稿
- `skill-creator` - Skill 创建工具
- `slack-gif-creator` - Slack GIF 创建
- `theme-factory` - 主题工厂
- `webapp-testing` - Web 应用测试
- `web-artifacts-builder` - Web 构建工具
- `xlsx` - Excel 表格处理

### 2. 社区 Skills (levnikolaevich)
**仓库地址**: https://github.com/levnikolaevich/claude-code-skills
**本地位置**: `community-skills/`
**包含**: 84+ 生产级 skills

完整的软件开发生命周期覆盖：

#### 📚 研究阶段 (ln-001 ~ ln-002)
- `ln-001-standards-researcher` - 标准研究员
- `ln-002-best-practices-researcher` - 最佳实践研究员

#### 📝 文档阶段 (ln-100 ~ ln-150)
- `ln-100-documents-pipeline` - 文档管道
- `ln-110-project-docs-coordinator` - 项目文档协调器
- `ln-111-root-docs-creator` - 根文档创建器
- `ln-112-project-core-creator` - 项目核心创建器
- `ln-113-backend-docs-creator` - 后端文档创建器
- `ln-114-frontend-docs-creator` - 前端文档创建器
- `ln-115-devops-docs-creator` - DevOps 文档创建器
- `ln-120-reference-docs-creator` - 参考文档创建器
- `ln-130-tasks-docs-creator` - 任务文档创建器
- `ln-140-test-docs-creator` - 测试文档创建器
- `ln-150-presentation-creator` - 演示文稿创建器

#### 🎯 规划阶段 (ln-200 ~ ln-230)
- `ln-200-scope-decomposer` - 范围分解器
- `ln-210-epic-coordinator` - Epic 协调器
- `ln-220-story-coordinator` - Story 协调器
- `ln-221-story-creator` - Story 创建器
- `ln-222-story-replanner` - Story 重新规划器
- `ln-230-story-prioritizer` - Story 优先级排序器

#### ⚙️ 任务阶段 (ln-300 ~ ln-404)
- `ln-300-task-coordinator` - 任务协调器
- `ln-301-task-creator` - 任务创建器
- `ln-302-task-replanner` - 任务重新规划器
- `ln-310-story-validator` - Story 验证器
- `ln-400-story-executor` - Story 执行器
- `ln-401-task-executor` - 任务执行器
- `ln-402-task-reviewer` - 任务审查器
- `ln-403-task-rework` - 任务返工
- `ln-404-test-executor` - 测试执行器

#### ✅ 质量保证 (ln-500 ~ ln-535)
- `ln-500-story-quality-gate` - Story 质量关卡
- `ln-501-code-quality-checker` - 代码质量检查器
- `ln-502-regression-checker` - 回归检查器
- `ln-510-test-planner` - 测试规划器
- `ln-511-test-researcher` - 测试研究员
- `ln-512-manual-tester` - 手动测试器
- `ln-513-auto-test-planner` - 自动测试规划器
- `ln-530-test-auditor` - 测试审计器
- `ln-531-test-business-logic-auditor` - 测试业务逻辑审计器
- `ln-532-test-e2e-priority-auditor` - 测试 E2E 优先级审计器
- `ln-533-test-value-auditor` - 测试价值审计器
- `ln-534-test-coverage-auditor` - 测试覆盖率审计器
- `ln-535-test-isolation-auditor` - 测试隔离性审计器

#### 🔍 审计阶段 (ln-600 ~ ln-629)
- `ln-600-docs-auditor` - 文档审计器
- `ln-610-code-comments-auditor` - 代码注释审计器
- `ln-620-codebase-auditor` - 代码库审计器
- `ln-621-security-auditor` - 安全审计器
- `ln-622-build-auditor` - 构建审计器
- `ln-623-architecture-auditor` - 架构审计器
- `ln-624-code-quality-auditor` - 代码质量审计器
- `ln-625-dependencies-auditor` - 依赖审计器
- `ln-626-dead-code-auditor` - 死代码审计器
- `ln-627-observability-auditor` - 可观测性审计器
- `ln-628-concurrency-auditor` - 并发性审计器
- `ln-629-lifecycle-auditor` - 生命周期审计器

#### 🚀 基础设施 (ln-700 ~ ln-783)
- `ln-700-project-bootstrap` - 项目引导
- `ln-710-dependency-upgrader` - 依赖升级器
- `ln-711-npm-upgrader` - NPM 升级器
- `ln-712-nuget-upgrader` - NuGet 升级器
- `ln-713-pip-upgrader` - Pip 升级器
- `ln-720-structure-migrator` - 结构迁移器
- `ln-721-frontend-restructure` - 前端重构
- `ln-722-backend-generator` - 后端生成器
- `ln-723-mockdata-migrator` - 模拟数据迁移器
- `ln-724-replit-cleaner` - Replit 清理器
- `ln-730-devops-setup` - DevOps 设置
- `ln-731-docker-generator` - Docker 生成器
- `ln-732-cicd-generator` - CI/CD 生成器
- `ln-733-env-configurator` - 环境配置器
- `ln-740-quality-setup` - 质量设置
- `ln-741-linter-configurator` - Linter 配置器
- `ln-742-precommit-setup` - 预提交设置
- `ln-743-test-infrastructure` - 测试基础设施
- `ln-750-commands-generator` - 命令生成器
- `ln-751-command-templates` - 命令模板
- `ln-760-security-setup` - 安全设置
- `ln-761-secret-scanner` - 密钥扫描器
- `ln-762-dependency-audit` - 依赖审计
- `ln-770-crosscutting-setup` - 横切关注点设置
- `ln-771-logging-configurator` - 日志配置器
- `ln-772-error-handler-setup` - 错误处理设置
- `ln-773-cors-configurator` - CORS 配置器
- `ln-774-healthcheck-setup` - 健康检查设置
- `ln-775-api-docs-generator` - API 文档生成器
- `ln-780-bootstrap-verifier` - 引导验证器
- `ln-781-build-verifier` - 构建验证器
- `ln-782-test-runner` - 测试运行器
- `ln-783-container-launcher` - 容器启动器

## 📚 官方和社区资源

### 官方仓库
- [Anthropic Skills](https://github.com/anthropics/skills) - 官方 Skills 仓库
- [Claude Code](https://github.com/anthropics/claude-code) - Claude Code 工具仓库
- [Claude Code 文档](https://code.claude.com/docs/en/skills) - Skills 官方文档

### 社区集合
- [awesome-claude-skills (VoltAgent)](https://github.com/VoltAgent/awesome-claude-skills)
- [awesome-claude-skills (travisvn)](https://github.com/travisvn/awesome-claude-skills)
- [claude-code-skills (levnikolaevich)](https://github.com/levnikolaevich/claude-code-skills) - 本项目集成
- [awesome-claude-skills (karanb192)](https://github.com/karanb192/awesome-claude-skills)
- [awesome-claude-skills (ComposioHQ)](https://github.com/ComposioHQ/awesome-claude-skills)

### 学习资源
- [Claude Code 最佳实践](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Skills Marketplace](https://skillsmp.com/) - 71,000+ Agent Skills

## 🎯 如何使用

这些 skills 会自动在合适的时机被 Claude Code 调用，无需手动触发。你只需要：

1. **明确你的需求** - 告诉 Claude 你想要做什么
2. **Claude 自动选择** - 系统会判断哪个 skill 最适合当前任务
3. **执行任务** - Skill 会提供专业的指导和执行

### 示例
- "优化这个网站的前端设计" → 自动使用 `frontend-design`
- "帮我审查代码质量" → 自动使用 `ln-624-code-quality-auditor`
- "创建项目文档" → 自动使用 `ln-110-project-docs-coordinator`
- "设置 CI/CD" → 自动使用 `ln-732-cicd-generator`

## 🔄 更新 Skills

定期更新仓库以获取最新的 skills：

```bash
# 更新官方 skills
cd E:/agentic-ai-tools-2026/official-skills
git pull

# 更新社区 skills
cd E:/agentic-ai-tools-2026/community-skills
git pull

# 复制新 skills 到项目目录
cd E:/agentic-ai-tools-2026
cp -r official-skills/skills/* skills/
```

## 📝 项目现有 Skills

项目中已有的自定义 skills：
- `react-best-practices` - React/Next.js 性能优化
- `vercel-deploy-claimable` - Vercel 部署
- `web-design-guidelines` - Web 设计规范审查

---

**最后更新**: 2026-01-20
**总 Skills 数量**: 官方 15+ 社区 84+ = 99+ Skills
