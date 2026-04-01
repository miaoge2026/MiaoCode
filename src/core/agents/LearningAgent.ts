import type { Agent, AgentConfig } from './Agent'
import type { Task } from './Task'
import type { TaskResult } from './TaskResult'
import { LRUCache } from '../../utils/LRUCache'
import { ObjectPool } from '../../utils/ObjectPool'
import { KnowledgeBase } from './KnowledgeBase'

export interface LearningAgentConfig extends AgentConfig {
  learningRate: number
  knowledgeRetention: number
  explorationRate: number
  enableMetaLearning: boolean
}

export interface Experience {
  task: Task
  result: TaskResult
  features: Record<string, number>
  timestamp: string
  reward: number
}

export interface LearningMetrics {
  totalExperiences: number
  knowledgeBaseSize: number
  averageReward: number
  learningRate: number
  explorationRate: number
  exploitationRate: number
  successfulLearning: number
  failedLearning: number
}

export class LearningAgent implements Agent {
  id: string
  type: string
  private config: LearningAgentConfig
  private knowledgeBase: KnowledgeBase
  private experiencePool: ObjectPool<Experience>
  private modelParameters: Map<string, number>
  private learningMetrics: LearningMetrics
  private currentTask: Task | null = null
  private taskStartTime: number = 0

  constructor(
    id: string,
    type: string,
    config: Partial<LearningAgentConfig> = {}
  ) {
    this.id = id
    this.type = type
    
    this.config = {
      learningRate: config.learningRate || 0.1,
      knowledgeRetention: config.knowledgeRetention || 1000,
      explorationRate: config.explorationRate || 0.2,
      enableMetaLearning: config.enableMetaLearning !== undefined ? config.enableMetaLearning : true,
      model: config.model || 'sonnet',
      maxIterations: config.maxIterations || 10,
      tools: config.tools || [],
      temperature: config.temperature
    }

    this.knowledgeBase = new KnowledgeBase(this.config.knowledgeRetention)
    this.experiencePool = new ObjectPool<Experience>(
      () => this.createEmptyExperience(),
      (exp) => this.resetExperience(exp),
      100
    )
    
    this.modelParameters = new Map()
    this.learningMetrics = this.createInitialMetrics()
    
    this.initializeModel()
  }

  async initialize(): Promise<void> {
    console.log(`🧠 Initializing Learning Agent: ${this.id}`)
    
    // 加载历史知识
    await this.loadKnowledge()
    
    // 预热学习系统
    await this.warmupLearning()
    
    console.log(`✅ Learning Agent initialized: ${this.id}`)
  }

