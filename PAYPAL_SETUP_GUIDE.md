# PayPal 订阅支付设置指南

本指南将帮助你完成 PayPal 订阅支付的配置和部署。

## 📋 前置要求

- PayPal Business 账户（免费注册）
- 网站已部署到支持 HTTPS 的环境（Vercel 自动提供）

## 🚀 配置步骤

### 步骤 1: 创建 PayPal Business 账户

1. 访问 https://www.paypal.com
2. 点击"Sign Up"注册账户
3. 选择"Business Account"
4. 填写企业信息（可以是个体经营者）
5. 完成邮箱验证

### 步骤 2: 获取 Client ID

1. 访问 https://developer.paypal.com/dashboard/
2. 登录你的 PayPal 账户
3. 点击"Create App"或"My Apps & Credentials"
4. 填写应用信息：
   - App Name: `Agentic AI Tools`（或任意名称）
   - Select Platform: `Merchant`
5. 创建后，在应用详情页面找到 `Client ID`
6. 复制 Sandbox Client ID（用于测试）和 Live Client ID（用于生产环境）

### 步骤 3: 创建订阅计划

1. 在 PayPal Developer Dashboard，进入你的应用
2. 在左侧菜单找到"Subscriptions" → "Plans"
3. 点击"Create Plan"

#### 创建基础会员计划（$9/月）

- **Plan Name**: `Basic Member`
- **Plan Description**: `Access all content and resources`
- **Billing Cycle**:
  - Frequency: `Monthly`
  - Amount: `9.00 USD`
- **Payment Preferences**:
  - Setup fee: `0`
  - Auto-renew: `✓`
- **Setup and Taxes**: 保持默认

创建后，复制 Plan ID（格式类似：`P-XXXXXXXXXX`）

#### 创建专业会员计划（$29/月）

- **Plan Name**: `Professional Member`
- **Plan Description**: `Premium access with consultation and tutorials`
- **Billing Cycle**:
  - Frequency: `Monthly`
  - Amount: `29.00 USD`
- **Payment Preferences**:
  - Setup fee: `0`
  - Auto-renew: `✓`
- **Setup and Taxes**: 保持默认

创建后，复制 Plan ID

### 步骤 4: 更新代码配置

打开 `dist/scripts/paypal-integration.js` 文件，找到以下配置部分：

```javascript
// PayPal Client ID
const PAYPAL_CLIENT_ID = 'test'; // 替换为你的 Client ID

// Subscription Plan IDs
const SUBSCRIPTION_PLANS = {
    basic: 'P-BASIC_PLAN_ID',          // 替换为基础计划 ID
    professional: 'P-PROFESSIONAL_PLAN_ID' // 替换为专业计划 ID
};
```

替换为你的实际值：

```javascript
const PAYPAL_CLIENT_ID = 'AbCdEf123456789...'; // 你的 Live Client ID
// 或使用 sandbox Client ID 进行测试
// const PAYPAL_CLIENT_ID = 'sb-your-sandbox-client-id';

const SUBSCRIPTION_PLANS = {
    basic: 'P-9ABC123DEF456',           // 你的基础计划 ID
    professional: 'P-9XYZ789ABC123'     // 你的专业计划 ID
};
```

### 步骤 5: 更新 PayPal SDK URL

打开 `dist/pricing.html` 文件，找到这行：

```html
<script src="https://www.paypal.com/sdk/js?client-id=test&vault=true&intent=subscription"></script>
```

将 `client-id=test` 替换为你的 Client ID：

```html
<script src="https://www.paypal.com/sdk/js?client-id=AbCdEf123456789&vault=true&intent=subscription"></script>
```

### 步骤 6: 测试支付（Sandbox 环境）

