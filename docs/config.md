# 配置参考 🔧

本文档提供了 MiaoCode 的完整配置选项参考。

## 📝 配置文件格式

MiaoCode 支持多种配置方式：

### 1. 项目配置文件（推荐）

在项目根目录创建 `.miao-config.json`：

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

### 2. 用户配置文件

全局配置文件位于 `~/.config/miao-code/config.json`：

```json
{
  "defaultModel": "sonnet",
  "apiKey": "your-api-key",
  "telemetry": true
}
```

### 3. 命令行参数

```bash
miao --model opus --max-budget-usd 5
```

### 4. 环境变量

```bash
export MIAO_MODEL=opus
export MIAO_MAX_BUDGET_USD=5
```

## 🎯 核心配置选项

### 模型配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `model` | string | `"sonnet"` | 使用的 AI 模型 |
| `fallbackModel` | string | `null` | 回退模型 |
| `temperature` | number | `0.7` | 生成温度 (0-1) |
| `maxTokens` | number | `4096` | 最大 token 数 |

**示例**:
```json
{
  "model": "opus",
  "fallbackModel": "sonnet",
  "temperature": 0.8,
  "maxTokens": 8192
}
```

**支持的模型**:
- `sonnet` - Claude Sonnet (推荐)
- `opus` - Claude Opus (最强)
- `haiku` - Claude Haiku (最快)

### 权限配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `permissionMode` | string | `"default"` | 权限模式 |
| `dangerousTools` | array | `[]` | 允许的危险工具 |
| `bypassPermissions` | boolean | `false` | 是否跳过权限检查 |

**权限模式**:
- `default` - 标准权限检查
- `bypassPermissions` - 跳过所有权限检查
- `dontAsk` - 自动拒绝需要确认的操作
- `plan` - 仅规划模式
- `auto` - 自动模式

**示例**:
```json
{
  "permissionMode": "default",
  "dangerousTools": ["bash:rm", "edit:overwrite"],
  "bypassPermissions": false
}
```

### 预算配置

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `maxBudgetUsd` | number | `10` | 最大预算 (美元) |
| `maxTokensPerMinute` | number | `40000` | 每分钟最大 token 数 |
| `maxRequestsPerMinute` | number | `50` | 每分钟最大请求数 |

**示例**:
```json
{
  "maxBudgetUsd": 20,
  "maxTokensPerMinute": 60000,
  "maxRequestsPerMinute": 100
}
```

## 🛠️ 工具配置

### 全局工具开关

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `tools.bash` | boolean | `true` | 启用 Bash 工具 |
| `tools.edit` | boolean | `true` | 启用文件编辑工具 |
| `tools.web` | boolean | `true` | 启用网页抓取工具 |
| `tools.agent` | boolean | `true` | 启用代理工具 |

**示例**:
```json
{
  "tools": {
    "bash": true,
    "edit": true,
    "web": false,
    "agent": true
  }
}
```

### 工具特定配置

#### Bash 工具

```json
{
  "tools": {
    "bash": {
      "enabled": true,
      "timeout": 30000,
      "allowedCommands": ["git", "npm", "ls", "cat"],
      "blockedCommands": ["rm", "sudo"],
      "workingDirectory": "/workspace"
    }
  }
}
```

#### 文件编辑工具

```json
{
  "tools": {
    "edit": {
      "enabled": true,
      "maxFileSize": 10485760,
      "allowedExtensions": [".ts", ".js", ".md", ".json"],
      "autoFormat": true
    }
  }
}
```

#### 网页抓取工具

```json
{
  "tools": {
    "web": {
      "enabled": true,
      "timeout": 10000,
      "maxContentLength": 500000,
      "allowedDomains": ["github.com", "docs.github.com"]
    }
  }
}
```

## 🔌 插件配置

### 插件管理

```json
{
  "plugins": {
    "autoUpdate": true,
    "installDir": "~/.config/miao-code/plugins",
    "registry": "https://registry.miao-code.dev",
    "installed": [
      "@miao/miao-plugin-python",
      "@miao/miao-plugin-react"
    ]
  }
}
```

### 插件特定配置

```json
{
  "plugins": {
    "@miao/miao-plugin-python": {
      "pythonPath": "/usr/bin/python3",
      "virtualenv": "venv",
      "lintOnSave": true
    }
  }
}
```

