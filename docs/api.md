# API 文档 🚀

本文档提供了 MiaoCode 的完整 API 参考，适用于开发者集成和扩展。

## 📦 安装 SDK

### npm

```bash
npm install @miao/miao-code-sdk
```

### yarn

```bash
yarn add @miao/miao-code-sdk
```

### pnpm

```bash
pnpm add @miao/miao-code-sdk
```

## 🚀 快速开始

### 基本用法

```typescript
import { MiaoCode } from '@miao/miao-code-sdk';

// 初始化客户端
const miao = new MiaoCode({
  apiKey: 'your-api-key',
  model: 'sonnet'
});

// 发送消息
const response = await miao.chat('Hello, MiaoCode!');
console.log(response.content);
```

### 流式响应

```typescript
import { MiaoCode } from '@miao/miao-code-sdk';

const miao = new MiaoCode({
  apiKey: 'your-api-key',
  model: 'sonnet'
});

// 流式响应
for await (const chunk of miao.chatStream('Write a poem')) {
  console.log(chunk.content);
}
```

## 🔧 核心 API

### MiaoCode 类

#### 构造函数

```typescript
new MiaoCode(config: MiaoCodeConfig)
```

**配置选项**:

```typescript
interface MiaoCodeConfig {
  apiKey: string;              // API 密钥 (必需)
  model?: string;              // 模型名称 (默认: 'sonnet')
  baseURL?: string;            // API 基础 URL (默认: 'https://api.miao-code.dev')
  timeout?: number;            // 请求超时 (默认: 30000)
  maxRetries?: number;         // 最大重试次数 (默认: 3)
  headers?: Record<string, string>; // 自定义请求头
}
```

#### 方法

##### chat

发送聊天消息并获取响应。

```typescript
async chat(message: string, options?: ChatOptions): Promise<ChatResponse>
```

**参数**:
- `message: string` - 用户消息
- `options?: ChatOptions` - 聊天选项

**ChatOptions**:
```typescript
interface ChatOptions {
  model?: string;              // 覆盖模型
  temperature?: number;        // 生成温度 (0-1)
  maxTokens?: number;          // 最大 token 数
  tools?: Tool[];              // 启用的工具
  toolChoice?: 'auto' | 'any' | 'none'; // 工具选择策略
  metadata?: Record<string, any>; // 元数据
}
```

**返回**:
```typescript
interface ChatResponse {
  id: string;                  // 响应 ID
  content: string;             // 响应内容
  model: string;               // 使用的模型
  usage: {
    promptTokens: number;      // 提示 token 数
    completionTokens: number;  // 完成 token 数
    totalTokens: number;       // 总 token 数
  };
  toolCalls?: ToolCall[];      // 工具调用
}
```

