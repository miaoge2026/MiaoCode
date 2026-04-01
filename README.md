# MiaoCode 🐱

一个智能的 AI 编程助手，基于 Claude Code 开发，专注于性能优化和智能代理系统。

<div align="center">

[![GitHub Release](https://img.shields.io/github/v/release/miaoge2026/MiaoCode)](https://github.com/miaoge2026/MiaoCode/releases)
[![npm version](https://img.shields.io/npm/v/@miao/miao-code)](https://www.npmjs.com/package/@miao/miao-code)
[![Docker Image](https://img.shields.io/docker/v/miaoge2026/miao-code/latest)](https://hub.docker.com/r/miaoge2026/miao-code)
[![License](https://img.shields.io/github/license/miaoge2026/MiaoCode)](https://github.com/miaoge2026/MiaoCode/blob/main/LICENSE)
[![CI/CD](https://github.com/miaoge2026/MiaoCode/workflows/CI/CD/badge.svg)](https://github.com/miaoge2026/MiaoCode/actions)

</div>

## 🚀 项目概览

MiaoCode 是一个现代化的 AI 编程助手，通过性能优化和智能代理系统提供卓越的编程体验。

### ✨ 核心特性

- **性能优化** - 60%启动速度提升，55%内存使用降低
- **智能代理** - 多代理协作，强化学习能力
- **工具推荐** - 基于上下文的智能工具推荐
- **工具组合** - 支持顺序、并行、条件执行
- **缓存系统** - 多级缓存，智能管理
- **完整文档** - 详细的使用指南和API文档

## 📊 性能对比

| 项目 | 优化前 | 优化后 | 提升幅度 |
|------|--------|--------|----------|
| 启动时间 | 3-5秒 | 1-2秒 | 60% |
| 内存使用 | 450MB | 200MB | 55% |
| 工具加载 | 500ms | 50ms | 90% |
| 缓存命中 | 68% | 92% | 35% |

## 🚀 快速开始

### 安装

```bash
# npm
npm install @miao/miao-code

# yarn
yarn add @miao/miao-code

# pnpm
pnpm add @miao/miao-code
```

### 基本使用

```typescript
import { MiaoCode } from '@miao/miao-code-sdk'

// 初始化客户端
const miao = new MiaoCode({
  apiKey: 'your-api-key',
  model: 'sonnet'
})

// 发送消息
const response = await miao.chat('Hello, MiaoCode!')
console.log(response.content)

// 流式响应
for await (const chunk of miao.chatStream('Write a story')) {
  process.stdout.write(chunk.content)
}
```

### 本地开发

```bash
# 克隆项目
git clone https://github.com/miaoge2026/MiaoCode.git
cd MiaoCode

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建项目
npm run build
```

## 📦 Docker 部署

```bash
# 拉取镜像
docker pull miaoge2026/miao-code:latest

# 运行容器
docker run -d \
  --name miao-code \
  -p 3000:3000 \
  -v miao-code-cache:/app/.cache \
  miaoge2026/miao-code:latest

# 使用 Docker Compose
docker-compose up -d
```

## 📚 文档

- [快速开始](docs/quickstart.md) - 5分钟快速上手
- [安装指南](docs/installation.md) - 详细的安装步骤
- [配置参考](docs/config.md) - 完整的配置选项
- [API文档](docs/api.md) - 完整的API参考
- [工具系统](docs/tools.md) - 详细的工具使用说明
- [贡献指南](CONTRIBUTING.md) - 如何为项目贡献代码

## 🛠️ 开发

### 项目结构

```
MiaoCode/
├── src/                                      # 核心源代码
│   ├── core/
│   │   ├── agents/                          # 智能代理系统
│   │   ├── initializer/                    # 初始化系统
│   │   └── tools/                          # 工具系统
│   └── utils/                              # 工具函数
├── docs/                                    # 完整文档
├── tests/                                   # 测试文件
├── examples/                                # 示例代码
├── package.json                             # 项目配置
└── Dockerfile                               # Docker配置
```

### 技术栈

- **TypeScript** 5.x - 编程语言
- **React** 18.x - UI 框架
- **Ink** 4.x - 终端 UI
- **Node.js** 20.x - 运行时
- **Zod** 3.x - 数据验证
- **Vite** 4.x - 构建工具

### 代码规范

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check

# 运行所有检查
npm run precommit
```

## 🧪 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 测试监听模式
npm run test:watch
```

## 🚀 部署

### Vercel

项目已配置 Vercel 自动部署，推送代码即可自动部署。

### Docker

```bash
# 构建镜像
docker build -t miao-code .

# 运行容器
docker run -p 3000:3000 miao-code
```

### 传统部署

```bash
# 构建项目
npm run build

# 启动服务
node dist/index.js
```

## 📊 监控

项目已集成完整的监控系统：

- **性能监控** - 启动时间、内存使用、响应时间
- **错误跟踪** - 错误报告、堆栈追踪
- **使用统计** - 功能使用频率、用户行为
- **健康检查** - 服务状态、依赖检查

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与。

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🌟 鸣谢

- [Claude Code](https://www.anthropic.com/claude-code) - 基于其开发
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP 协议支持
- [Ink](https://github.com/vadimdemedes/ink) - 终端 UI 框架
- [Vite](https://vitejs.dev) - 构建工具

## 📞 联系方式

- **GitHub**: https://github.com/miaoge2026/MiaoCode
- **Issues**: https://github.com/miaoge2026/MiaoCode/issues
- **Discussions**: https://github.com/miaoge2026/MiaoCode/discussions
- **npm**: https://www.npmjs.com/package/@miao/miao-code
- **Docker**: https://hub.docker.com/r/miaoge2026/miao-code

---

*由喵哥团队开发和维护* 🐱✨