  async execute(task: Task): Promise<TaskResult> {
    this.currentTask = task
    this.taskStartTime = Date.now()
    
    try {
      console.log(`🤖 Executing task: ${task.id} (type: ${task.type})`)

      // 1. 查找相似任务的经验
      const similarExperience = await this.findSimilarExperience(task)
      
      // 2. 基于经验制定策略
      const strategy = await this.developStrategy(task, similarExperience)
      
      // 3. 执行任务
      let result: TaskResult
      if (strategy.useKnownApproach && similarExperience) {
        // 使用已知方法
        result = await this.executeWithKnownApproach(task, similarExperience)
      } else {
        // 探索新方法
        result = await this.executeWithExploration(task, strategy)
      }
      
      // 4. 计算奖励
      const reward = this.calculateReward(result)
      
      // 5. 学习经验
      await this.learnFromExperience(task, result, reward)
      
      // 6. 更新模型参数
      await this.updateModelParameters(task, result, reward)
      
      // 7. 更新指标
      this.updateLearningMetrics(result, reward)
      
      console.log(`✅ Task completed: ${task.id} with reward: ${reward.toFixed(3)}`)
      
      return result

    } catch (error) {
      console.error(`❌ Task failed: ${task.id}`, error)
      
      const failedResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - this.taskStartTime
      }
      
      // 从失败中学习
      await this.learnFromFailure(task, failedResult, error)
      
      return failedResult
    } finally {
      this.currentTask = null
    }
  }

  async canHandle(taskType: string): Promise<boolean> {
    // 检查是否具备处理该任务类型的能力
    const capabilities = await this.getCapabilities()
    return capabilities.includes(taskType)
  }

  async getCapabilities(): Promise<string[]> {
    // 基于当前知识返回能力列表
    const knownTasks = this.knowledgeBase.getKnownTaskTypes()
    const baseCapabilities = ['general-purpose', 'learning', 'adaptation']
    
    return [...baseCapabilities, ...knownTasks]
  }

  async getCurrentLoad(): Promise<number> {
    // 如果有任务正在执行，返回高负载
    if (this.currentTask) {
      return 80
    }
    
    // 基于知识库大小和模型复杂度计算负载
    const knowledgeLoad = (this.knowledgeBase.size() / this.config.knowledgeRetention) * 100
    const modelLoad = (this.modelParameters.size / 1000) * 100
    
    return Math.max(knowledgeLoad, modelLoad, 0)
  }

  async updateConfig(newConfig: Partial<LearningAgentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig }
    
    // 重新初始化受影响的组件
    if (newConfig.knowledgeRetention) {
      await this.knowledgeBase.resize(newConfig.knowledgeRetention)
    }
    
    this.learningMetrics.configUpdates++
  }

  async reset(): Promise<void> {
    // 重置代理状态，但保留学习到的知识
    this.currentTask = null
    
    // 清理经验池
    this.experiencePool.clear()
  }

  async destroy(): Promise<void> {
    // 保存知识到持久化存储
    await this.saveKnowledge()
    
    // 清理资源
    this.knowledgeBase.clear()
    this.experiencePool.clear()
    this.modelParameters.clear()
  }

  getMetrics(): LearningMetrics {
    return { ...this.learningMetrics }
  }

  // 学习核心方法

  private async learnFromExperience(
    task: Task, 
    result: TaskResult, 
    reward: number
  ): Promise<void> {
    // 创建经验对象
    const experience = this.experiencePool.acquire()
    
    experience.task = { ...task }
    experience.result = { ...result }
    experience.features = await this.extractFeatures(task, result)
    experience.timestamp = new Date().toISOString()
    experience.reward = reward
    
    // 添加到知识库
    await this.knowledgeBase.addExperience(experience)
    
    // 释放经验对象
    this.experiencePool.release(experience)
    
    // 更新学习指标
    this.learningMetrics.totalExperiences++
  }

  private async learnFromFailure(
    task: Task, 
    result: TaskResult, 
    error: any
  ): Promise<void> {
    // 从失败中提取有价值的信息
    const failureExperience = this.experiencePool.acquire()
    
    failureExperience.task = { ...task }
    failureExperience.result = { ...result }
    failureExperience.features = {
      errorType: this.classifyError(error),
      taskComplexity: this.assessTaskComplexity(task),
      resourceUsage: this.calculateResourceUsage(result)
    }
    failureExperience.timestamp = new Date().toISOString()
    failureExperience.reward = -1 // 失败奖励为负
    
    await this.knowledgeBase.addExperience(failureExperience)
    this.experiencePool.release(failureExperience)
    
    // 更新模型以避免类似失败
    await this.updateModelForFailure(task, error)
  }

  private async findSimilarExperience(task: Task): Promise<Experience | undefined> {
    // 在知识库中查找相似任务的经验
    const similarityThreshold = 0.7
    
    return this.knowledgeBase.findSimilar(task, similarityThreshold)
  }

  private async developStrategy(
    task: Task, 
    similarExperience?: Experience
  ): Promise<ExecutionStrategy> {
    // 基于经验和探索率制定执行策略
    
    if (similarExperience && Math.random() > this.config.explorationRate) {
      // 利用已知经验
      return {
        useKnownApproach: true,
        approach: similarExperience.result.approach,
        confidence: similarExperience.reward > 0 ? 0.8 : 0.5,
        fallbackToExploration: true
      }
    } else {
      // 探索新方法
      return {
        useKnownApproach: false,
        approach: await this.generateNewApproach(task),
        confidence: 0.5,
        fallbackToExploration: false
      }
    }
  }

  private async executeWithKnownApproach(
    task: Task, 
    experience: Experience
  ): Promise<TaskResult> {
    // 使用已知方法执行任务
    const startTime = Date.now()
    
    try {
      // 复制并调整已知方法
      const approach = experience.result.approach
      const adjustedApproach = this.adjustApproach(approach, task)
      
      // 执行调整后的方法
      const result = await this.executeApproach(task, adjustedApproach)
      
      result.approach = adjustedApproach
      result.duration = Date.now() - startTime
      
      return result
      
    } catch (error) {
      // 如果已知方法失败，回退到探索
      console.warn(`Known approach failed for task: ${task.id}, falling back to exploration`)
      return this.executeWithExploration(task, {
        useKnownApproach: false,
        approach: await this.generateNewApproach(task),
        confidence: 0.3,
        fallbackToExploration: false
      })
    }
  }

  private async executeWithExploration(
    task: Task, 
    strategy: ExecutionStrategy
  ): Promise<TaskResult> {
    // 使用探索方法执行任务
    const startTime = Date.now()
    
    try {
      const result = await this.executeApproach(task, strategy.approach)
      
      result.approach = strategy.approach
      result.duration = Date.now() - startTime
      
      return result
      
    } catch (error) {
      // 探索失败
      const failedResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        approach: strategy.approach
      }
      
      return failedResult
    }
  }

  private calculateReward(result: TaskResult): number {
    if (!result.success) {
      return -1
    }
    
    // 基于多个因素计算奖励
    const successReward = 1.0
    const speedBonus = this.calculateSpeedBonus(result.duration)
    const efficiencyBonus = this.calculateEfficiencyBonus(result)
    const innovationBonus = result.approach?.isInnovative ? 0.2 : 0
    
    return successReward + speedBonus + efficiencyBonus + innovationBonus
  }

  private calculateSpeedBonus(duration: number): number {
    // 快速完成的奖励
    const targetTime = 5000 // 5秒
    const maxBonus = 0.3
    
    if (duration <= targetTime) {
      return maxBonus
    }
    
    const ratio = targetTime / duration
    return maxBonus * ratio
  }

  private calculateEfficiencyBonus(result: TaskResult): number {
    // 基于资源使用效率的奖励
    const maxBonus = 0.2
    
    if (result.resourceUsage) {
      const efficiency = 1 - (result.resourceUsage / 100)
      return maxBonus * efficiency
    }
    
    return 0
  }

  private async updateModelParameters(
    task: Task, 
    result: TaskResult, 
    reward: number
  ): Promise<void> {
    // 使用强化学习更新模型参数
    
    const features = await this.extractFeatures(task, result)
    
    for (const [feature, value] of Object.entries(features)) {
      const currentWeight = this.modelParameters.get(feature) || 0
      const update = this.config.learningRate * reward * value
      
      const newWeight = currentWeight + update
      
      // 应用权重衰减
      const decayedWeight = newWeight * 0.999
      
      this.modelParameters.set(feature, decayedWeight)
    }
    
    // 如果启用了元学习，更新学习率
    if (this.config.enableMetaLearning) {
      await this.updateLearningRate(reward)
    }
  }

  private async updateModelForFailure(task: Task, error: any): Promise<void> {
    // 从失败中更新模型
    
    const errorType = this.classifyError(error)
    const featureKey = `error-${errorType}`
    
    // 降低导致失败的参数的权重
    const currentWeight = this.modelParameters.get(featureKey) || 0
    const penalty = -0.5 * this.config.learningRate
    
    this.modelParameters.set(featureKey, currentWeight + penalty)
  }

  private async updateLearningRate(reward: number): Promise<void> {
    // 根据奖励动态调整学习率
    
    if (reward > 0.8) {
      // 高奖励时降低学习率（收敛）
      this.config.learningRate *= 0.99
    } else if (reward < 0.3) {
      // 低奖励时增加学习率（探索）
      this.config.learningRate = Math.min(this.config.learningRate * 1.01, 0.5)
    }
    
    // 根据成功率调整探索率
    const successRate = this.learningMetrics.successRate
    if (successRate > 70) {
      // 高成功率时减少探索
      this.config.explorationRate *= 0.99
    } else if (successRate < 30) {
      // 低成功率时增加探索
      this.config.explorationRate = Math.min(this.config.explorationRate * 1.01, 0.5)
    }
  }

  private async extractFeatures(task: Task, result: TaskResult): Promise<Record<string, number>> {
    // 提取任务特征用于学习
    
    return {
      taskComplexity: this.assessTaskComplexity(task),
      taskType: this.encodeTaskType(task.type),
      toolCount: task.tools?.length || 0,
      duration: result.duration / 1000, // 转换为秒
      success: result.success ? 1 : 0,
      errorCount: result.error ? 1 : 0,
      resourceUsage: result.resourceUsage || 0
    }
  }

  private assessTaskComplexity(task: Task): number {
    // 评估任务复杂度
    const descriptionLength = task.description.length
    const toolCount = task.tools?.length || 0
    
    if (descriptionLength < 50 && toolCount < 2) return 0.3
    if (descriptionLength < 150 && toolCount < 4) return 0.5
    if (descriptionLength < 300 && toolCount < 6) return 0.7
    
    return 0.9
  }

  private encodeTaskType(taskType: string): number {
    // 编码任务类型为数字
    const typeMap: Record<string, number> = {
      'warmup': 0.1,
      'code-review': 0.3,
      'documentation': 0.4,
      'testing': 0.5,
      'refactoring': 0.6,
      'bug-fixing': 0.7,
      'general-purpose': 0.2
    }
    
    return typeMap[taskType] || 0.5
  }

  private classifyError(error: any): string {
    // 分类错误类型
    const message = error instanceof Error ? error.message : String(error)
    
    if (message.includes('timeout')) return 'timeout'
    if (message.includes('memory')) return 'memory'
    if (message.includes('permission')) return 'permission'
    if (message.includes('network')) return 'network'
    if (message.includes('syntax')) return 'syntax'
    if (message.includes('type')) return 'type'
    
    return 'unknown'
  }

  private assessTaskComplexity(task: Task): number {
    // 评估任务复杂度
    const descriptionLength = task.description.length
    const requiredTools = task.tools?.length || 0
    
    let complexity = descriptionLength / 1000 // 基础复杂度
    complexity += requiredTools * 0.1 // 工具增加复杂度
    
    return Math.min(complexity, 1)
  }

  private calculateResourceUsage(result: TaskResult): number {
    // 计算资源使用
    if (!result.resourceUsage) return 0
    
    return Math.min(result.resourceUsage / 100, 1)
  }

  private async generateNewApproach(task: Task): Promise<any> {
    // 生成新的执行方法
    const baseApproaches = [
      { name: 'iterative', steps: ['analyze', 'plan', 'execute', 'verify'] },
      { name: 'recursive', steps: ['divide', 'conquer', 'combine'] },
      { name: 'parallel', steps: ['prepare', 'execute-parallel', 'collect'] },
      { name: 'incremental', steps: ['initialize', 'increment', 'validate'] }
    ]
    
    // 根据任务类型选择基础方法
    const suitableApproaches = baseApproaches.filter(approach => 
      this.isApproachSuitable(approach, task)
    )
    
    // 随机选择一个方法并添加变化
    const baseApproach = suitableApproaches[Math.floor(Math.random() * suitableApproaches.length)]
    const variation = this.createVariation(baseApproach)
    
    return {
      ...variation,
      isInnovative: true,
      confidence: 0.5,
      timestamp: new Date().toISOString()
    }
  }

  private isApproachSuitable(approach: any, task: Task): boolean {
    // 检查方法是否适合任务
    const taskComplexity = this.assessTaskComplexity(task)
    
    if (taskComplexity > 0.8 && approach.name === 'iterative') return true
    if (taskComplexity < 0.5 && approach.name === 'incremental') return true
    if (task.tools && task.tools.length > 3 && approach.name === 'parallel') return true
    
    return true // 默认都适合
  }

  private createVariation(approach: any): any {
    // 创建方法的变化版本
    const steps = [...approach.steps]
    
    // 随机添加额外步骤
    if (Math.random() > 0.5) {
      steps.push('optimize')
    }
    
    // 随机调整步骤顺序
    if (Math.random() > 0.7) {
      steps.reverse()
    }
    
    return {
      ...approach,
      steps,
      variation: Math.random()
    }
  }

  private adjustApproach(approach: any, task: Task): any {
    // 根据任务调整方法
    const taskComplexity = this.assessTaskComplexity(task)
    
    if (taskComplexity > 0.8) {
      // 复杂任务增加验证步骤
      approach.steps.push('validate', 'review')
    } else if (taskComplexity < 0.3) {
      // 简单任务简化步骤
      approach.steps = approach.steps.filter((step: string) => 
        !['validate', 'review'].includes(step)
      )
    }
    
    return approach
  }

  private async executeApproach(task: Task, approach: any): Promise<TaskResult> {
    // 执行方法
    const startTime = Date.now()
    const steps = approach.steps || []
    
    const result: TaskResult = {
      taskId: task.id,
      success: true,
      steps: [],
      duration: 0,
      approach: approach
    }
    
    for (const step of steps) {
      const stepResult = await this.executeStep(step, task)
      result.steps.push(stepResult)
      
      if (!stepResult.success) {
        result.success = false
        result.error = `Step '${step}' failed`
        break
      }
    }
    
    result.duration = Date.now() - startTime
    
    return result
  }

  private async executeStep(step: string, task: Task): Promise<any> {
    // 执行单个步骤
    const stepStartTime = Date.now()
    
    try {
      // 模拟步骤执行
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return {
        step,
        success: true,
        duration: Date.now() - stepStartTime
      }
      
    } catch (error) {
      return {
        step,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - stepStartTime
      }
    }
  }

  private async loadKnowledge(): Promise<void> {
    // 从持久化存储加载知识
    try {
      const fs = await import('fs/promises')
      const knowledgeFile = `./data/knowledge-${this.id}.json`
      
      try {
        const data = await fs.readFile(knowledgeFile, 'utf-8')
        const knowledge = JSON.parse(data)
        
        await this.knowledgeBase.import(knowledge)
        console.log(`📚 Loaded knowledge for agent: ${this.id}`)
        
      } catch (error) {
        console.log(`📚 No existing knowledge for agent: ${this.id}`)
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to load knowledge: ${error}`)
    }
  }

  private async saveKnowledge(): Promise<void> {
    // 保存知识到持久化存储
    try {
      const fs = await import('fs/promises')
      const dataDir = './data'
      
      // 确保数据目录存在
      try {
        await fs.access(dataDir)
      } catch {
        await fs.mkdir(dataDir, { recursive: true })
      }
      
      const knowledgeFile = `${dataDir}/knowledge-${this.id}.json`
      const knowledge = await this.knowledgeBase.export()
      
      await fs.writeFile(knowledgeFile, JSON.stringify(knowledge, null, 2))
      console.log(`💾 Saved knowledge for agent: ${this.id}`)
      
    } catch (error) {
      console.warn(`⚠️ Failed to save knowledge: ${error}`)
    }
  }

  private async warmupLearning(): Promise<void> {
    // 预热学习系统
    console.log(`🔥 Warming up learning system for agent: ${this.id}`)
    
    // 生成一些初始经验
    const warmupTasks = [
      {
        type: 'warmup',
        description: 'Simple warmup task',
        input: {},
        priority: 1,
        timeout: 30000
      }
    ]
    
    for (const taskData of warmupTasks) {
      const task: Task = {
        id: `warmup-${Date.now()}`,
        ...taskData
      }
      
      const result = await this.execute(task)
      
      if (result.success) {
        console.log(`✅ Warmup task completed: ${task.id}`)
      }
    }
  }

  private createEmptyExperience(): Experience {
    return {
      task: {} as Task,
      result: {} as TaskResult,
      features: {},
      timestamp: '',
      reward: 0
    }
  }

  private resetExperience(experience: Experience): void {
    experience.task = {} as Task
    experience.result = {} as TaskResult
    experience.features = {}
    experience.timestamp = ''
    experience.reward = 0
  }

  private updateLearningMetrics(result: TaskResult, reward: number): void {
    this.learningMetrics.totalExperiences++
    
    if (reward > 0) {
      this.learningMetrics.successfulLearning++
    } else {
      this.learningMetrics.failedLearning++
    }
    
    // 计算平均奖励
    const totalRewards = this.learningMetrics.successfulLearning - this.learningMetrics.failedLearning
    this.learningMetrics.averageReward = totalRewards / this.learningMetrics.totalExperiences
    
    // 更新知识库大小
    this.learningMetrics.knowledgeBaseSize = this.knowledgeBase.size()
    
    // 计算探索/利用比率
    this.learningMetrics.explorationRate = this.config.explorationRate
    this.learningMetrics.exploitationRate = 1 - this.config.explorationRate
  }

  private createInitialMetrics(): LearningMetrics {
    return {
      totalExperiences: 0,
      knowledgeBaseSize: 0,
      averageReward: 0,
      learningRate: this.config.learningRate,
      explorationRate: this.config.explorationRate,
      exploitationRate: 1 - this.config.explorationRate,
      successfulLearning: 0,
      failedLearning: 0,
      configUpdates: 0
    }
  }

  private initializeModel(): void {
    // 初始化模型参数
    const initialParams = [
      'taskComplexity',
      'taskType',
      'toolCount',
      'duration',
      'success',
      'errorCount',
      'resourceUsage'
    ]
    
    for (const param of initialParams) {
      this.modelParameters.set(param, Math.random() * 0.1) // 小的随机初始值
    }
  }
}

interface ExecutionStrategy {
  useKnownApproach: boolean
  approach: any
  confidence: number
  fallbackToExploration: boolean
}