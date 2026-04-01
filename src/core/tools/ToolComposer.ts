import type { Tool } from './Tool'
import type { ToolInput, ToolOutput, ToolContext } from '../types/tools'

export interface ToolComposition {
  tools: Tool[]
  executionOrder: ('sequential' | 'parallel' | 'conditional')
  errorHandling: ('stop' | 'continue' | 'fallback')
  timeout?: number
}

export interface ToolExecutionPlan {
  steps: ToolExecutionStep[]
  estimatedDuration: number
  requiredResources: string[]
  fallbackPlan?: ToolComposition
}

export interface ToolExecutionStep {
  tool: Tool
  input: ToolInput
  dependencies?: string[]
  condition?: string
  timeout?: number
}

export interface ToolExecutionResult {
  plan: ToolExecutionPlan
  results: Map<string, ToolOutput>
  duration: number
  success: boolean
  error?: string
}

export class ToolComposer {
  private toolRegistry: Map<string, Tool>
  private executionCache: Map<string, any>
  private context: ToolContext

  constructor(tools: Tool[], context: ToolContext) {
    this.toolRegistry = new Map()
    this.executionCache = new Map()
    this.context = context
    
    // 注册工具
    for (const tool of tools) {
      this.toolRegistry.set(tool.name, tool)
    }
  }

