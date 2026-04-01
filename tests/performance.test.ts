/**
 * MiaoCode 性能优化测试
 * 测试性能优化系统的正确性和性能提升效果
 */

import { LazyToolRegistry } from '@/core/tools/LazyToolRegistry'
import { ParallelInitializer } from '@/core/initializer/ParallelInitializer'
import { ObjectPool } from '@/utils/ObjectPool'
import { LRUCache } from '@/utils/LRUCache'
import { AgentOrchestrator } from '@/core/agents/AgentOrchestrator'
import { LearningAgent } from '@/core/agents/LearningAgent'
import type { ToolContext } from '@/types/context'

// 模拟工具上下文
const mockContext: ToolContext = {
  cwd: process.cwd(),
  env: process.env as Record<string, string>,
  logger: console,
  config: {}
}

describe('🚀 Performance Optimization Tests', () => {
  describe('LazyToolRegistry', () => {
    let registry: LazyToolRegistry

    beforeEach(() => {
      registry = new LazyToolRegistry(mockContext)
    })

    it('should lazily load tools on demand', async () => {
      const startTime = Date.now()
      const tool = await registry.getTool('Bash')
      const loadTime = Date.now() - startTime

      expect(tool).toBeDefined()
      expect(loadTime).toBeLessThan(100) // 懒加载应该很快
    })

    it('should cache loaded tools', async () => {
      const tool1 = await registry.getTool('Bash')
      const tool2 = await registry.getTool('Bash')

      expect(tool1).toBe(tool2) // 应该是同一个实例
    })

    it('should handle concurrent tool loading', async () => {
      const promises = Promise.all([
        registry.getTool('Bash'),
        registry.getTool('FileEdit'),
        registry.getTool('Search')
      ])

      const tools = await promises
      expect(tools).toHaveLength(3)
      expect(tools.every(tool => tool !== undefined)).toBe(true)
    })
  })

  describe('ParallelInitializer', () => {
    let initializer: ParallelInitializer

    beforeEach(() => {
      initializer = new ParallelInitializer(mockContext)
    })

    it('should initialize all modules in parallel', async () => {
      const startTime = Date.now()
      await initializer.initialize()
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(3000) // 并行初始化应该很快
    })

    it('should provide initialization metrics', async () => {
      await initializer.initialize()
      const metrics = await initializer.getInitializationMetrics()

      expect(metrics.duration).toBeDefined()
      expect(metrics.toolCount).toBeGreaterThan(0)
      expect(metrics.cacheSize).toBeGreaterThan(0)
    })
  })

  describe('ObjectPool', () => {
    let pool: ObjectPool<any>

    beforeEach(() => {
      pool = new ObjectPool(
        () => ({ id: Math.random(), timestamp: Date.now() }),
        (obj) => { obj.id = Math.random(); obj.timestamp = Date.now() },
        10
      )
    })

    it('should reuse objects from pool', () => {
      const obj1 = pool.acquire()
      pool.release(obj1)
      const obj2 = pool.acquire()

      expect(obj1).toBe(obj2) // 应该是同一个对象
    })

    it('should create new objects when pool is empty', () => {
      const objects = []
      for (let i = 0; i < 15; i++) {
        objects.push(pool.acquire())
      }

      expect(objects.length).toBe(15)
      // 检查是否有重复（池大小是10，所以应该有重复）
      const uniqueObjects = new Set(objects)
      expect(uniqueObjects.size).toBeLessThan(15)
    })

    it('should provide performance statistics', () => {
      for (let i = 0; i < 20; i++) {
        const obj = pool.acquire()
        pool.release(obj)
      }

      const stats = pool.getStats()
      expect(stats.poolSize).toBeLessThanOrEqual(10)
      expect(stats.createdCount).toBeGreaterThan(0)
      expect(stats.reusedCount).toBeGreaterThan(0)
      expect(stats.hitRate).toBeGreaterThan(0)
    })
  })

  describe('LRUCache', () => {
    let cache: LRUCache<string, any>

    beforeEach(() => {
      cache = new LRUCache(100, 60000) // 1分钟TTL
    })

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      const value = cache.get('key1')

      expect(value).toBe('value1')
    })

    it('should evict least recently used items', () => {
      // 填满缓存
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      // 添加一个新项，应该触发淘汰
      cache.set('key101', 'value101')

      // 第一个键应该被淘汰
      expect(cache.get('key0')).toBeUndefined()
      // 新键应该存在
      expect(cache.get('key101')).toBe('value101')
    })

    it('should respect TTL', (done) => {
      cache.set('key1', 'value1', 100) // 100ms TTL

      setTimeout(() => {
        const value = cache.get('key1')
        expect(value).toBeUndefined()
        done()
      }, 150)
    })

    it('should provide cache statistics', () => {
      // 添加一些数据
      for (let i = 0; i < 50; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      // 访问一些键
      for (let i = 0; i < 20; i++) {
        cache.get(`key${i}`)
      }

      const stats = cache.getStats()
      expect(stats.size).toBe(50)
      expect(stats.hitRate).toBeGreaterThan(0)
    })
  })
})

