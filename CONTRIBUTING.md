# 贡献指南 🤝

感谢您对 MiaoCode 的关注！我们非常欢迎社区贡献者来帮助我们改进这个项目。本指南将帮助您了解如何为 MiaoCode 贡献代码。

## 🎯 贡献方式

### 1. 代码贡献

- 🐛 **修复 Bug** - 发现并修复问题
- 🚀 **添加功能** - 实现新特性
- 📝 **改进文档** - 完善文档和注释
- 🧪 **添加测试** - 编写测试用例
- 🎨 **优化 UI** - 改进用户界面

### 2. 非代码贡献

- 💡 **提出建议** - 在 Issues 中提出新功能
- 🐛 **报告 Bug** - 报告发现的问题
- 📊 **使用反馈** - 分享使用体验
- 🌍 **翻译文档** - 帮助翻译文档
- 📢 **社区推广** - 在社区中推广 MiaoCode

## 🚀 开始贡献

### 1. 准备工作

#### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 7.0.0 或更高版本
- **Git**: 2.25.0 或更高版本
- **操作系统**: macOS, Linux, 或 Windows

#### 开发工具

推荐的开发工具：
- **VS Code** (推荐) - 安装 ESLint 和 Prettier 插件
- **WebStorm** - 完整的 TypeScript 支持
- **Vim/Neovim** - 安装 coc.nvim 或 LSP 插件

### 2. 本地开发环境

#### 克隆仓库

```bash
# 克隆主仓库
git clone https://github.com/miaoge2026/MiaoCode.git
cd MiaoCode

# 设置上游仓库
git remote add upstream https://github.com/miaoge2026/MiaoCode.git

# 创建开发分支
git checkout -b feature/my-feature
```

#### 安装依赖

```bash
# 安装所有依赖
npm install

# 安装开发依赖
npm install -g @types/node typescript eslint prettier

# 安装 Git 钩子
npx husky install
```

#### 配置开发环境

```bash
# 创建开发配置文件
cp .env.example .env.development

# 编辑配置文件
nano .env.development
```

### 3. 开发流程

#### 1. 创建分支

```bash
# 从 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

**分支命名规范**:
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `test/` - 测试相关
- `refactor/` - 重构代码
- `style/` - 代码格式化

#### 2. 开发与测试

```bash
# 启动开发模式
npm run dev

# 运行测试
npm test

# 运行 lint
npm run lint

# 运行类型检查
npm run type-check
```

#### 3. 提交代码

```bash
# 添加修改
git add .

# 提交（使用约定式提交）
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue #123"
git commit -m "docs: update README"

# 推送到您的仓库
git push origin feature/your-feature-name
```

**提交消息规范**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 4. 创建 Pull Request

1. 访问 https://github.com/miaoge2026/MiaoCode
2. 点击 "Compare & pull request"
3. 填写 PR 描述
4. 等待 CI 检查通过
5. 等待代码审查

## 📝 提交规范

### 1. Pull Request 模板

```markdown
## 描述

请提供详细的描述，说明您所做的更改。

## 相关问题

请链接相关的 Issues 或 Pull Requests。

- Fixes #123
- Closes #456

## 更改类型

- [ ] Bug 修复 (non-breaking change)
- [ ] 新功能 (non-breaking change)
- [ ] 破坏性变更 (breaking change)
- [ ] 文档更新

## 测试

请描述您进行的测试。

- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 截图

如果有 UI 更改，请添加截图。
```

### 2. 代码审查标准

**代码质量**:
- ✅ 代码清晰易读
- ✅ 遵循代码规范
- ✅ 有适当的注释
- ✅ 没有重复代码
- ✅ 性能良好

**测试覆盖**:
- ✅ 有单元测试
- ✅ 测试覆盖关键路径
- ✅ 测试通过 CI
- ✅ 没有破坏现有测试

**文档**:
- ✅ 更新相关文档
- ✅ 添加代码注释
- ✅ 更新 API 文档
- ✅ 添加示例代码

## 🏗️ 项目结构

```
miao-code/
├── src/                      # 源代码
│   ├── core/                 # 核心系统
│   │   ├── query/           # 查询引擎
│   │   ├── tools/           # 工具系统
│   │   └── permissions/     # 权限系统
│   ├── ui/                  # UI 组件
│   │   ├── components/      # React 组件
│   │   ├── hooks/           # React Hooks
│   │   └── theme/           # 主题系统
│   ├── services/            # 服务层
│   │   ├── mcp/            # MCP 服务
│   │   ├── git/            # Git 服务
│   │   └── remote/         # 远程服务
│   ├── commands/            # CLI 命令
│   │   ├── core/           # 核心命令
│   │   └── custom/         # 自定义命令
│   └── utils/               # 工具函数
├── packages/                 # 包管理
│   ├── sdk/                # SDK 包
│   └── plugins/            # 插件包
├── docs/                     # 文档
├── tests/                    # 测试
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # E2E 测试
├── scripts/                  # 脚本
├── examples/                 # 示例
└── config/                   # 配置文件
```

## 🛠️ 技术栈

### 核心依赖

- **TypeScript**: 5.0+ - 编程语言
- **React**: 18.0+ - UI 框架
- **Ink**: 4.0+ - 终端 UI
- **Node.js**: 18.0+ - 运行时
- **Zod**: 3.0+ - 数据验证
- **Axios**: 1.0+ - HTTP 客户端

### 开发依赖

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Jest**: 测试框架
- **Vite**: 构建工具
- **Husky**: Git 钩子
- **Commitlint**: 提交检查

## 📋 开发任务

### 🎯 适合新手的任务

1. **文档改进**
   - 修复拼写错误
   - 改进示例代码
   - 添加使用说明
   - 翻译文档

2. **代码优化**
   - 改进代码格式
   - 添加注释
   - 重构简单函数
   - 优化性能

3. **测试相关**
   - 添加测试用例
   - 改进测试覆盖
   - 修复测试失败
   - 优化测试性能

4. **Bug 修复**
   - 修复简单 Bug
   - 处理边界情况
   - 改进错误处理
   - 优化用户体验

### 🚀 中级任务

1. **功能增强**
   - 添加新工具
   - 改进现有工具
   - 优化权限系统
   - 增强安全性

2. **性能优化**
   - 优化启动速度
   - 减少内存使用
   - 改进缓存机制
   - 优化网络请求

3. **UI/UX 改进**
   - 改进界面设计
   - 添加动画效果
   - 优化交互体验
   - 支持响应式设计

### ⭐ 高级任务

1. **架构改进**
   - 重构核心模块
   - 改进插件系统
   - 增强扩展性
   - 优化架构设计

2. **新功能开发**
   - 开发新工具
   - 实现新协议
   - 集成新服务
   - 支持新平台

3. **性能优化**
   - 大规模性能优化
   - 内存泄漏修复
   - 并发性能改进
   - 分布式架构

## 📊 开发工具

### 1. 代码检查

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化
npm run format

# 类型检查
npm run type-check
```

