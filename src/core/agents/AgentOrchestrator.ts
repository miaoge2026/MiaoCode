import type { Agent } from './Agent'
import type { Task } from './Task'
import type { TaskResult } from './TaskResult'
import type { AgentDefinition } from './AgentDefinition'
import { LRUCache } from '../../utils/LRUCache'
import { ObjectPool } from '../../utils/ObjectPool'

export class AgentOrchestrator {
  private agents = new Map<string, Agent>()
  private taskQueue: Task[] = []
  private runningTasks = new Set<string>()
  private taskHistory = new LRUCache<string, TaskResult>(1000)
  private agentPool: ObjectPool<Agent>
  private metrics = new Map<string, AgentMetrics>()

  constructor(private config: OrchestratorConfig) {
    // 创建代理对象池
    this.agentPool = new ObjectPool<Agent>(
      () => this.createAgent(),
      (agent) => this.resetAgent(agent),
      config.maxConcurrentAgents
    )
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Agent Orchestrator...')
    
    // 预加载核心代理
    for (const agentType of this.config.preloadAgents) {
      await this.createAgent(agentType)
    }
    
    // 启动任务处理队列
    this.startTaskProcessor()
    
    console.log('✅ Agent Orchestrator initialized')
  }

  async registerAgent(definition: AgentDefinition): Promise<string> {
    const agentId = this.generateAgentId()
    const agent = await this.createAgent(definition.type, definition)
    
    this.agents.set(agentId, agent)
    this.metrics.set(agentId, this.createInitialMetrics())
    
    console.log(`🤖 Registered agent: ${agentId} (${definition.type})`)
    
    return agentId
  }

  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    // 停止正在运行的任务
    await this.stopAgentTasks(agentId)
    
    // 释放代理资源
    if (typeof agent.destroy === 'function') {
      await agent.destroy()
    }
    
    this.agents.delete(agentId)
    this.metrics.delete(agentId)
    
    console.log(`🤖 Unregistered agent: ${agentId}`)
    