**示例**:
```typescript
const response = await miao.chat('What is TypeScript?', {
  model: 'opus',
  temperature: 0.7,
  maxTokens: 1000
});

console.log(response.content);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

##### chatStream

发送聊天消息并获取流式响应。

```typescript
async *chatStream(message: string, options?: ChatOptions): AsyncGenerator<ChatChunk>
```

**返回**:
```typescript
interface ChatChunk {
  id: string;                  // 块 ID
  content: string;             // 块内容
  model: string;               // 使用的模型
  finishReason?: string;       // 完成原因
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**示例**:
```typescript
for await (const chunk of miao.chatStream('Write a long story')) {
  process.stdout.write(chunk.content);
}
```

##### messages

消息管理 API。

```typescript
// 获取消息历史
async getMessages(params?: GetMessagesParams): Promise<Message[]>

// 获取特定消息
async getMessage(id: string): Promise<Message>

// 删除消息
async deleteMessage(id: string): Promise<void>
```

##### tools

工具管理 API。

```typescript
// 列出可用工具
async listTools(): Promise<Tool[]>

// 获取工具详情
async getTool(name: string): Promise<Tool>

// 执行工具
async executeTool(name: string, args: any): Promise<ToolResult>
```

##### agents

代理管理 API。

```typescript
// 创建代理
async createAgent(definition: AgentDefinition): Promise<Agent>

// 运行代理
async runAgent(agentId: string, prompt: string): Promise<AgentRun>

// 获取代理状态
async getAgentStatus(agentId: string): Promise<AgentStatus>
```

## 🛠️ 工具 API

### 工具定义

```typescript
interface Tool {
  name: string;                // 工具名称
  description: string;         // 工具描述
  inputSchema: z.ZodSchema;    // 输入 schema
  outputSchema?: z.ZodSchema;  // 输出 schema
  isEnabled: () => boolean;    // 是否启用
  call: (input: any, context: ToolContext) => Promise<any>; // 执行方法
}
```

### 工具上下文

```typescript
interface ToolContext {
  cwd: string;                 // 当前工作目录
  env: Record<string, string>; // 环境变量
  abortSignal: AbortSignal;    // 中止信号
  logger: Logger;              // 日志记录器
  config: Config;              // 配置
}
```

### 内置工具

#### BashTool

执行 shell 命令。

```typescript
const bashTool = {
  name: 'Bash',
  description: 'Execute shell commands',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    cwd: z.string().optional().describe('Working directory'),
    timeout: z.number().optional().describe('Command timeout in ms')
  }),
  call: async (input, context) => {
    const { exec } = await import('child_process');
    return new Promise((resolve, reject) => {
      exec(input.command, {
        cwd: input.cwd || context.cwd,
        timeout: input.timeout || 30000
      }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
  }
};
```

#### FileEditTool

编辑文件。

```typescript
const fileEditTool = {
  name: 'FileEdit',
  description: 'Edit files with diff preview',
  inputSchema: z.object({
    path: z.string().describe('File path'),
    operations: z.array(z.object({
      type: z.enum(['insert', 'delete', 'replace']),
      start: z.number().describe('Start line number'),
      end: z.number().optional().describe('End line number'),
      content: z.string().optional().describe('New content')
    }))
  }),
  call: async (input, context) => {
    const fs = await import('fs/promises');
    const content = await fs.readFile(input.path, 'utf-8');
    // ... 执行编辑操作
    await fs.writeFile(input.path, newContent);
    return { success: true, diff: generateDiff(content, newContent) };
  }
};
```

#### WebFetchTool

抓取网页内容。

```typescript
const webFetchTool = {
  name: 'WebFetch',
  description: 'Fetch web content',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to fetch'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    headers: z.record(z.string()).optional(),
    body: z.string().optional()
  }),
  call: async (input, context) => {
    const response = await fetch(input.url, {
      method: input.method || 'GET',
      headers: input.headers,
      body: input.body
    });
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  }
};
```

## 🤖 代理 API

### 代理定义

```typescript
interface AgentDefinition {
  name: string;                // 代理名称
  description: string;         // 代理描述
  prompt: string;              // 系统提示词
  tools: string[];             // 可用工具列表
  model: string;               // 使用的模型
  maxIterations: number;       // 最大迭代次数
}
```

### 创建代理

```typescript
const agent = await miao.createAgent({
  name: 'CodeReviewer',
  description: 'Reviews code for best practices',
  prompt: 'You are an expert code reviewer. Review the code and suggest improvements.',
  tools: ['Bash', 'FileEdit', 'WebFetch'],
  model: 'sonnet',
  maxIterations: 10
});
```

### 运行代理

```typescript
const run = await miao.runAgent(agent.id, 'Review this TypeScript code...');

// 获取执行结果
const result = await miao.waitForAgentRun(run.id);
console.log(result.output);
```

## 📊 管理 API

### 模型管理

```typescript
// 列出可用模型
async listModels(): Promise<Model[]>

// 获取模型信息
async getModel(name: string): Promise<Model>

// 更新模型配置
async updateModel(name: string, config: ModelConfig): Promise<Model>
```

### 用户管理

```typescript
// 获取用户信息
async getUser(): Promise<User>

// 更新用户设置
async updateUserSettings(settings: UserSettings): Promise<UserSettings>

// 获取使用统计
async getUsageStats(): Promise<UsageStats>
```

### 会话管理

```typescript
// 创建会话
async createSession(config?: SessionConfig): Promise<Session>

// 获取会话
async getSession(id: string): Promise<Session>

// 删除会话
async deleteSession(id: string): Promise<void>
```

## 🔄 Webhook API

### 配置 Webhook

```typescript
interface WebhookConfig {
  url: string;                 // Webhook URL
  events: string[];            // 监听的事件
  secret: string;              // Webhook 密钥
  active: boolean;             // 是否激活
}
```

### Webhook 事件

```typescript
interface WebhookEvent {
  id: string;                  // 事件 ID
  type: string;                // 事件类型
  timestamp: string;           // 时间戳
  data: any;                   // 事件数据
}
```

**事件类型**:
- `message.created` - 消息创建
- `message.completed` - 消息完成
- `agent.started` - 代理启动
- `agent.completed` - 代理完成
- `tool.executed` - 工具执行

## 📦 插件 API

### 插件定义

```typescript
interface Plugin {
  name: string;                // 插件名称
  version: string;             // 插件版本
  description: string;         // 插件描述
  author: string;              // 插件作者
  activate: (context: PluginContext) => void; // 激活方法
  deactivate: () => void;      // 停用方法
}
```

### 插件上下文

```typescript
interface PluginContext {
  miao: MiaoCode;              // MiaoCode 实例
  config: Config;              // 配置
  logger: Logger;              // 日志记录器
  registerTool: (tool: Tool) => void; // 注册工具
  registerCommand: (command: Command) => void; // 注册命令
}
```

### 创建插件

```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  description = 'My custom plugin';
  author = 'Your Name';

  activate(context: PluginContext) {
    // 注册新工具
    context.registerTool({
      name: 'MyTool',
      description: 'My custom tool',
      inputSchema: z.object({}),
      call: async () => ({ result: 'Hello!' })
    });
  }

  deactivate() {
    // 清理资源
  }
}
```

## 📝 错误处理

### 错误类型

```typescript
class MiaoCodeError extends Error {
  code: string;                // 错误代码
  status: number;              // HTTP 状态码
  details?: any;               // 错误详情
}
```

**常见错误代码**:
- `INVALID_API_KEY` - API 密钥无效
- `RATE_LIMIT_EXCEEDED` - 超出速率限制
- `MODEL_NOT_FOUND` - 模型不存在
- `TOOL_NOT_FOUND` - 工具不存在
- `VALIDATION_ERROR` - 验证错误

### 错误处理示例

```typescript
try {
  const response = await miao.chat('Hello');
} catch (error) {
  if (error instanceof MiaoCodeError) {
    console.error(`Error ${error.code}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📊 类型定义

### 基础类型

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}
```

## 🎯 最佳实践

### 1. 配置管理

```typescript
// 不要硬编码配置
const miao = new MiaoCode({
  apiKey: process.env.MIAO_API_KEY || 'default-key'
});
```

### 2. 错误处理

```typescript
// 总是处理错误
try {
  await miao.chat('Hello');
} catch (error) {
  logger.error('Chat failed', error);
  // 重试逻辑
  await retry(() => miao.chat('Hello'));
}
```

### 3. 资源清理

```typescript
// 清理资源
process.on('SIGINT', () => {
  miao.destroy();
  process.exit(0);
});
```

### 4. 类型安全

```typescript
// 使用 TypeScript 类型
const response: ChatResponse = await miao.chat('Hello');
```

## 📞 获取帮助

- **文档**: https://docs.miao-code.dev
- **GitHub**: https://github.com/miaoge2026/MiaoCode
- **Issues**: https://github.com/miaoge2026/MiaoCode/issues
- **Discussions**: https://github.com/miaoge2026/MiaoCode/discussions

## 🔄 版本控制

本文档对应 MiaoCode SDK 版本 `1.0.0`。

- [更新日志](https://github.com/miaoge2026/MiaoCode/releases)
- [迁移指南](https://github.com/miaoge2026/MiaoCode/wiki/migration)

---

*Generated on 2026-03-31*