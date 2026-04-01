# 工具系统 🛠️

MiaoCode 的工具系统是其核心功能，允许 AI 模型与您的开发环境进行交互。本指南详细介绍了所有内置工具及其使用方法。

## 📋 工具概述

### 什么是工具？

工具是 MiaoCode 可以调用的功能模块，每个工具都有特定的用途：
- **Bash**: 执行 shell 命令
- **FileEdit**: 编辑文件
- **WebFetch**: 抓取网页内容
- **Agent**: 运行 AI 代理
- **Search**: 搜索代码
- **Git**: 版本控制操作

### 工具执行流程

1. **工具选择**: AI 模型选择合适的工具
2. **参数验证**: 验证输入参数
3. **权限检查**: 检查用户权限
4. **执行工具**: 执行工具逻辑
5. **结果返回**: 返回执行结果

## 🛠️ 内置工具详解

### 1. BashTool 💻

执行 shell 命令，是 MiaoCode 最常用的工具之一。

#### 使用方法

```bash
miao --print "运行 npm install"
miao --print "查看当前目录 ls -la"
miao --print "执行 git status"
```

#### 参数

```typescript
interface BashToolInput {
  command: string;           // 要执行的 shell 命令
  cwd?: string;              // 工作目录 (可选)
  timeout?: number;          // 超时时间 (毫秒, 可选)
  env?: Record<string, string>; // 环境变量 (可选)
}
```

#### 示例

```bash
# 基本命令
miao --print "列出文件" --tool Bash --args '{"command": "ls -la"}'

# 指定工作目录
miao --print "查看日志" --tool Bash --args '{"command": "cat log.txt", "cwd": "/var/log"}'

# 带超时
miao --print "长时间命令" --tool Bash --args '{"command": "sleep 10", "timeout": 5000}'
```

#### 安全特性

- **危险命令检测**: 自动检测 `rm -rf`, `sudo` 等危险命令
- **超时控制**: 默认 30 秒超时
- **权限检查**: 需要用户确认危险操作
- **命令白名单**: 可配置允许的命令列表

#### 配置

```json
{
  "tools": {
    "bash": {
      "enabled": true,
      "timeout": 30000,
      "allowedCommands": ["git", "npm", "ls", "cat", "grep"],
      "blockedCommands": ["rm", "sudo", "dd"],
      "workingDirectory": "/workspace",
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### 2. FileEditTool 📝

编辑文件，支持 diff 预览和原子操作。

#### 使用方法

```bash
miao --print "创建新文件"
miao --print "修改配置文件"
miao --print "添加函数到 index.ts"
```

#### 参数

```typescript
interface FileEditToolInput {
  path: string;              // 文件路径
  operations: Array<{
    type: 'insert' | 'delete' | 'replace'; // 操作类型
    start: number;            // 起始行号
    end?: number;             // 结束行号 (可选)
    content?: string;         // 新内容 (可选)
  }>;
  encoding?: string;         // 文件编码 (可选, 默认: utf-8)
}
```

#### 示例

```bash
# 创建新文件
miao --print "创建 hello.txt" --tool FileEdit --args '{"path": "hello.txt", "operations": [{"type": "insert", "start": 1, "content": "Hello, World!"}]}'

# 修改文件
miao --print "添加注释" --tool FileEdit --args '{"path": "index.ts", "operations": [{"type": "insert", "start": 1, "content": "// Main entry point\n"}]}'

# 删除行
miao --print "删除第5行" --tool FileEdit --args '{"path": "test.js", "operations": [{"type": "delete", "start": 5, "end": 6}]}'