    return true
  }

  async executeTask(task: Task): Promise<string> {
    const taskId = this.generateTaskId()
    task.id = taskId
    
    // 检查代理可用性
    const suitableAgents = await this.findSuitableAgents(task)
    if (suitableAgents.length === 0) {
      throw new Error(`No suitable agent found for task: ${task.type}`)
    }
    
    // 添加到任务队列
    this.taskQueue.push(task)
    this.runningTasks.add(taskId)
    
    // 异步执行任务
    this.executeTaskAsync(task, suitableAgents[0])
    
    return taskId
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const task = this.taskQueue.find(t => t.id === taskId)
    if (task) {
      return {
        taskId,
        status: 'queued',
        position: this.taskQueue.indexOf(task) + 1,
        estimatedTime: this.estimateTaskTime(task)
      }
    }
    
    const result = this.taskHistory.get(taskId)
    if (result) {
      return {
        taskId,
        status: result.success ? 'completed' : 'failed',
        result: result,
        completedAt: result.completedAt
      }
    }
    
    if (this.runningTasks.has(taskId)) {
      return {
        taskId,
        status: 'running',
        estimatedTime: this.getRunningTaskETA(taskId)
      }
    }
    
    return {
      taskId,
      status: 'not_found'
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const taskIndex = this.taskQueue.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      // 从队列中移除
      this.taskQueue.splice(taskIndex, 1)
      this.runningTasks.delete(taskId)
      
      console.log(`✅ Task cancelled: ${taskId}`)
      return true
    }
    
    // 检查是否正在运行
    if (this.runningTasks.has(taskId)) {
      await this.stopTask(taskId)
      this.runningTasks.delete(taskId)
      
      console.log(`✅ Running task cancelled: ${taskId}`)
      return true
    }
    
    return false
  }

  async waitForTask(taskId: string, timeout = 300000): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        const status = await this.getTaskStatus(taskId)
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
          resolve(status.result!)
        } else if (status.status === 'not_found') {
          clearInterval(interval)
          reject(new Error(`Task not found: ${taskId}`))
        }
      }
      
      const interval = setInterval(checkStatus, 1000)
      
      // 超时处理
      setTimeout(() => {
        clearInterval(interval)
        reject(new Error(`Task timeout: ${taskId}`))
      }, timeout)
    })
  }

  async getAgentMetrics(agentId?: string): Promise<AgentMetrics | GlobalMetrics> {
    if (agentId) {
      return this.metrics.get(agentId) || this.createInitialMetrics()
    }
    
    return this.getGlobalMetrics()
  }

  async updateAgentConfig(agentId: string, config: Partial<AgentConfig>): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    
    // 更新代理配置
    if (typeof agent.updateConfig === 'function') {
      await agent.updateConfig(config)
    }
    
    // 更新指标
    const metrics = this.metrics.get(agentId)
    if (metrics) {
      metrics.configUpdates++
    }
    
    return true
  }

  async scaleAgents(count: number): Promise<void> {
    const currentCount = this.agents.size
    
    if (count > currentCount) {
      // 增加代理
      const toAdd = count - currentCount
      for (let i = 0; i < toAdd; i++) {
        const agentId = await this.registerAgent({
          type: 'general-purpose',
          description: `Auto-scaled agent ${i + 1}`,
          prompt: 'You are a helpful AI assistant.',
          tools: ['Bash', 'FileEdit', 'Search'],
          model: 'sonnet',
          maxIterations: 10
        })
        
        // 预热代理
        await this.warmupAgent(agentId)
      }
    } else if (count < currentCount) {
      // 减少代理
      const toRemove = currentCount - count
      const agentIds = Array.from(this.agents.keys())
      
      for (let i = 0; i < toRemove; i++) {
        await this.unregisterAgent(agentIds[i])
      }
    }
    
    console.log(`🤖 Scaled agents from ${currentCount} to ${count}`)
  }

  // 私有方法

  private async createAgent(type = 'general-purpose', definition?: AgentDefinition): Promise<Agent> {
    const agent = this.agentPool.acquire()
    
    // 配置代理
    if (definition) {
      agent.initialize(definition)
    }
    
    return agent
  }

  private resetAgent(agent: Agent): void {
    // 重置代理状态
    agent.reset()
  }

  private async findSuitableAgents(task: Task): Promise<Agent[]> {
    const candidates: Agent[] = []
    
    for (const [agentId, agent] of this.agents) {
      if (await this.canAgentHandleTask(agent, task)) {
        candidates.push(agent)
      }
    }
    
    // 按性能排序
    candidates.sort((a, b) => this.getAgentScore(b) - this.getAgentScore(a))
    
    return candidates.slice(0, this.config.maxAgentCandidates)
  }

  private async canAgentHandleTask(agent: Agent, task: Task): Promise<boolean> {
    // 检查代理类型
    if (!agent.canHandle(task.type)) {
      return false
    }
    
    // 检查工具可用性
    const requiredTools = this.getRequiredTools(task)
    const availableTools = await agent.getAvailableTools()
    
    const hasRequiredTools = requiredTools.every(tool => 
      availableTools.includes(tool)
    )
    
    if (!hasRequiredTools) {
      return false
    }
    
    // 检查负载
    const currentLoad = await agent.getCurrentLoad()
    if (currentLoad >= this.config.maxAgentLoad) {
      return false
    }
    
    return true
  }

  private getAgentScore(agent: Agent): number {
    const metrics = this.metrics.get(agent.id)
    if (!metrics) return 0
    
    // 基于成功率、响应时间、负载计算分数
    const successWeight = 0.4
    const speedWeight = 0.3
    const loadWeight = 0.3
    
    const successScore = metrics.successRate * successWeight
    const speedScore = (1000 / Math.max(metrics.avgResponseTime, 1)) * speedWeight
    const loadScore = (1 - metrics.currentLoad / 100) * loadWeight
    
    return successScore + speedScore + loadScore
  }

  private async executeTaskAsync(task: Task, agent: Agent): Promise<void> {
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Executing task: ${task.id} with agent: ${agent.id}`)
      
      // 更新代理负载
      await this.updateAgentLoad(agent.id, 1)
      
      // 执行任务
      const result = await agent.execute(task)
      
      // 计算执行时间
      const duration = Date.now() - startTime
      
      // 更新任务结果
      result.duration = duration
      result.completedAt = new Date().toISOString()
      
      // 存储结果
      this.taskHistory.set(task.id, result)
      
      // 更新代理指标
      await this.updateAgentMetrics(agent.id, result, duration)
      
      console.log(`✅ Task completed: ${task.id} in ${duration}ms`)
      
    } catch (error) {
      console.error(`❌ Task failed: ${task.id}`, error)
      
      // 记录失败结果
      const failedResult: TaskResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        completedAt: new Date().toISOString()
      }
      
      this.taskHistory.set(task.id, failedResult)
      await this.updateAgentMetrics(agent.id, failedResult, Date.now() - startTime)
      
    } finally {
      // 清理
      this.runningTasks.delete(task.id)
      this.taskQueue = this.taskQueue.filter(t => t.id !== task.id)
      await this.updateAgentLoad(agent.id, -1)
      
      // 释放代理
      this.agentPool.release(agent)
    }
  }

  private startTaskProcessor(): void {
    setInterval(async () => {
      if (this.taskQueue.length > 0) {
        const availableAgents = await this.getAvailableAgents()
        
        for (const agent of availableAgents) {
          if (this.taskQueue.length === 0) break
          
          const task = this.taskQueue[0] // 获取队列中的第一个任务
          const suitable = await this.canAgentHandleTask(agent, task)
          
          if (suitable) {
            // 从队列中移除并执行
            this.taskQueue.shift()
            this.executeTaskAsync(task, agent)
          }
        }
      }
    }, 1000) // 每秒检查一次
  }

  private async getAvailableAgents(): Promise<Agent[]> {
    const available: Agent[] = []
    
    for (const [agentId, agent] of this.agents) {
      const load = await agent.getCurrentLoad()
      if (load < this.config.maxAgentLoad) {
        available.push(agent)
      }
    }
    
    return available
  }

  private async warmupAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return
    
    console.log(`🔥 Warming up agent: ${agentId}`)
    
    // 执行简单的预热任务
    const warmupTask: Task = {
      id: `warmup-${agentId}`,
      type: 'warmup',
      description: 'Warmup task',
      input: {},
      priority: 1,
      timeout: 30000
    }
    
    try {
      await agent.execute(warmupTask)
      console.log(`✅ Agent warmed up: ${agentId}`)
    } catch (error) {
      console.error(`❌ Agent warmup failed: ${agentId}`, error)
    }
  }

  // 工具方法

  private generateAgentId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getRequiredTools(task: Task): string[] {
    // 基于任务类型确定所需工具
    const toolMap: Record<string, string[]> = {
      'code-review': ['FileEdit', 'Search', 'Bash'],
      'documentation': ['FileEdit', 'WebFetch'],
      'testing': ['Bash', 'FileEdit'],
      'refactoring': ['FileEdit', 'Search'],
      'bug-fixing': ['Bash', 'FileEdit', 'Search'],
      'warmup': []
    }
    
    return toolMap[task.type] || ['Bash']
  }

  private estimateTaskTime(task: Task): number {
    // 基于历史数据估算任务时间
    const history = this.taskHistory.get(task.type)
    if (history) {
      return history.avgDuration || this.config.defaultTaskTime
    }
    
    return this.config.defaultTaskTime
  }

  private getRunningTaskETA(taskId: string): number {
    // 估算运行中任务的剩余时间
    const result = this.taskHistory.get(taskId)
    if (result && result.duration) {
      return result.duration
    }
    
    return this.config.defaultTaskTime
  }

  private async updateAgentLoad(agentId: string, delta: number): Promise<void> {
    const metrics = this.metrics.get(agentId)
    if (metrics) {
      metrics.currentLoad = Math.max(0, Math.min(100, metrics.currentLoad + delta))
    }
  }

  private async updateAgentMetrics(
    agentId: string, 
    result: TaskResult, 
    duration: number
  ): Promise<void> {
    const metrics = this.metrics.get(agentId)
    if (!metrics) return
    
    metrics.totalTasks++
    metrics.totalDuration += duration
    
    if (result.success) {
      metrics.successfulTasks++
    } else {
      metrics.failedTasks++
    }
    
    metrics.avgResponseTime = metrics.totalDuration / metrics.totalTasks
    metrics.successRate = (metrics.successfulTasks / metrics.totalTasks) * 100
    
    // 更新最后活动时间
    metrics.lastActivity = new Date().toISOString()
  }

  private async stopAgentTasks(agentId: string): Promise<void> {
    // 停止该代理的所有运行中任务
    const runningTasks = Array.from(this.runningTasks)
    
    for (const taskId of runningTasks) {
      const task = this.taskQueue.find(t => t.id === taskId)
      if (task && task.agentId === agentId) {
        await this.cancelTask(taskId)
      }
    }
  }

  private async stopTask(taskId: string): Promise<void> {
    // 停止特定任务
    // 这里可以实现任务停止的逻辑
    console.log(`⏹️ Stopping task: ${taskId}`)
  }

  private createInitialMetrics(): AgentMetrics {
    return {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalDuration: 0,
      avgResponseTime: 0,
      successRate: 0,
      currentLoad: 0,
      configUpdates: 0,
      lastActivity: new Date().toISOString()
    }
  }

  private async getGlobalMetrics(): Promise<GlobalMetrics> {
    const globalMetrics: GlobalMetrics = {
      totalAgents: this.agents.size,
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      avgResponseTime: 0,
      successRate: 0,
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size
    }
    
    let totalDuration = 0
    
    for (const metrics of this.metrics.values()) {
      globalMetrics.totalTasks += metrics.totalTasks
      globalMetrics.successfulTasks += metrics.successfulTasks
      globalMetrics.failedTasks += metrics.failedTasks
      totalDuration += metrics.totalDuration
    }
    
    if (globalMetrics.totalTasks > 0) {
      globalMetrics.avgResponseTime = totalDuration / globalMetrics.totalTasks
      globalMetrics.successRate = (globalMetrics.successfulTasks / globalMetrics.totalTasks) * 100
    }
    
    return globalMetrics
  }
}

export interface OrchestratorConfig {
  maxConcurrentAgents: number
  maxAgentCandidates: number
  maxAgentLoad: number
  preloadAgents: string[]
  defaultTaskTime: number
}

export interface AgentConfig {
  type: string
  model: string
  maxIterations: number
  tools: string[]
  temperature?: number
}

export interface AgentMetrics {
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  totalDuration: number
  avgResponseTime: number
  successRate: number
  currentLoad: number
  configUpdates: number
  lastActivity: string
}

export interface GlobalMetrics {
  totalAgents: number
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  avgResponseTime: number
  successRate: number
  queuedTasks: number
  runningTasks: number
}

export interface TaskStatus {
  taskId: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'not_found' | 'cancelled'
  position?: number
  estimatedTime?: number
  result?: TaskResult
  completedAt?: string
}