describe('🤖 Intelligent Agent Tests', () => {
  describe('AgentOrchestrator', () => {
    let orchestrator: AgentOrchestrator

    beforeEach(async () => {
      orchestrator = new AgentOrchestrator({
        maxConcurrentAgents: 5,
        maxAgentCandidates: 3,
        maxAgentLoad: 80,
        preloadAgents: ['general-purpose'],
        defaultTaskTime: 30000
      })
      await orchestrator.initialize()
    })

    it('should register and execute agents', async () => {
      const agentId = await orchestrator.registerAgent({
        type: 'code-reviewer',
        description: 'Reviews code quality',
        prompt: 'You are a code reviewer.',
        tools: ['Bash', 'FileEdit'],
        model: 'sonnet',
        maxIterations: 5
      })

      expect(agentId).toBeDefined()

      const task = {
        id: 'test-task',
        type: 'code-review',
        description: 'Review test code',
        input: {},
        priority: 1,
        timeout: 30000
      }

      const taskId = await orchestrator.executeTask(task)
      expect(taskId).toBeDefined()

      // 等待任务完成
      const result = await orchestrator.waitForTask(taskId, 5000)
      expect(result).toBeDefined()
    })

    it('should balance load across agents', async () => {
      // 注册多个代理
      const agentIds = []
      for (let i = 0; i < 3; i++) {
        const agentId = await orchestrator.registerAgent({
          type: 'general-purpose',
          description: `Test agent ${i}`,
          prompt: 'You are a helpful assistant.',
          tools: ['Bash'],
          model: 'sonnet',
          maxIterations: 3
        })
        agentIds.push(agentId)
      }

      // 获取负载指标
      const metrics = await orchestrator.getAgentMetrics() as any
      expect(metrics.totalAgents).toBe(4) // 1 preloaded + 3 new
    })
  })

  describe('LearningAgent', () => {
    let agent: LearningAgent

    beforeEach(() => {
      agent = new LearningAgent('test-agent', 'code-reviewer', {
        learningRate: 0.1,
        knowledgeRetention: 100,
        explorationRate: 0.2,
        enableMetaLearning: true
      })
    })

    it('should learn from successful experiences', async () => {
      const task = {
        id: 'test-task',
        type: 'code-review',
        description: 'Review simple function',
        input: {},
        priority: 1,
        timeout: 30000
      }

      const successfulResult = {
        taskId: task.id,
        success: true,
        duration: 1000,
        resourceUsage: 10
      }

      const reward = 0.8
      await agent.learnFromExperience(task, successfulResult, reward)

      const metrics = agent.getMetrics()
      expect(metrics.totalExperiences).toBe(1)
      expect(metrics.successfulLearning).toBe(1)
    })

    it('should adapt based on failures', async () => {
      const task = {
        id: 'test-fail-task',
        type: 'code-review',
        description: 'Review complex system',
        input: {},
        priority: 1,
        timeout: 30000
      }

      const failedResult = {
        taskId: task.id,
        success: false,
        error: 'Complexity too high',
        duration: 5000
      }

      await agent.learnFromFailure(task, failedResult, new Error('Complexity too high'))

      const metrics = agent.getMetrics()
      expect(metrics.failedLearning).toBe(1)
    })

    it('should recommend tools based on task', async () => {
      const recommendations = await agent.recommendTools({
        availableTools: ['Bash', 'FileEdit', 'Search', 'WebFetch']
      })

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations[0].confidence).toBeGreaterThan(0)
    })
  })
})

describe('🎯 Integration Tests', () => {
  it('should complete full performance optimization flow', async () => {
    // 1. 初始化性能系统
    const initializer = new ParallelInitializer(mockContext)
    await initializer.initialize()

    // 2. 测试工具懒加载
    const registry = initializer.getToolRegistry()
    const tool = await registry.getTool('Bash')
    expect(tool).toBeDefined()

    // 3. 测试缓存系统
    const cache = initializer.getCache()
    cache.set('test-key', 'test-value')
    expect(cache.get('test-key')).toBe('test-value')

    // 4. 验证性能指标
    const metrics = await initializer.getInitializationMetrics()
    expect(metrics.duration).toBeLessThan(3000)
    expect(metrics.toolCount).toBeGreaterThan(0)
  })
})