# 替换内容
miao --print "修改变量名" --tool FileEdit --args '{"path": "app.ts", "operations": [{"type": "replace", "start": 10, "end": 12, "content": "const newName = 'value';"}]}'
```

#### 安全特性

- **Diff 预览**: 修改前显示差异
- **文件权限检查**: 检查文件是否可写
- **最大文件大小**: 默认 10MB 限制
- **备份机制**: 自动备份重要文件
- **撤销功能**: 支持撤销操作

#### 配置

```json
{
  "tools": {
    "edit": {
      "enabled": true,
      "maxFileSize": 10485760,
      "allowedExtensions": [".ts", ".js", ".md", ".json", ".yml", ".yaml"],
      "blockedExtensions": [".exe", ".dll", ".so"],
      "backup": true,
      "autoFormat": true,
      "formatters": {
        "*.ts": "prettier --write",
        "*.js": "prettier --write",
        "*.json": "json --sort-keys"
      }
    }
  }
}
```

### 3. WebFetchTool 🌐

抓取网页内容，支持多种 HTTP 方法。

#### 使用方法

```bash
miao --print "获取 GitHub API 数据"
miao --print "抓取网页内容"
miao --print "下载文件"
```

#### 参数

```typescript
interface WebFetchToolInput {
  url: string;               // 目标 URL
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // HTTP 方法 (可选, 默认: GET)
  headers?: Record<string, string>; // 请求头 (可选)
  body?: string;             // 请求体 (可选)
  timeout?: number;          // 超时时间 (毫秒, 可选)
  followRedirects?: boolean; // 是否跟随重定向 (可选, 默认: true)
  maxContentLength?: number; // 最大内容长度 (可选)
}
```

#### 示例

```bash
# GET 请求
miao --print "获取 GitHub 用户信息" --tool WebFetch --args '{"url": "https://api.github.com/users/miaoge2026"}'

# POST 请求
miao --print "创建 issue" --tool WebFetch --args '{"url": "https://api.github.com/repos/miaoge2026/MiaoCode/issues", "method": "POST", "headers": {"Authorization": "token YOUR_TOKEN"}, "body": "{\"title\": \"Bug report\", \"body\": \"Found a bug\"}"}'

# 带超时
miao --print "快速检查" --tool WebFetch --args '{"url": "https://example.com", "timeout": 5000}'

# 下载文件
miao --print "下载文件" --tool WebFetch --args '{"url": "https://example.com/file.zip", "maxContentLength": 10485760}'
```

#### 安全特性

- **URL 验证**: 验证 URL 格式和安全性
- **大小限制**: 默认 5MB 内容长度限制
- **超时控制**: 默认 10 秒超时
- **重定向限制**: 默认最多 10 次重定向
- **域名白名单**: 可配置允许的域名
- **HTTPS 强制**: 强制使用 HTTPS

#### 配置

```json
{
  "tools": {
    "web": {
      "enabled": true,
      "timeout": 10000,
      "maxContentLength": 500000,
      "allowedDomains": ["github.com", "api.github.com", "docs.github.com", "example.com"],
      "blockedDomains": ["localhost", "127.0.0.1"],
      "followRedirects": true,
      "maxRedirects": 10,
      "defaultHeaders": {
        "User-Agent": "MiaoCode/1.0.0"
      }
    }
  }
}
```

### 4. AgentTool 🤖

运行 AI 代理，支持复杂的多步骤任务。

#### 使用方法

```bash
miao --print "运行代码审查代理"
miao --print "创建文档生成代理"
miao --print "执行测试代理"
```

#### 参数

```typescript
interface AgentToolInput {
  agentType: string;         // 代理类型
  prompt: string;            // 用户提示词
  tools?: string[];          // 可用工具列表 (可选)
  model?: string;            // 使用的模型 (可选)
  maxIterations?: number;    // 最大迭代次数 (可选)
  temperature?: number;      // 生成温度 (可选)
}
```

#### 示例

```bash
# 代码审查代理
miao --print "审查代码" --tool Agent --args '{"agentType": "code-reviewer", "prompt": "Review the code in src/ directory", "tools": ["Bash", "FileEdit"], "maxIterations": 5}'

