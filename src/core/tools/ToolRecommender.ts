import type { Tool } from './Tool'
import type { ToolContext } from '../types/context'

interface TaskFeatures {
  keywords: string[]
  complexity: 'low' | 'medium' | 'high'
  domain: string[]
  requiredTools: string[]
}

interface ToolUsagePattern {
  tool: string
  taskTypes: string[]
  successRate: number
  avgDuration: number
  usageCount: number
}

interface Recommendation {
  tool: Tool
  score: number
  reason: string
  confidence: number
}

interface DomainPattern {
  domain: string
  preferredTools: string[]
  commonSequences: string[][]
  avgComplexity: number
}

export class ToolRecommender {
  private usagePatterns: Map<string, ToolUsagePattern> = new Map()
  private contextHistory: Context[] = []
  private domainPatterns: Map<string, DomainPattern> = new Map()
  private taskTypePatterns: Map<string, string[]> = new Map()
  private toolCache: Map<string, Tool> = new Map()

  constructor(private tools: Tool[], private context: ToolContext) {
    this.initializePatterns()
  }

  async recommendTools(context: Context, task: string): Promise<Recommendation[]> {
    console.log(`🔍 Recommending tools for task: ${task}`)
    
    // 1. 分析任务特征
    const features = await this.analyzeTask(task)
    console.log(`📊 Task features:`, features)
    
    // 2. 查找相似任务
    const similarTasks = await this.findSimilarTasks(features)
    
    // 3. 基于历史推荐
    const historicalRecommendation = await this.getHistoricalRecommendation(features, similarTasks)
    
    // 4. 基于上下文的推荐
    const contextRecommendation = await this.getContextRecommendation(context, features)
    
    // 5. 基于域名的推荐
    const domainRecommendation = await this.getDomainRecommendation(features)
    
    // 6. 合并和排序推荐
    const recommendations = this.mergeRecommendations(
      historicalRecommendation,
      contextRecommendation,
      domainRecommendation
    )
    
    // 7. 过滤和验证推荐
    const validatedRecommendations = await this.validateRecommendations(recommendations)
    
    console.log(`✅ Recommended ${validatedRecommendations.length} tools`)
    
    return validatedRecommendations
  }

  async analyzeTask(task: string): Promise<TaskFeatures> {
    const startTime = Date.now()
    
    // 提取关键词
    const keywords = this.extractKeywords(task)
    
    // 评估复杂度
    const complexity = this.assessComplexity(task)
    
    // 识别域名
    const domain = this.identifyDomain(task)
    
    // 识别所需工具
    const requiredTools = this.identifyRequiredTools(task)
    
    const analysisTime = Date.now() - startTime
    console.log(`⏱️  Task analysis completed in ${analysisTime}ms`)
    
    return {
      keywords,
      complexity,
      domain,
      requiredTools
    }
  }