### 2. 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 E2E 测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage
```

### 3. 构建

```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build:prod

# 构建 SDK
npm run build:sdk

# 构建文档
npm run build:docs
```

### 4. 开发模式

```bash
# 启动开发服务器
npm run dev

# 启动开发模式（带热重载）
npm run dev:watch

# 启动开发代理
npm run dev:proxy
```

## 🎯 代码风格

### 1. TypeScript 风格

```typescript
// ✅ 推荐
interface User {
  name: string;
  age?: number;
  email: string;
}

const createUser = (name: string, email: string): User => {
  return { name, email };
};

// ❌ 不推荐
interface user {
  Name: string;
  Age?: number;
  Email: string;
}

const create_user = (Name: string, Email: string) => {
  return { Name, Email };
};
```

### 2. React 风格

```typescript
// ✅ 推荐
const MyComponent = ({ name }: { name: string }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 副作用逻辑
  }, [name]);
  
  return <div>Hello, {name}!</div>;
};

// ❌ 不推荐
function myComponent(props) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // 副作用逻辑
  });
  
  return <div>Hello, {props.name}!</div>;
}
```

### 3. 命名规范

```typescript
// ✅ 推荐
const userName = 'John';
const userService = new UserService();
const MAX_RETRIES = 3;
const formatDate = (date: Date): string => { /* ... */ };

// ❌ 不推荐
const UserName = 'John';
const user_service = new userService();
const max_retries = 3;
const FormatDate = (Date: Date): string => { /* ... */ };
```

## 📝 文档贡献

### 1. 文档结构

```
docs/
├── README.md              # 文档首页
├── quickstart.md          # 快速开始
├── installation.md        # 安装指南
├── config.md              # 配置参考
├── api.md                 # API 文档
├── tools.md               # 工具系统
├── plugins.md             # 插件开发
├── development.md         # 开发指南
├── architecture.md        # 架构设计
├── testing.md             # 测试指南
└── troubleshooting.md     # 故障排除
```

### 2. 文档编写规范

**格式**:
- 使用 Markdown 格式
- 代码块使用三个反引号
- 图片放在 `docs/assets/` 目录
- 链接使用相对路径

**内容**:
- 清晰简洁
- 提供示例
- 包含截图（如适用）
- 更新版本信息

## 🤝 社区

### 1. 沟通渠道

- **GitHub Issues**: https://github.com/miaoge2026/MiaoCode/issues
- **GitHub Discussions**: https://github.com/miaoge2026/MiaoCode/discussions
- **Discord**: [加入 Discord 服务器](https://discord.gg/miao-code)
- **Twitter**: [@MiaoCodeAI](https://twitter.com/MiaoCodeAI)

### 2. 行为准则

我们期望所有贡献者遵守以下行为准则：

- ✅ **尊重他人** - 保持专业和礼貌
- ✅ **包容性** - 欢迎不同背景的人
- ✅ **建设性** - 提供有建设性的反馈
- ✅ **透明度** - 保持透明和开放
- ✅ **协作** - 积极协作和帮助

## 📄 许可证

MiaoCode 使用 MIT 许可证。通过贡献代码，您同意：

1. 您的贡献将使用 MIT 许可证发布
2. 您拥有贡献代码的版权
3. 您有权授予我们使用代码的许可

## 🎯 贡献者名单

感谢所有贡献者！(按字母顺序)

- **@yourusername** - 您的贡献描述

## 📞 获取帮助

如果您在贡献过程中遇到任何问题，请：

1. **查看文档**: https://docs.miao-code.dev
2. **提交 Issue**: https://github.com/miaoge2026/MiaoCode/issues
3. **加入讨论**: https://github.com/miaoge2026/MiaoCode/discussions
4. **联系维护者**: main@miaocode.dev

## 🎉 感谢

感谢您考虑为 MiaoCode 贡献代码！您的贡献将使这个项目变得更好。

---

*最后更新: 2026-03-31*