# 文档生成代理
miao --print "生成文档" --tool Agent --args '{"agentType": "documentation-generator", "prompt": "Generate API documentation for this project", "tools": ["FileEdit", "WebFetch"], "model": "opus"}'

# 测试代理
miao --print "运行测试" --tool Agent --args '{"agentType": "test-runner", "prompt": "Run all tests and fix failures", "tools": ["Bash", "FileEdit"], "maxIterations": 10}'
```

#### 代理类型

**内置代理**:
- `general-purpose` - 通用代理
- `code-reviewer` - 代码审查
- `documentation-generator` - 文档生成
- `test-runner` - 测试运行
- `bug-hunter` - Bug 查找
- `security-analyzer` - 安全分析

#### 配置

```json
{
  "tools": {
    "agent": {
      "enabled": true,
      "availableTypes": ["general-purpose", "code-reviewer", "documentation-generator"],
      "defaultModel": "sonnet",
      "defaultMaxIterations": 10,
      "timeout": 300000,
      "allowFork": true,
      "allowResume": true
    }
  }
}
```

### 5. SearchTool 🔍

搜索代码库，支持多种搜索模式。

#### 使用方法

```bash
miao --print "搜索函数定义"
miao --print "查找 TODO 注释"
miao --print "搜索错误处理"
```

#### 参数

```typescript
interface SearchToolInput {
  pattern: string;           // 搜索模式 (支持正则表达式)
  path?: string;             // 搜索路径 (可选)
  fileExtensions?: string[]; // 文件扩展名过滤 (可选)
  caseSensitive?: boolean;   // 是否大小写敏感 (可选, 默认: false)
  includeHidden?: boolean;   // 是否包含隐藏文件 (可选, 默认: false)
  maxResults?: number;       // 最大结果数 (可选, 默认: 100)
}
```

#### 示例

```bash
# 搜索函数
miao --print "查找函数" --tool Search --args '{"pattern": "function.*process", "path": "src/", "fileExtensions": [".ts", ".js"]}'

# 搜索注释
miao --print "查找 TODO" --tool Search --args '{"pattern": "TODO:", "caseSensitive": false}'

# 搜索错误
miao --print "查找错误" --tool Search --args '{"pattern": "console.error", "maxResults": 50}'

# 搜索导入
miao --print "查找导入" --tool Search --args '{"pattern": "import.*from.*react", "fileExtensions": [".tsx"]}'
```

#### 搜索特性

- **正则表达式**: 支持完整的正则表达式
- **文件过滤**: 按扩展名、路径过滤
- **结果高亮**: 高亮显示匹配内容
- **上下文显示**: 显示匹配行的上下文
- **统计信息**: 显示搜索结果统计

#### 配置

```json
{
  "tools": {
    "search": {
      "enabled": true,
      "maxResults": 100,
      "includeHidden": false,
      "caseSensitive": false,
      "contextLines": 2,
      "ignorePatterns": ["node_modules/**", ".git/**", "dist/**"],
      "timeout": 30000
    }
  }
}
```

### 6. GitTool 📚

Git 版本控制操作。

#### 使用方法

```bash
miao --print "查看 git 状态"
miao --print "提交代码"
miao --print "创建分支"
```

#### 参数

```typescript
interface GitToolInput {
  command: string;           // Git 命令
  args?: string[];           // 命令参数 (可选)
  cwd?: string;              // 工作目录 (可选)
}
```

#### 示例

```bash
# 查看状态
miao --print "Git 状态" --tool Git --args '{"command": "status"}'

# 添加文件
miao --print "添加文件" --tool Git --args '{"command": "add", "args": ["."]}'

# 提交
miao --print "提交代码" --tool Git --args '{"command": "commit", "args": ["-m", "Initial commit"]}'

# 推送
miao --print "推送代码" --tool Git --args '{"command": "push", "args": ["origin", "main"]}'