1. 确保 `PAYPAL_CLIENT_ID` 使用 Sandbox Client ID（以 `sb-` 开头）
2. 部署到 Vercel 或使用本地服务器测试
3. 访问 `/pricing.html` 页面
4. 点击 PayPal 按钮
5. 使用 PayPal Sandbox 测试账号：
   - 在 PayPal Developer Dashboard 进入 "Accounts" 标签
   - 查看预设的测试账号
   - 使用测试买家账号完成支付

### 步骤 7: 部署到生产环境

1. 更新代码为 Live Client ID 和 Live Plan IDs
2. 部署到 Vercel：
   ```bash
   vercel --prod
   ```
3. 进行小额真实支付测试
4. 在 PayPal Dashboard 验证订阅是否创建成功

## 📊 管理订阅

### 查看订阅

1. 登录 PayPal Business Dashboard
2. 进入 "Activity" → "Subscriptions"
3. 查看所有活跃订阅

### 处理退款

1. 在 PayPal Dashboard 找到对应订阅
2. 选择 "Refund"
3. 选择退款金额（全额或部分）

### 导出数据

1. PayPal Dashboard 提供订阅报表
2. 可以导出为 CSV 或 Excel 格式

## 🔐 安全注意事项

1. **Client ID**: 可以公开显示，这不是敏感信息
2. **Client Secret**: 不要在前端代码中使用（本实现不需要）
3. **Webhook验证**: 建议后续添加后端 webhook 验证
4. **HTTPS**: PayPal 要求使用 HTTPS（Vercel 自动提供）

## 🎯 费用说明

PayPal 标准费用：
- **美国境内**: 2.9% + $0.30 每笔交易
- **国际交易**: 3.9% + 固定费用（根据货币）
- **订阅续费**: 同样的费用适用于每次自动扣款

## 📝 后续增强建议

### 1. 添加后端 API（可选）

使用 Vercel Serverless Functions 添加 webhook 接收器：

```javascript
// api/paypal-webhook.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 验证 PayPal webhook
    // 处理订阅事件
    // 存储到数据库
  }
}
```

### 2. 添加会员仪表板

- 用户登录系统
- 查看订阅状态
- 管理订阅（取消/升级）
- 访问会员专属内容

### 3. 内容保护

- 使用后端验证订阅状态
- 保护付费内容页面
- 提供下载访问权限

## 🐛 常见问题

### PayPal 按钮不显示

**原因**: SDK 加载失败或配置错误

**解决**:
1. 检查 Client ID 是否正确
2. 打开浏览器控制台查看错误
3. 确保 HTTPS 已启用

### 订阅创建失败

**原因**: Plan ID 错误或账户权限问题

**解决**:
1. 验证 Plan ID 是否匹配
2. 确保订阅计划已发布（不是草稿状态）
3. 检查 PayPal Business 账户状态

### 用户如何取消订阅？

用户需要：
1. 登录自己的 PayPal 账户
2. 进入 "Payments" → "Manage automatic payments"
3. 选择对应商家的订阅
4. 点击 "Cancel"

## 📞 获取帮助

- PayPal Developer 文档: https://developer.paypal.com/docs/subscriptions/
- PayPal 客服: 登录 PayPal 后访问 Help Center
- 社区论坛: https://www.paypal-community.com/

## ✅ 部署检查清单

部署前确认：

- [ ] 已创建 PayPal Business 账户
- [ ] 已获取 Client ID
- [ ] 已创建两个订阅计划
- [ ] 已更新 `paypal-integration.js` 中的配置
- [ ] 已更新 `pricing.html` 中的 SDK URL
- [ ] 已在 Sandbox 环境测试通过
- [ ] 已更新为 Live Client ID 和 Plan IDs
- [ ] 已进行真实小额测试
- [ ] 已验证订阅在 PayPal Dashboard 显示

部署后确认：

- [ ] 定价页面正常显示
- [ ] PayPal 按钮正常加载
- [ ] 订阅流程顺畅
- [ ] 支付成功页面正常跳转
- [ ] Google Analytics 追踪正常

## 🎉 完成！

现在你的网站已经成功集成了 PayPal 订阅支付功能！
