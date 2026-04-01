# MiaoCode 文档

欢迎来到 MiaoCode 文档！本指南将帮助您快速上手并深入了解这个 AI 编程助手。

## 📖 文档导航

- [快速开始](quickstart.md) - 5分钟快速上手
- [安装指南](installation.md) - 详细的安装步骤
- [配置参考](config.md) - 所有配置选项
- [API 文档](api.md) - 完整的 API 参考
- [工具系统](tools.md) - 内置工具使用指南
- [插件开发](plugins.md) - 开发自定义插件
- [贡献指南](../CONTRIBUTING.md) - 如何贡献代码

## 🚀 快速开始

如果您是第一次使用 MiaoCode，建议从 [快速开始](quickstart.md) 开始。

```bash
# 安装
npm install -g @miao/miao-code

# 启动
miao
```

## 📚 核心概念

### AI 编程助手
MiaoCode 是一个基于 Claude Code 的 AI 编程助手，可以帮助您：
- 编写代码
- 调试程序
- 优化性能
- 学习新技术

### 工具系统
MiaoCode 提供了丰富的工具，包括：
- **BashTool**: 执行 shell 命令
- **FileEditTool**: 编辑文件
- **WebFetchTool**: 抓取网页内容
- **AgentTool**: 运行 AI 代理

### 权限系统
MiaoCode 有完善的权限控制，确保您的代码安全：
- 只读操作（默认安全）
- 写入操作（需要确认）
- 危险操作（严格限制）

## 🛠️ 开发

如果您想为 MiaoCode 贡献代码，请查看：
- [开发环境搭建](development.md)
- [代码结构](architecture.md)
- [测试指南](testing.md)

## 🤝 社区

- **GitHub Issues**: 报告问题和提出建议
- **Discussions**: 参与社区讨论
- **Pull Requests**: 提交代码贡献

## 📄 许可证

MiaoCode 使用 MIT 许可证，详情查看 [LICENSE](LICENSE) 文件。