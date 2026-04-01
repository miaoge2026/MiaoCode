# 快速开始 🚀

本指南将帮助您在 5 分钟内开始使用 MiaoCode！

## 📦 安装

### 前提条件

- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- Git（用于开发）

### 安装步骤

#### 1. 使用 npm 安装

```bash
npm install -g @miao/miao-code
```

#### 2. 验证安装

```bash
miao --version
# 输出: miao-code/1.0.0
```

## 🎯 第一个命令

### 1. 启动交互式模式

```bash
miao
```

您将看到：
```
🐱 MiaoCode AI 编程助手
输入您的需求，按 Enter 开始...
>
```

### 2. 尝试简单命令

```bash
# 分析当前目录
> 分析一下这个项目的结构

# 生成代码
> 帮我写一个快速排序函数

# 文件操作
> 读取 README.md 文件内容
```

### 3. 退出交互式模式

按 `Ctrl+C` 或输入 `exit` 退出。

## 🔧 常用选项

### 打印模式（适合脚本）

```bash
miao --print "分析这个项目的架构"
```

### 指定模型

```bash
miao --model sonnet "写一个 React 组件"
miao --model opus "优化这段代码性能"
```

### 权限模式

```bash
# 默认模式（安全）
miao --permission-mode default

# 跳过权限（危险，仅用于可信环境）
miao --dangerously-skip-permissions "rm -rf /tmp/*"
```

### 指定工作目录

```bash
miao --add-dir /path/to/project
```

## 🛠️ 内置工具

MiaoCode 提供了丰富的工具，您可以直接使用：

### 文件操作

```bash
# 读取文件
miao --print "读取 src/index.ts"

# 编辑文件
miao --print "在 src/main.ts 中添加一个函数"
```

### 代码分析

```bash
# 分析代码结构
miao --print "分析这个项目的依赖关系"

# 查找问题
miao --print "查找可能的 bug"
```

### 版本控制

```bash
# Git 操作
miao --print "查看当前 git 状态"
miao --print "提交代码并推送到远程仓库"
```

## 📚 学习资源

### 帮助命令

```bash
# 查看帮助
miao --help

# 查看可用工具
miao --help-tools
```

### 示例项目

查看我们的示例项目：

```bash
git clone https://github.com/miaoge2026/miao-code-examples.git
cd miao-code-examples
miao
```

## 🎨 配置

### 创建配置文件

```bash
# 创建项目配置文件
miao config init
```

### 常用配置

```json
{
  "model": "sonnet",
  "permissionMode": "default",
  "maxBudgetUsd": 10,
  "tools": {
    "bash": true,
    "edit": true,
    "web": false
  }
}
```

## 🔌 插件系统

### 安装插件

```bash
miao plugin install @miao/miao-plugin-python
```

### 查看已安装插件

```bash
miao plugin list
```

## 🌍 远程开发

### SSH 连接

```bash
miao --ssh user@host
```

### GitHub Codespaces

```bash
miao --codespace my-codespace
```

## 🎯 下一步

现在您已经掌握了 MiaoCode 的基本使用！接下来可以：

1. **深入学习** - 查看 [配置参考](config.md)
2. **开发插件** - 查看 [插件开发](plugins.md)
3. **贡献代码** - 查看 [贡献指南](CONTRIBUTING.md)

祝您编程愉快！🐱✨