# 拉取
miao --print "拉取代码" --tool Git --args '{"command": "pull", "args": ["origin", "main"]}'
```

#### 支持的操作

- `status` - 查看状态
- `add` - 添加文件
- `commit` - 提交更改
- `push` - 推送代码
- `pull` - 拉取代码
- `clone` - 克隆仓库
- `branch` - 分支操作
- `merge` - 合并分支
- `log` - 查看日志
- `diff` - 查看差异

#### 配置

```json
{
  "tools": {
    "git": {
      "enabled": true,
      "defaultBranch": "main",
      "defaultRemote": "origin",
      "timeout": 60000,
      "autoStage": false,
      "autoPush": false
    }
  }
}
```

## 🔧 工具配置

### 全局工具开关

```json
{
  "tools": {
    "bash": true,
    "edit": true,
    "web": true,
    "agent": true,
    "search": true,
    "git": true,
    "repl": true,
    "notebook": true
  }
}
```

### 工具权限

```json
{
  "toolPermissions": {
    "bash": {
      "allowedCommands": ["git", "npm", "ls", "cat", "grep", "find"],
      "blockedCommands": ["rm", "sudo", "dd", "shutdown"],
      "timeout": 30000
    },
    "edit": {
      "allowedExtensions": [".ts", ".js", ".md", ".json"],
      "maxFileSize": 10485760,
      "autoBackup": true
    }
  }
}
```

### 工具别名

```json
{
  "toolAliases": {
    "shell": "Bash",
    "file": "FileEdit",
    "http": "WebFetch",
    "ai": "Agent",
    "grep": "Search",
    "version-control": "Git"
  }
}
```

## 🛡️ 安全特性

### 1. 权限检查

所有工具在执行前都会进行权限检查：

```typescript
interface PermissionCheck {
  tool: string;              // 工具名称
  input: any;                // 输入参数
  userPermission: string;    // 用户权限级别
  isDangerous: boolean;      // 是否危险操作
  requiresConfirmation: boolean; // 是否需要确认
}
```

### 2. 危险操作检测

```typescript
// 危险命令检测
const dangerousCommands = [
  'rm -rf /',
  'sudo',
  'dd',
  'mkfs',
  'shutdown',
  'reboot'
];

// 危险文件操作
const dangerousFileOperations = [
  'overwrite system files',
  'delete large directories',
  'modify executable files'
];
```

### 3. 沙箱执行

```typescript
// 沙箱配置
const sandboxConfig = {
  memoryLimit: 128 * 1024 * 1024, // 128MB
  timeout: 5000,                  // 5秒
  networkIsolation: true,         // 网络隔离
  fileSystemIsolation: true       // 文件系统隔离
};
```

## 📊 工具使用统计

### 启用统计

```json
{
  "telemetry": {
    "enabled": true,
    "collectToolUsage": true
  }
}
```

### 查看统计

```bash
miao --print "显示工具使用统计"
miao --print "查看 Bash 工具使用情况"
miao --print "分析工具性能"
```

## 🔄 自定义工具

### 创建自定义工具

```typescript
import { Tool } from '@miao/miao-code-sdk';

const myCustomTool: Tool = {
  name: 'MyTool',
  description: 'My custom tool',
  inputSchema: z.object({
    param1: z.string(),
    param2: z.number().optional()
  }),
  call: async (input, context) => {
    // 工具逻辑
    return { result: 'Success' };
  }
};

// 注册工具
miao.registerTool(myCustomTool);
```

### 工具开发最佳实践

1. **输入验证**: 始终验证输入参数
2. **错误处理**: 妥善处理错误
3. **权限检查**: 检查用户权限
4. **性能优化**: 优化执行性能
5. **文档完善**: 提供详细文档

## 📞 获取帮助

- **工具文档**: https://docs.miao-code.dev/tools
- **示例代码**: https://github.com/miaoge2026/miao-code-examples
- **社区讨论**: https://github.com/miaoge2026/MiaoCode/discussions
- **提交问题**: https://github.com/miaoge2026/MiaoCode/issues

---

*工具系统版本: 1.0.0*