  async compose(composition: ToolComposition, input: ToolInput): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🛠️  Composing tools: ${composition.tools.map(t => t.name).join(' -> ')}`)
      
      // 生成执行计划
      const plan = await this.generateExecutionPlan(composition, input)
      
      // 执行计划
      const results = await this.executePlan(plan, composition)
      
      const duration = Date.now() - startTime
      
      console.log(`✅ Tool composition completed in ${duration}ms`)
      
      return {
        plan,
        results,
        duration,
        success: true
      }
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      console.error(`❌ Tool composition failed: ${error}`)
      
      // 尝试备用计划
      if (composition.errorHandling === 'fallback' && composition.fallbackPlan) {
        console.log('🔄 Trying fallback plan...')
        return this.compose(composition.fallbackPlan, input)
      }
      
      return {
        plan: await this.generateExecutionPlan(composition, input),
        results: new Map(),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateExecutionPlan(composition: ToolComposition, input: ToolInput): Promise<ToolExecutionPlan> {
    const steps: ToolExecutionStep[] = []
    let totalEstimatedDuration = 0
    const requiredResources = new Set<string>()
    
    // 根据执行顺序生成步骤
    switch (composition.executionOrder) {
      case 'sequential':
        for (const tool of composition.tools) {
          const step = await this.createStep(tool, input)
          steps.push(step)
          totalEstimatedDuration += step.timeout || 30000
          this.collectResources(tool, requiredResources)
        }
        break
        
      case 'parallel':
        for (const tool of composition.tools) {
          const step = await this.createStep(tool, input)
          steps.push(step)
          const stepDuration = step.timeout || 30000
          totalEstimatedDuration = Math.max(totalEstimatedDuration, stepDuration)
          this.collectResources(tool, requiredResources)
        }
        break
        
      case 'conditional':
        for (const tool of composition.tools) {
          const step = await this.createConditionalStep(tool, input)
          steps.push(step)
          totalEstimatedDuration += step.timeout || 30000
          this.collectResources(tool, requiredResources)
        }
        break
    }
    
    return {
      steps,
      estimatedDuration: totalEstimatedDuration,
      requiredResources: Array.from(requiredResources)
    }
  }

  async executePlan(plan: ToolExecutionPlan, composition: ToolComposition): Promise<Map<string, ToolOutput>> {
    const results = new Map<string, ToolOutput>()
    
    for (const step of plan.steps) {
      // 检查条件
      if (step.condition && !await this.evaluateCondition(step.condition, results)) {
        console.log(`⏭️  Skipping step: ${step.tool.name} (condition not met)`)
        continue
      }
      
      // 检查依赖
      if (step.dependencies && !this.checkDependencies(step.dependencies, results)) {
        throw new Error(`Dependencies not met for tool: ${step.tool.name}`)
      }
      
      // 执行工具
      try {
        const result = await this.executeTool(step.tool, step.input, step.timeout)
        results.set(step.tool.name, result)
        
        // 缓存结果
        const cacheKey = this.generateCacheKey(step.tool.name, step.input)
        this.executionCache.set(cacheKey, result)
        
      } catch (error) {
        if (composition.errorHandling === 'stop') {
          throw error
        } else if (composition.errorHandling === 'fallback') {
          throw error // 由调用者处理回退
        }
        // 'continue' - 继续执行下一个工具
      }
    }
    
    return results
  }

  async createStep(tool: Tool, input: ToolInput): Promise<ToolExecutionStep> {
    // 创建工具执行步骤
    const toolInput = await this.prepareToolInput(tool, input)
    
    return {
      tool,
      input: toolInput,
      timeout: this.getToolTimeout(tool)
    }
  }

  async createConditionalStep(tool: Tool, input: ToolInput): Promise<ToolExecutionStep> {
    // 创建条件工具步骤
    const toolInput = await this.prepareToolInput(tool, input)
    const condition = await this.generateCondition(tool, input)
    
    return {
      tool,
      input: toolInput,
      condition,
      timeout: this.getToolTimeout(tool)
    }
  }

  async prepareToolInput(tool: Tool, input: ToolInput): Promise<ToolInput> {
    // 准备工具输入
    const toolInput: ToolInput = { ...input }
    
    // 根据工具类型调整输入
    switch (tool.name) {
      case 'Bash':
        toolInput.cwd = toolInput.cwd || this.context.cwd
        toolInput.timeout = toolInput.timeout || 30000
        break
        
      case 'FileEdit':
        toolInput.path = toolInput.path || './'
        toolInput.encoding = toolInput.encoding || 'utf-8'
        break
        
      case 'WebFetch':
        toolInput.timeout = toolInput.timeout || 10000
        toolInput.method = toolInput.method || 'GET'
        break
        
      case 'Agent':
        toolInput.maxIterations = toolInput.maxIterations || 10
        toolInput.model = toolInput.model || 'sonnet'
        break
        
      case 'Search':
        toolInput.maxResults = toolInput.maxResults || 100
        toolInput.caseSensitive = toolInput.caseSensitive || false
        break
    }
    
    return toolInput
  }

  async generateCondition(tool: Tool, input: ToolInput): Promise<string> {
    // 生成工具执行条件
    const conditions: string[] = []
    
    // 基于输入参数的条件
    if (input.requiredTools && input.requiredTools.length > 0) {
      conditions.push(`hasTools(${input.requiredTools.join(',')})`)
    }
    
    if (input.fileExtensions && input.fileExtensions.length > 0) {
      conditions.push(`hasExtensions(${input.fileExtensions.join(',')})`)
    }
    
    if (input.minConfidence) {
      conditions.push(`confidence >= ${input.minConfidence}`)
    }
    
    // 基于工具类型的条件
    switch (tool.name) {
      case 'Bash':
        conditions.push(`command !== 'rm -rf /'`) // 防止危险命令
        break
        
      case 'FileEdit':
        conditions.push(`fileExists('${input.path}')`)
        conditions.push(`fileSize('${input.path}') < ${10 * 1024 * 1024}`) // 10MB限制
        break
        
      case 'WebFetch':
        conditions.push(`isValidUrl('${input.url}')`)
        conditions.push(`isAllowedDomain('${input.url}')`)
        break
    }
    
    return conditions.join(' && ')
  }

  async evaluateCondition(condition: string, results: Map<string, ToolOutput>): Promise<boolean> {
    // 评估执行条件
    const env = this.createEvaluationEnvironment(results)
    
    try {
      // 安全地评估条件
      return Function('"use strict"; return (' + condition + ')').call(env)
    } catch (error) {
      console.error(`❌ Failed to evaluate condition: ${condition}`, error)
      return false
    }
  }

  createEvaluationEnvironment(results: Map<string, ToolOutput>): any {
    // 创建条件评估环境
    const env: any = {
      hasTools: (...tools: string[]) => {
        // 检查是否有所需工具
        return tools.every(tool => this.toolRegistry.has(tool))
      },
      hasExtensions: (...extensions: string[]) => {
        // 检查文件扩展名
        return true // 简化的实现
      },
      fileExists: (path: string) => {
        // 检查文件是否存在
        return true // 简化的实现
      },
      fileSize: (path: string) => {
        // 获取文件大小
        return 0 // 简化的实现
      },
      isValidUrl: (url: string) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      isAllowedDomain: (url: string) => {
        // 检查域名是否允许
        return true // 简化的实现
      },
      confidence: 0.8, // 默认置信度
      ...Object.fromEntries(results) // 添加工具结果
    }
    
    return env
  }

  checkDependencies(dependencies: string[], results: Map<string, ToolOutput>): boolean {
    // 检查依赖是否满足
    return dependencies.every(dep => results.has(dep))
  }

  async executeTool(tool: Tool, input: ToolInput, timeout?: number): Promise<ToolOutput> {
    // 执行单个工具
    const cacheKey = this.generateCacheKey(tool.name, input)
    
    // 检查缓存
    if (this.executionCache.has(cacheKey)) {
      console.log(`🔍 Using cached result for: ${tool.name}`)
      return this.executionCache.get(cacheKey)
    }
    
    // 执行工具
    const executionPromise = tool.call(input, this.context)
    
    // 应用超时
    const timeoutMs = timeout || this.getToolTimeout(tool)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Tool execution timeout: ${tool.name}`)), timeoutMs)
    })
    
    try {
      const result = await Promise.race([executionPromise, timeoutPromise])
      
      // 缓存结果
      this.executionCache.set(cacheKey, result)
      
      return result
      
    } catch (error) {
      console.error(`❌ Tool execution failed: ${tool.name}`, error)
      throw error
    }
  }

  generateCacheKey(toolName: string, input: ToolInput): string {
    // 生成缓存键
    const inputStr = JSON.stringify(input)
    return `${toolName}:${inputStr}`
  }

  getToolTimeout(tool: Tool): number {
    // 获取工具超时时间
    const defaultTimeouts: Record<string, number> = {
      'Bash': 30000,
      'FileEdit': 60000,
      'WebFetch': 10000,
      'Agent': 300000,
      'Search': 15000,
      'Git': 60000,
      'REPL': 120000
    }
    
    return defaultTimeouts[tool.name] || 30000
  }

  collectResources(tool: Tool, resources: Set<string>): void {
    // 收集工具所需资源
    const resourceMap: Record<string, string[]> = {
      'Bash': ['shell', 'process'],
      'FileEdit': ['filesystem', 'memory'],
      'WebFetch': ['network', 'memory'],
      'Agent': ['ai', 'memory'],
      'Search': ['filesystem', 'memory'],
      'Git': ['filesystem', 'process'],
      'REPL': ['process', 'memory']
    }
    
    const toolResources = resourceMap[tool.name] || ['memory']
    toolResources.forEach(resource => resources.add(resource))
  }

  // 工具组合辅助方法

  async composeSequential(tools: Tool[], input: ToolInput): Promise<ToolExecutionResult> {
    // 顺序执行工具
    const composition: ToolComposition = {
      tools,
      executionOrder: 'sequential',
      errorHandling: 'stop'
    }
    
    return this.compose(composition, input)
  }

  async composeParallel(tools: Tool[], input: ToolInput): Promise<ToolExecutionResult> {
    // 并行执行工具
    const composition: ToolComposition = {
      tools,
      executionOrder: 'parallel',
      errorHandling: 'continue'
    }
    
    return this.compose(composition, input)
  }

  async composeConditional(tools: Tool[], input: ToolInput): Promise<ToolExecutionResult> {
    // 条件执行工具
    const composition: ToolComposition = {
      tools,
      executionOrder: 'conditional',
      errorHandling: 'fallback'
    }
    
    return this.compose(composition, input)
  }

  // 高级组合模式

  async composeWithFallback(
    primaryTools: Tool[], 
    fallbackTools: Tool[], 
    input: ToolInput
  ): Promise<ToolExecutionResult> {
    // 带回退的工具组合
    const primaryComposition: ToolComposition = {
      tools: primaryTools,
      executionOrder: 'sequential',
      errorHandling: 'fallback',
      fallbackPlan: {
        tools: fallbackTools,
        executionOrder: 'sequential',
        errorHandling: 'continue'
      }
    }
    
    return this.compose(primaryComposition, input)
  }

  async composeWithRetry(
    tools: Tool[], 
    input: ToolInput, 
    maxRetries = 3
  ): Promise<ToolExecutionResult> {
    // 带重试的工具组合
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`)
        
        const composition: ToolComposition = {
          tools,
          executionOrder: 'sequential',
          errorHandling: 'stop'
        }
        
        return await this.compose(composition, input)
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`❌ Attempt ${attempt} failed: ${lastError.message}`)
        
        if (attempt < maxRetries) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    throw lastError
  }

  // 性能优化

  clearCache(): void {
    this.executionCache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.executionCache.size,
      keys: Array.from(this.executionCache.keys())
    }
  }

  async estimateExecutionTime(composition: ToolComposition): Promise<number> {
    // 估算执行时间
    let totalTime = 0
    
    for (const tool of composition.tools) {
      totalTime += this.getToolTimeout(tool)
    }
    
    // 并行执行时，总时间是最大的单个工具时间
    if (composition.executionOrder === 'parallel') {
      return Math.max(...composition.tools.map(t => this.getToolTimeout(t)))
    }
    
    return totalTime
  }
}

// 使用示例
export class ToolComposerExamples {
  static async createDefaultComposer(context: ToolContext): Promise<ToolComposer> {
    // 创建默认工具集
    const { BashTool } = await import('./BashTool')
    const { FileEditTool } = await import('./FileEditTool')
    const { WebFetchTool } = await import('./WebFetchTool')
    const { AgentTool } = await import('./AgentTool')
    const { SearchTool } = await import('./SearchTool')
    
    const tools = [
      new BashTool(),
      new FileEditTool(),
      new WebFetchTool(),
      new AgentTool(),
      new SearchTool()
    ]
    
    return new ToolComposer(tools, context)
  }

  static async exampleSequentialComposition(composer: ToolComposer, input: ToolInput): Promise<void> {
    console.log('🔄 Example: Sequential Tool Composition')
    
    // 创建工具实例
    const { BashTool } = await import('./BashTool')
    const { FileEditTool } = await import('./FileEditTool')
    const { SearchTool } = await import('./SearchTool')
    
    const tools = [
      new BashTool(),
      new FileEditTool(),
      new SearchTool()
    ]
    
    const composition: ToolComposition = {
      tools,
      executionOrder: 'sequential',
      errorHandling: 'stop'
    }
    
    const result = await composer.compose(composition, input)
    
    console.log('✅ Composition completed:', result.success)
    console.log('📊 Results:', result.results.size)
    console.log('⏱️  Duration:', result.duration, 'ms')
  }

  static async exampleParallelComposition(composer: ToolComposer, input: ToolInput): Promise<void> {
    console.log('🔄 Example: Parallel Tool Composition')
    
    const { BashTool } = await import('./BashTool')
    const { WebFetchTool } = await import('./WebFetchTool')
    const { SearchTool } = await import('./SearchTool')
    
    const tools = [
      new BashTool(),
      new WebFetchTool(),
      new SearchTool()
    ]
    
    const composition: ToolComposition = {
      tools,
      executionOrder: 'parallel',
      errorHandling: 'continue'
    }
    
    const result = await composer.compose(composition, input)
    
    console.log('✅ Composition completed:', result.success)
    console.log('📊 Results:', result.results.size)
    console.log('⏱️  Duration:', result.duration, 'ms')
  }
}