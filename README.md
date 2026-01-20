# SubConvert Web

基于 Cloudflare Workers 的订阅转换工具，前后端一体化部署。

## 功能特性

- 🖥️ 现代化的 Web 界面
- ⚡ 基于 Cloudflare Workers 的无服务器后端
- 🔄 内置订阅转换（支持 vmess/vless 转 Clash）
- 💾 代理配置存储（Cloudflare KV 作为数据库）
- 📋 生成 Clash 配置文件
- � 响应式设计
- 🚀 一键部署到 Cloudflare Workers

## 部署指南

### 方法一：从 GitHub 仓库部署（推荐）

1. Fork 此仓库到你的 GitHub 账户

2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)

3. 进入 "Workers & Pages" -> "Create application" -> "Pages" -> "Connect to Git"

4. 选择你的 Fork 仓库

5. 配置部署设置：
   - **Root directory**: `/` (留空)

6. 创建 KV 数据库：
   - 进入 Workers -> KV
   - 创建新的 Namespace，命名为 `PROXY_STORE`
   - 记录生成的 Namespace ID

7. 配置环境变量：
   - 目前无需额外环境变量配置

8. 绑定 KV：
   - 在 Pages 设置 -> Functions -> KV namespace bindings 中添加：
     - Variable name: `PROXY_STORE`
     - KV namespace: 选择刚才创建的 `PROXY_STORE`

9. 部署：
   - 保存设置，Cloudflare 会自动部署

## 使用方法

1. 打开部署后的页面 URL
2. 添加订阅配置（别名和订阅 URL）
3. 点击单个"导出"获取该配置的订阅链接
4. 点击"批量导出所有链接"获取合并所有启用配置的订阅链接
5. 将链接添加到 Clash 客户端
6. 系统会自动将订阅转换为 Clash 配置格式

## API 接口

### 配置管理

#### GET /store
获取所有配置

#### POST /store
创建新配置

请求体：
```json
{
  "alias": "配置别名",
  "url": "订阅URL",
  "config": "配置URL（可选）"
}
```

#### PUT /store/:id
更新配置

#### DELETE /store/:id
删除配置

### 订阅转换

#### GET /subscribe?id={配置ID}
获取单个配置的转换后 Clash YAML 配置

#### GET /subscribe
获取所有启用配置合并的 Clash YAML 配置

## 开发

### 本地开发

1. 安装依赖：

```bash
npm install -g wrangler
```

2. 配置环境：

```bash
cd workers
wrangler auth login
wrangler kv:namespace create "PROXY_STORE"
# 更新 wrangler.toml 中的 namespace ID
```

3. 启动开发服务器：

```bash
wrangler dev
```

4. 访问 `http://localhost:8787`

### 项目结构

```
.
├── public/                 # 前端文件
│   ├── index.html         # 前端页面
│   └── src/
│       ├── main.js        # Vue 应用主逻辑
│       ├── store/
│       │   └── profiles.js # API 客户端
│       └── utils/
│           └── api.js     # API 工具
├── src/                   # Cloudflare Workers 代码
│   ├── index.js           # 主入口
│   ├── store.js           # 配置 CRUD
│   ├── subscribe.js       # 订阅转换
│   └── converter.js       # 转换逻辑
├── build.js               # 构建脚本
├── wrangler.toml          # Workers 配置
└── README.md              # 部署文档
```

## 注意事项

- 数据存储在 Cloudflare KV 中，具有持久性
- Workers 有免费额度限制，超出可能产生费用
- 内置转换器支持标准 vmess/vless 协议，无需外部服务

## 许可证

MIT License