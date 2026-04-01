# 安装指南 📦

本指南将详细介绍如何在不同平台上安装 MiaoCode。

## 🛠️ 系统要求

### 最低配置

- **Node.js**: 18.0.0 或更高版本
- **npm**: 7.0.0 或更高版本
- **内存**: 2GB RAM
- **存储**: 1GB 可用空间

### 推荐配置

- **Node.js**: 20.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **内存**: 4GB RAM
- **存储**: 5GB 可用空间
- **网络**: 稳定的互联网连接

## 📥 安装方法

### 方法 1: npm 全局安装（推荐）

```bash
# 使用 npm
npm install -g @miao/miao-code

# 使用 yarn
yarn global add @miao/miao-code

# 使用 pnpm
pnpm add -g @miao/miao-code
```

验证安装：
```bash
miao --version
# 输出: miao-code/1.0.0
```

### 方法 2: 从源代码构建

```bash
# 克隆仓库
git clone https://github.com/miaoge2026/MiaoCode.git
cd MiaoCode

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到全局
npm link
```

### 方法 3: 使用 Docker

```bash
# 拉取镜像
docker pull miaoge2026/miao-code:latest

# 运行容器
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  miaoge2026/miao-code:latest
```

### 方法 4: 使用 GitHub Codespaces

1. 访问 https://github.com/miaoge2026/MiaoCode
2. 点击 "Code" 按钮
3. 选择 "Open with Codespaces"
4. 点击 "New codespace"

## 🖥️ 平台特定说明

### macOS

#### 使用 Homebrew

```bash
# 添加 tap
brew tap miaoge2026/tap

# 安装
brew install miao-code
```

#### 权限问题

如果遇到权限问题，请运行：
```bash
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Linux

#### 使用 Snap

```bash
sudo snap install miao-code
```

#### 使用 APT（Debian/Ubuntu）

```bash
# 下载 deb 包
wget https://github.com/miaoge2026/MiaoCode/releases/download/v1.0.0/miao-code_1.0.0_amd64.deb

# 安装
sudo dpkg -i miao-code_1.0.0_amd64.deb
```

### Windows

#### 使用 Scoop

```powershell
# 添加 bucket
scoop bucket add miaoge2026 https://github.com/miaoge2026/scoop-bucket.git

# 安装
scoop install miao-code
```

#### 使用 Chocolatey

```powershell
choco install miao-code
```

#### Windows Subsystem for Linux (WSL)

```bash
# 在 WSL 中安装
npm install -g @miao/miao-code
```

## 🔧 环境配置

### Node.js 版本管理

使用 nvm 管理 Node.js 版本：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 20
nvm install 20

# 使用 Node.js 20
nvm use 20
```

### 代理配置

如果需要通过代理访问：

```bash
# 设置 npm 代理
npm config set proxy http://localhost:8080
npm config set https-proxy http://localhost:8080

# 或者使用环境变量
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

## 📊 安装验证

### 基本验证

```bash
# 检查版本
miao --version

# 检查帮助
miao --help

# 运行简单命令
miao --print "Hello, MiaoCode!"
```

### 完整验证

```bash
# 创建一个测试项目
mkdir miao-test && cd miao-test

# 初始化 Git 仓库
git init

# 创建测试文件
echo "console.log('Hello, World!')" > test.js

# 使用 MiaoCode 分析
miao --print "分析这个文件"
```

## 🔄 更新

### npm 安装

```bash
npm update -g @miao/miao-code
```

### 源代码安装

```bash
cd /path/to/MiaoCode
git pull origin main
npm install
npm run build
```

## 🗑️ 卸载

### npm 卸载

```bash
npm uninstall -g @miao/miao-code
```

### 源代码卸载

```bash
# 如果使用了 npm link
npm unlink -g @miao/miao-code

# 删除源代码目录
rm -rf /path/to/MiaoCode
```

## 🐛 常见问题

### 问题 1: Node.js 版本不兼容

**错误信息**: `ERROR: Node.js version is too old. Requires 18.0.0 or higher.`

**解决方案**:
```bash
# 更新 Node.js
nvm install 20
nvm use 20
```

### 问题 2: 权限被拒绝

**错误信息**: `EACCES: permission denied`

**解决方案**:
```bash
# 修复 npm 权限
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### 问题 3: 网络连接问题

**错误信息**: `ERR_CONNECTION_REFUSED`

**解决方案**:
```bash
# 检查网络
ping google.com

# 如果使用代理
export HTTP_PROXY=http://localhost:8080
export HTTPS_PROXY=http://localhost:8080
```

### 问题 4: 内存不足

**错误信息**: `FATAL ERROR: Ineffective mark-compacts near heap limit`

**解决方案**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📞 获取帮助

如果遇到安装问题，请：

1. 查看 [GitHub Issues](https://github.com/miaoge2026/MiaoCode/issues)
2. 阅读 [故障排除](troubleshooting.md)
3. 加入 [社区讨论](https://github.com/miaoge2026/MiaoCode/discussions)

## 🎯 下一步

安装完成后，建议您：

1. 阅读 [快速开始](quickstart.md)
2. 查看 [配置参考](config.md)
3. 尝试 [示例项目](https://github.com/miaoge2026/miao-code-examples)

祝您安装顺利！🐱✨