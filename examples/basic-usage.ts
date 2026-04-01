/**
 * MiaoCode 基础使用示例
 * 展示如何使用 MiaoCode 的核心功能
 */

import { MiaoCode } from '@miao/miao-code-sdk'
import { LazyToolRegistry } from '@/core/tools/LazyToolRegistry'
import { LRUCache } from '@/utils/LRUCache'
import type { ToolContext } from '@/types/context'

// 示例 1: 使用 MiaoCode SDK
async function basicSDKExample() {
  console.log('🚀 Starting MiaoCode SDK example...')
  
  // 初始化 MiaoCode 客户端
  const miao = new MiaoCode({
    apiKey: process.env.MIAO_API_KEY || 'your-api-key',
    model: 'sonnet',
    baseURL: 'https://api.miao-code.dev'
  })

  try {
    // 发送简单的聊天消息
    const response = await miao.chat('Hello, MiaoCode!')
    console.log('💬 Response:', response.content)
    
    // 使用流式响应
    console.log('🌊 Streaming response:')
    for await (const chunk of miao.chatStream('Tell me a story')) {
      process.stdout.write(chunk.content)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// 示例 2: 性能优化 - 对象池
function objectPoolExample() {
  console.log('\n🎯 Starting ObjectPool example...')
  
  // 创建消息对象池
  const messagePool = new ObjectPool(
    () => ({ content: '', role: 'user', timestamp: Date.now() }),
    (msg) => { msg.content = ''; msg.role = 'user'; msg.timestamp = Date.now() },
    50 // 池大小
  )

  // 使用对象池
  const message1 = messagePool.acquire()
  message1.content = 'Hello from pool!'
  
  console.log('📨 Message created:', message1.content)
  
  // 释放对象回池
  messagePool.release(message1)
  
  // 获取同一个对象
  const message2 = messagePool.acquire()
  console.log('📨 Message reused:', message2.content) // 应该是空字符串，因为被重置了
  
  // 查看性能统计
  const stats = messagePool.getStats()
  console.log('📊 Pool stats:', {
    poolSize: stats.poolSize,
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    created: stats.createdCount,
    reused: stats.reusedCount
  })
}

// 示例 3: 性能优化 - LRU缓存
function lruCacheExample() {
  console.log('\n🗄️ Starting LRUCache example...')
  
  // 创建缓存实例
  const cache = new LRUCache<string, any>(100, 60000) // 100个条目，1分钟TTL

  // 存储数据
  cache.set('user:1', { name: 'Alice', age: 25 })
  cache.set('user:2', { name: 'Bob', age: 30 })
  
  // 检索数据
  const user1 = cache.get('user:1')
  console.log('👤 User 1:', user1)
  
  // 测试缓存淘汰
  for (let i = 3; i <= 110; i++) {
    cache.set(`user:${i}`, { name: `User${i}`, age: 20 + i })
  }
  
  // 查看缓存统计
  const stats = cache.getStats()
  console.log('📊 Cache stats:', {
    size: stats.size,
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    uptime: `${Math.floor(stats.uptime / 1000)}s`
  })
}

// 示例 4: 智能工具推荐
async function toolRecommendationExample() {
  console.log('\n🤖 Starting ToolRecommendation example...')
  
  // 创建模拟工具
  const tools = [
    {
      name: 'Bash',
      description: 'Execute shell commands',
      call: async (input: any) => ({ success: true, output: 'Command executed' })
    },
    {
      name: 'FileEdit',
      description: 'Edit files',
      call: async (input: any) => ({ success: true, output: 'File edited' })
    },
    {
      name: 'Search',
      description: 'Search codebase',
      call: async (input: any) => ({ success: true, output: 'Search completed' })
    }
  ]

  // 创建工具推荐器
  const context: ToolContext = {
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    logger: console,
    config: {}
  }

  const recommender = new ToolRecommender(tools, context)

  // 获取工具推荐
  const tasks = [
    'Create a React component for user login',
    'Fix the bug in authentication system',
    'Run tests and generate coverage report',
    'Deploy application to production'
  ]

  for (const task of tasks) {
    console.log(`\n📋 Task: ${task}`)
    const recommendations = await recommender.recommendTools({}, task)
    
    for (const rec of recommendations.slice(0, 3)) {
      console.log(`  🔧 ${rec.tool.name} - ${rec.reason} (${(rec.confidence * 100).toFixed(1)}%)`)
    }
  }
}

// 示例 5: 并行初始化
async function parallelInitializationExample() {
  console.log('\n⚡ Starting ParallelInitialization example...')
  
  const context: ToolContext = {
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
    logger: console,
    config: {}
  }

  const initializer = new ParallelInitializer(context)
  
  const startTime = Date.now()
  await initializer.initialize()
  const duration = Date.now() - startTime
  
  console.log(`✅ Initialization completed in ${duration}ms`)
  
  // 获取性能统计
  const metrics = await initializer.getInitializationMetrics()
  console.log('📊 Initialization metrics:', {
    duration: `${metrics.duration}ms`,
    toolCount: metrics.toolCount,
    cacheSize: metrics.cacheSize,
    timestamp: metrics.timestamp
  })
}

// 主执行函数
async function main() {
  console.log('🐱 MiaoCode Examples')
  console.log('=' .repeat(50))
  
  try {
    // 运行所有示例
    await basicSDKExample()
    objectPoolExample()
    lruCacheExample()
    await toolRecommendationExample()
    await parallelInitializationExample()
    
    console.log('\n🎉 All examples completed successfully!')
    console.log('📚 For more examples, visit: https://github.com/miaoge2026/MiaoCode/examples')
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error)
    process.exit(1)
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export {
  basicSDKExample,
  objectPoolExample,
  lruCacheExample,
  toolRecommendationExample,
  parallelInitializationExample,
  main
}