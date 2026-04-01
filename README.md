# MiaoCode 🐱

一个智能的 AI 编程助手，基于 Claude Code 开发

![GitHub](https://img.shields.io/github/stars/miaoge2026/MiaoCode)
![GitHub](https://img.shields.io/github/forks/miaoge2026/MiaoCode)
![GitHub](https://img.shields.io/github/issues/miaoge2026/MiaoCode)

## 🚀 特性

- **智能代码补全** - 基于上下文的智能代码建议
- **多语言支持** - 支持 TypeScript、Python、Java、Go 等主流语言
- **工具集成** - 内置 Bash、文件编辑、网页抓取等工具
- **权限控制** - 安全的权限管理系统
- **插件系统** - 可扩展的插件架构
- **远程开发** - 支持 SSH、GitHub Codespaces 等远程环境
- **Git 集成** - 完整的版本控制功能

## 📦 安装

### 从源代码构建

```bash
git clone https://github.com/miaoge2026/MiaoCode.git
cd MiaoCode
npm install
npm run build
```

### 使用 npm

```bash
npm install -g @miao/miao-code
```

## 🔧 使用方法

### 交互式模式

```bash
miao
```

### 打印模式

```bash
miao --print "帮我优化这段代码"
```

### 指定模型

```bash
miao --model opus "分析这个项目的架构"
```

### 跳过权限检查（危险模式）

```bash
miao --dangerously-skip-permissions "rm -rf /tmp/*"
```

## 📚 文档

- [快速开始](docs/quickstart.md)
- [API 参考](docs/api.md)
- [配置指南](docs/config.md)
- [插件开发](docs/plugins.md)

## 🛠️ 开发

### 项目结构

```
miao-code/
├── src/              # 源代码
│   ├── core/         # 核心系统
│   ├── tools/        # 工具系统
│   ├── ui/           # UI 组件
│   ├── services/     # 服务层
│   └── commands/     # CLI 命令
├── packages/         # 包管理
├── docs/             # 文档
├── tests/            # 测试
└── examples/         # 示例
```

### 构建项目

```bash
npm run build        # 构建项目
npm run dev          # 开发模式
npm run test         # 运行测试
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与。

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 🌟 鸣谢

- [Claude Code](https://www.anthropic.com/claude-code) - 基于其开发
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP 协议支持
- [Ink](https://github.com/vadimdemedes/ink) - 终端 UI 框架

## 📞 联系方式

- **GitHub**: https://github.com/miaoge2026/MiaoCode
- **Issues**: https://github.com/miaoge2026/MiaoCode/issues
- **Discussions**: https://github.com/miaoge2026/MiaoCode/discussions

---

*由喵哥团队开发和维护* 🐱