## 🌍 远程开发配置

### SSH 配置

```json
{
  "remote": {
    "ssh": {
      "defaultHost": "dev-server",
      "configFile": "~/.ssh/config",
      "timeout": 30000
    }
  }
}
```

### Codespaces 配置

```json
{
  "remote": {
    "codespaces": {
      "defaultMachine": "standardLinux32gb",
      "autoForwardPorts": true
    }
  }
}
```

## 🎨 UI/UX 配置

### 主题配置

```json
{
  "ui": {
    "theme": "dark",
    "colors": {
      "primary": "#00a8ff",
      "background": "#1e1e1e",
      "text": "#d4d4d4"
    },
    "fontSize": 14,
    "animation": true
  }
}
```

### 输出配置

```json
{
  "output": {
    "format": "auto",
    "verbose": false,
    "includeToolInput": false,
    "includeToolOutput": true
  }
}
```

## 📊 遥测配置

### 数据收集

```json
{
  "telemetry": {
    "enabled": true,
    "collectMetrics": true,
    "collectErrors": true,
    "collectUsage": true,
    "endpoint": "https://telemetry.miao-code.dev"
  }
}
```

### 隐私设置

```json
{
  "privacy": {
    "maskSensitiveData": true,
    "excludePaths": ["**/.env", "**/secrets/**"],
    "anonymizeUsage": false
  }
}
```

## 🔧 高级配置

### 缓存配置

```json
{
  "cache": {
    "enabled": true,
    "type": "memory",
    "ttl": 3600000,
    "maxSize": 1000,
    "persist": false
  }
}
```

### 日志配置

```json
{
  "logging": {
    "level": "info",
    "file": "~/.config/miao-code/logs/miao-code.log",
    "maxSize": 10485760,
    "maxFiles": 5,
    "console": true
  }
}
```

### 网络配置

```json
{
  "network": {
    "proxy": {
      "http": "http://localhost:8080",
      "https": "http://localhost:8080"
    },
    "timeout": 30000,
    "retryAttempts": 3,
    "userAgent": "MiaoCode/1.0.0"
  }
}
```

## 📋 配置优先级

配置的优先级从高到低：

1. **命令行参数** - 最高优先级
2. **环境变量** - 次高优先级
3. **项目配置文件** (`.miao-config.json`)
4. **用户配置文件** (`~/.config/miao-code/config.json`)
5. **默认配置** - 最低优先级

## 🔍 配置验证

### 验证配置

```bash
# 验证配置
miao config validate

# 查看当前配置
miao config show

# 重置配置
miao config reset
```

### 配置示例

#### 开发环境

```json
{
  "model": "sonnet",
  "permissionMode": "default",
  "maxBudgetUsd": 20,
  "tools": {
    "bash": true,
    "edit": true,
    "web": false
  },
  "ui": {
    "theme": "dark",
    "verbose": true
  }
}
```

#### 生产环境

```json
{
  "model": "opus",
  "permissionMode": "default",
  "maxBudgetUsd": 50,
  "tools": {
    "bash": true,
    "edit": true,
    "web": true,
    "agent": true
  },
  "telemetry": {
    "enabled": true
  }
}
```

#### 安全环境

```json
{
  "model": "sonnet",
  "permissionMode": "default",
  "maxBudgetUsd": 5,
  "tools": {
    "bash": {
      "enabled": true,
      "allowedCommands": ["ls", "cat", "grep", "find"]
    },
    "edit": {
      "enabled": true,
      "allowedExtensions": [".md", ".txt"]
    },
    "web": {
      "enabled": false
    }
  }
}
```

## 🎯 最佳实践

1. **项目特定配置** - 使用 `.miao-config.json` 管理项目配置
2. **全局配置** - 使用用户配置文件管理个人偏好
3. **敏感信息** - 使用环境变量或配置文件（不要硬编码）
4. **版本控制** - 将项目配置文件提交到 Git，排除用户配置文件

## 📞 获取帮助

如果配置遇到问题，请：

1. 运行 `miao config validate` 验证配置
2. 查看 `miao config show` 查看当前配置
3. 参考 [示例配置](https://github.com/miaoge2026/MiaoCode/tree/main/examples)
4. 提交 [GitHub Issue](https://github.com/miaoge2026/MiaoCode/issues)

祝您配置顺利！🐱✨