  private extractKeywords(text: string): string[] {
    // 分词并移除停用词
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
    
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
      'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall'
    ])
    
    const keywords = words.filter(word => 
      !stopWords.has(word) && /[a-z]/.test(word)
    )
    
    // 去重并排序
    return Array.from(new Set(keywords))
  }

  private assessComplexity(task: string): 'low' | 'medium' | 'high' {
    // 基于任务长度评估复杂度
    const length = task.length
    
    // 基于技术术语评估复杂度
    const technicalTerms = this.extractKeywords(task).filter(word => 
      ['function', 'class', 'api', 'database', 'server', 'client', 
       'algorithm', 'optimization', 'architecture', 'framework'].includes(word)
    )
    
    // 基于任务结构评估复杂度
    const hasComplexStructure = task.includes('&&') || task.includes('||') || 
                               task.includes('if') || task.includes('then') ||
                               task.includes('for') || task.includes('while')
    
    // 综合评估
    if (length < 50 && technicalTerms.length < 2 && !hasComplexStructure) {
      return 'low'
    }
    
    if (length < 150 && technicalTerms.length < 4) {
      return 'medium'
    }
    
    return 'high'
  }

  private identifyDomain(task: string): string[] {
    const domains: string[] = []
    const keywords = this.extractKeywords(task)
    
    // 检查版本控制相关
    if (keywords.some(word => 
      ['git', 'commit', 'branch', 'push', 'pull', 'merge', 'rebase'].includes(word)
    )) {
      domains.push('version-control')
    }
    
    // 检查测试相关
    if (keywords.some(word => 
      ['test', 'unit', 'integration', 'e2e', 'jest', 'mocha', 'pytest'].includes(word)
    )) {
      domains.push('testing')
    }
    
    // 检查网络相关
    if (keywords.some(word => 
      ['http', 'api', 'rest', 'graphql', 'fetch', 'request', 'response'].includes(word)
    )) {
      domains.push('network')
    }
    
    // 检查文件系统相关
    if (keywords.some(word => 
      ['file', 'read', 'write', 'create', 'delete', 'directory', 'folder'].includes(word)
    )) {
      domains.push('file-system')
    }
    
    // 检查 shell 相关
    if (keywords.some(word => 
      ['bash', 'shell', 'command', 'script', 'terminal', 'cli'].includes(word)
    )) {
      domains.push('shell')
    }
    
    // 检查数据库相关
    if (keywords.some(word => 
      ['database', 'sql', 'nosql', 'query', 'schema', 'migration'].includes(word)
    )) {
      domains.push('database')
    }
    
    // 检查性能相关
    if (keywords.some(word => 
      ['performance', 'optimization', 'speed', 'memory', 'cpu', 'benchmark'].includes(word)
    )) {
      domains.push('performance')
    }
    
    // 检查安全相关
    if (keywords.some(word => 
      ['security', 'auth', 'authentication', 'authorization', 'encryption'].includes(word)
    )) {
      domains.push('security')
    }
    
    // 检查部署相关
    if (keywords.some(word => 
      ['deploy', 'docker', 'kubernetes', 'ci', 'cd', 'pipeline'].includes(word)
    )) {
      domains.push('deployment')
    }
    
    // 默认域名
    if (domains.length === 0) {
      domains.push('general')
    }
    
    return domains
  }

  private identifyRequiredTools(task: string): string[] {
    const tools: string[] = []
    const keywords = this.extractKeywords(task)
    
    // 基于关键词识别工具
    if (keywords.some(word => 
      ['git', 'commit', 'branch', 'push', 'pull', 'status', 'log'].includes(word)
    )) {
      tools.push('Bash', 'Git')
    }
    
    if (keywords.some(word => 
      ['read', 'write', 'edit', 'create', 'delete', 'modify'].includes(word)
    )) {
      tools.push('FileEdit')
    }
    
    if (keywords.some(word => 
      ['http', 'api', 'fetch', 'request', 'url', 'download'].includes(word)
    )) {
      tools.push('WebFetch')
    }
    
    if (keywords.some(word => 
      ['test', 'debug', 'analyze', 'review', 'refactor', 'optimize'].includes(word)
    )) {
      tools.push('Agent')
    }
    
    if (keywords.some(word => 
      ['search', 'find', 'grep', 'locate', 'grep', 'query'].includes(word)
    )) {
      tools.push('Search')
    }
    
    if (keywords.some(word => 
      ['shell', 'bash', 'command', 'execute', 'run'].includes(word)
    )) {
      tools.push('Bash')
    }
    
    if (keywords.some(word => 
      ['repl', 'interactive', 'console', 'shell'].includes(word)
    )) {
      tools.push('REPL')
    }
    
    if (keywords.some(word => 
      ['notebook', 'jupyter', 'python', 'execute', 'cell'].includes(word)
    )) {
      tools.push('NotebookEdit')
    }
    
    return tools
  }

  private async findSimilarTasks(features: TaskFeatures): Promise<TaskFeatures[]> {
    // 查找相似任务
    const similar: TaskFeatures[] = []
    
    // 基于上下文历史查找
    for (const context of this.contextHistory) {
      const similarity = this.calculateSimilarity(features, context.features)
      if (similarity > 0.7) {
        similar.push(context.features)
      }
    }
    
    return similar
  }

  private calculateSimilarity(features1: TaskFeatures, features2: TaskFeatures): number {
    // 计算特征相似度
    let similarity = 0
    
    // 关键词相似度
    const keywordSimilarity = this.calculateSetSimilarity(
      new Set(features1.keywords),
      new Set(features2.keywords)
    )
    similarity += keywordSimilarity * 0.3
    
    // 复杂度相似度
    const complexitySimilarity = features1.complexity === features2.complexity ? 1 : 0
    similarity += complexitySimilarity * 0.2
    
    // 域名相似度
    const domainSimilarity = this.calculateSetSimilarity(
      new Set(features1.domain),
      new Set(features2.domain)
    )
    similarity += domainSimilarity * 0.3
    
    // 工具相似度
    const toolSimilarity = this.calculateSetSimilarity(
      new Set(features1.requiredTools),
      new Set(features2.requiredTools)
    )
    similarity += toolSimilarity * 0.2
    
    return similarity
  }

  private calculateSetSimilarity(set1: Set<string>, set2: Set<string>): number {
    // 计算集合相似度（Jaccard 相似度）
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    if (union.size === 0) return 0
    
    return intersection.size / union.size
  }

  private async getHistoricalRecommendation(
    features: TaskFeatures, 
    similarTasks: TaskFeatures[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于使用模式推荐
    for (const [toolName, pattern] of this.usagePatterns) {
      const tool = this.tools.find(t => t.name === toolName)
      if (!tool) continue
      
      // 计算匹配分数
      const taskTypeMatch = pattern.taskTypes.includes(features.domain[0]) ? 1 : 0
      const successScore = pattern.successRate
      const usageScore = Math.min(pattern.usageCount / 100, 1)
      
      const score = (taskTypeMatch * 0.4 + successScore * 0.4 + usageScore * 0.2)
      
      if (score > 0.3) {
        recommendations.push({
          tool,
          score,
          reason: `Used ${pattern.usageCount} times with ${(pattern.successRate * 100).toFixed(1)}% success rate`,
          confidence: score
        })
      }
    }
    
    return recommendations
  }

  private async getContextRecommendation(
    context: Context, 
    features: TaskFeatures
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于当前上下文推荐
    const currentTools = context.availableTools || []
    
    for (const toolName of currentTools) {
      const tool = this.tools.find(t => t.name === toolName)
      if (!tool) continue
      
      // 检查工具是否适合当前任务
      const isSuitable = await this.isToolSuitable(tool, features)
      
      if (isSuitable) {
        recommendations.push({
          tool,
          score: 0.7,
          reason: 'Available in current context',
          confidence: 0.7
        })
      }
    }
    
    // 基于工作目录推荐
    const workingDir = context.workingDirectory || ''
    if (workingDir.includes('src') || workingDir.includes('lib')) {
      const codeTools = this.tools.filter(t => 
        ['FileEdit', 'Search', 'Agent'].includes(t.name)
      )
      
      for (const tool of codeTools) {
        recommendations.push({
          tool,
          score: 0.6,
          reason: 'Working in code directory',
          confidence: 0.6
        })
      }
    }
    
    return recommendations
  }

  private async getDomainRecommendation(features: TaskFeatures): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于域名模式推荐
    for (const domain of features.domain) {
      const pattern = this.domainPatterns.get(domain)
      if (!pattern) continue
      
      for (const toolName of pattern.preferredTools) {
        const tool = this.tools.find(t => t.name === toolName)
        if (!tool) continue
        
        recommendations.push({
          tool,
          score: 0.8,
          reason: `Preferred tool for ${domain} domain`,
          confidence: 0.8
        })
      }
    }
    
    return recommendations
  }

  private async isToolSuitable(tool: Tool, features: TaskFeatures): Promise<boolean> {
    // 检查工具是否适合任务
    const toolName = tool.name
    
    // 基于所需工具检查
    if (features.requiredTools.includes(toolName)) {
      return true
    }
    
    // 基于域名检查
    const domainToolMap: Record<string, string[]> = {
      'version-control': ['Bash', 'Git'],
      'testing': ['Bash', 'Agent'],
      'network': ['WebFetch', 'Bash'],
      'file-system': ['FileEdit', 'Bash', 'Search'],
      'shell': ['Bash', 'REPL'],
      'database': ['Bash', 'FileEdit', 'Agent'],
      'performance': ['Agent', 'Search', 'Bash'],
      'security': ['Agent', 'Search'],
      'deployment': ['Bash', 'FileEdit']
    }
    
    for (const domain of features.domain) {
      const suitableTools = domainToolMap[domain] || []
      if (suitableTools.includes(toolName)) {
        return true
      }
    }
    
    return false
  }

  private mergeRecommendations(...recommendationLists: Recommendation[][]): Recommendation[] {
    const merged = new Map<string, Recommendation>()
    
    for (const recommendations of recommendationLists) {
      for (const rec of recommendations) {
        const existing = merged.get(rec.tool.name)
        
        if (existing) {
          // 合并相同工具的推荐
          const newScore = Math.max(existing.score, rec.score)
          const newConfidence = (existing.confidence + rec.confidence) / 2
          
          merged.set(rec.tool.name, {
            ...existing,
            score: newScore,
            confidence: newConfidence
          })
        } else {
          merged.set(rec.tool.name, rec)
        }
      }
    }
    
    // 转换为数组并排序
    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
  }

  private async validateRecommendations(recommendations: Recommendation[]): Promise<Recommendation[]> {
    const validated: Recommendation[] = []
    
    for (const rec of recommendations) {
      // 检查工具是否可用
      const isAvailable = await this.checkToolAvailability(rec.tool)
      
      if (isAvailable) {
        // 调整置信度
        const adjustedConfidence = rec.confidence * 0.9
        
        validated.push({
          ...rec,
          confidence: adjustedConfidence
        })
      }
    }
    
    // 按调整后置信度排序
    return validated.sort((a, b) => b.confidence - a.confidence)
  }

  private async checkToolAvailability(tool: Tool): Promise<boolean> {
    // 检查工具是否可用
    try {
      // 检查工具是否启用
      if (!tool.isEnabled()) {
        return false
      }
      
      // 检查工具依赖
      const dependencies = await this.getToolDependencies(tool)
      for (const dep of dependencies) {
        if (!await this.isDependencyAvailable(dep)) {
          return false
        }
      }
      
      return true
      
    } catch (error) {
      console.error(`❌ Failed to check tool availability: ${tool.name}`, error)
      return false
    }
  }

  private async getToolDependencies(tool: Tool): Promise<string[]> {
    // 获取工具依赖
    const dependencyMap: Record<string, string[]> = {
      'WebFetch': ['network'],
      'Git': ['git'],
      'Bash': ['shell'],
      'REPL': ['node'],
      'NotebookEdit': ['python']
    }
    
    return dependencyMap[tool.name] || []
  }

  private async isDependencyAvailable(dependency: string): Promise<boolean> {
    // 检查依赖是否可用
    try {
      switch (dependency) {
        case 'network':
          return await this.checkNetworkConnectivity()
        case 'git':
          return await this.checkGitInstallation()
        case 'shell':
          return await this.checkShellAvailability()
        case 'node':
          return await this.checkNodeInstallation()
        case 'python':
          return await this.checkPythonInstallation()
        default:
          return true
      }
    } catch (error) {
      console.error(`❌ Failed to check dependency: ${dependency}`, error)
      return false
    }
  }

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const { WebFetchTool } = await import('./WebFetchTool')
      const tool = new WebFetchTool()
      
      const result = await tool.call({
        url: 'https://httpbin.org/get',
        timeout: 5000
      }, this.context)
      
      return result.success
    } catch {
      return false
    }
  }

  private async checkGitInstallation(): Promise<boolean> {
    try {
      const { BashTool } = await import('./BashTool')
      const tool = new BashTool()
      
      const result = await tool.call({
        command: 'git --version',
        timeout: 5000
      }, this.context)
      
      return result.success && result.stdout.includes('git version')
    } catch {
      return false
    }
  }

  private async checkShellAvailability(): Promise<boolean> {
    try {
      const { BashTool } = await import('./BashTool')
      const tool = new BashTool()
      
      const result = await tool.call({
        command: 'echo "test"',
        timeout: 5000
      }, this.context)
      
      return result.success
    } catch {
      return false
    }
  }

  private async checkNodeInstallation(): Promise<boolean> {
    try {
      const { BashTool } = await import('./BashTool')
      const tool = new BashTool()
      
      const result = await tool.call({
        command: 'node --version',
        timeout: 5000
      }, this.context)
      
      return result.success && result.stdout.includes('v')
    } catch {
      return false
    }
  }

  private async checkPythonInstallation(): Promise<boolean> {
    try {
      const { BashTool } = await import('./BashTool')
      const tool = new BashTool()
      
      const result = await tool.call({
        command: 'python --version',
        timeout: 5000
      }, this.context)
      
      return result.success && result.stdout.includes('Python')
    } catch {
      return false
    }
  }

  // 模式管理

  private initializePatterns(): void {
    // 初始化域名模式
    this.domainPatterns.set('version-control', {
      domain: 'version-control',
      preferredTools: ['Bash', 'Git'],
      commonSequences: [['Bash', 'Git'], ['Git', 'FileEdit']],
      avgComplexity: 0.4
    })
    
    this.domainPatterns.set('testing', {
      domain: 'testing',
      preferredTools: ['Bash', 'Agent'],
      commonSequences: [['Bash', 'Agent'], ['Agent', 'FileEdit']],
      avgComplexity: 0.6
    })
    
    this.domainPatterns.set('network', {
      domain: 'network',
      preferredTools: ['WebFetch', 'Bash'],
      commonSequences: [['WebFetch', 'FileEdit'], ['Bash', 'WebFetch']],
      avgComplexity: 0.5
    })
    
    this.domainPatterns.set('file-system', {
      domain: 'file-system',
      preferredTools: ['FileEdit', 'Search'],
      commonSequences: [['Search', 'FileEdit'], ['FileEdit', 'Bash']],
      avgComplexity: 0.3
    })
    
    // 初始化任务类型模式
    this.taskTypePatterns.set('code-generation', ['FileEdit', 'Agent'])
    this.taskTypePatterns.set('code-review', ['Agent', 'Search', 'FileEdit'])
    this.taskTypePatterns.set('testing', ['Bash', 'Agent'])
    this.taskTypePatterns.set('debugging', ['Agent', 'Bash', 'Search'])
    this.taskTypePatterns.set('refactoring', ['FileEdit', 'Agent', 'Search'])
  }

  async recordToolUsage(toolName: string, taskType: string, success: boolean, duration: number): Promise<void> {
    // 记录工具使用
    let pattern = this.usagePatterns.get(toolName)
    
    if (!pattern) {
      pattern = {
        tool: toolName,
        taskTypes: [],
        successRate: 0,
        avgDuration: 0,
        usageCount: 0
      }
      this.usagePatterns.set(toolName, pattern)
    }
    
    pattern.usageCount++
    
    if (!pattern.taskTypes.includes(taskType)) {
      pattern.taskTypes.push(taskType)
    }
    
    // 更新成功率
    const successfulUses = pattern.successRate * (pattern.usageCount - 1)
    pattern.successRate = (successfulUses + (success ? 1 : 0)) / pattern.usageCount
    
    // 更新平均持续时间
    const totalDuration = pattern.avgDuration * (pattern.usageCount - 1)
    pattern.avgDuration = (totalDuration + duration) / pattern.usageCount
    
    // 更新任务类型模式
    let taskPattern = this.taskTypePatterns.get(taskType)
    if (!taskPattern) {
      taskPattern = []
      this.taskTypePatterns.set(taskType, taskPattern)
    }
    
    if (!taskPattern.includes(toolName)) {
      taskPattern.push(toolName)
    }
  }

  getUsageStats(): Map<string, ToolUsagePattern> {
    return new Map(this.usagePatterns)
  }

  clearHistory(): void {
    this.contextHistory = []
    this.usagePatterns.clear()
    this.taskTypePatterns.clear()
  }

  // 性能监控

  getRecommendationStats(): RecommendationStats {
    const totalRecommendations = Array.from(this.usagePatterns.values())
      .reduce((sum, pattern) => sum + pattern.usageCount, 0)
    
    const averageConfidence = Array.from(this.usagePatterns.values())
      .reduce((sum, pattern) => sum + pattern.successRate, 0) / this.usagePatterns.size || 0
    
    return {
      totalRecommendations,
      uniqueTools: this.usagePatterns.size,
      averageConfidence,
      domainsCovered: this.domainPatterns.size
    }
  }
}

export interface Context {
  workingDirectory?: string
  availableTools?: string[]
  features?: TaskFeatures
  [key: string]: any
}

export interface RecommendationStats {
  totalRecommendations: number
  uniqueTools: number
  averageConfidence: number
  domainsCovered: number
}

// 使用示例
export class ToolRecommenderExamples {
  static async demonstrateRecommendation(): Promise<void> {
    console.log('🔍 Tool Recommendation Demo')
    
    // 创建工具实例
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
    
    // 创建推荐器
    const context: ToolContext = {
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
      logger: console,
      config: {}
    }
    
    const recommender = new ToolRecommender(tools, context)
    
    // 示例任务
    const tasks = [
      'Create a new React component',
      'Fix the bug in the login function',
      'Deploy the application to production',
      'Write unit tests for the API',
      'Search for TODO comments in the codebase'
    ]
    
    // 为每个任务获取推荐
    for (const task of tasks) {
      console.log(`\n📋 Task: ${task}`)
      
      const recommendations = await recommender.recommendTools({}, task)
      
      console.log(`🤖 Recommended tools:`)
      for (const rec of recommendations.slice(0, 3)) {
        console.log(`  - ${rec.tool.name} (confidence: ${(rec.confidence * 100).toFixed(1)}%): ${rec.reason}`)
      }
    }
    
    // 显示使用统计
    const stats = recommender.getRecommendationStats()
    console.log(`\n📊 Recommendation Stats:`)
    console.log(`  Total recommendations: ${stats.totalRecommendations}`)
    console.log(`  Unique tools: ${stats.uniqueTools}`)
    console.log(`  Average confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`)
  }
}