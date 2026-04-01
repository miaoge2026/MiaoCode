import { LazyToolRegistry } from '../tools/LazyToolRegistry'
import { LRUCache } from '../../utils/LRUCache'
import type { ToolContext } from '../../types/context'

export class ParallelInitializer {
  private context: ToolContext
  private toolRegistry: LazyToolRegistry
  private cache: LRUCache<string, any>

  constructor(context: ToolContext) {
    this.context = context
    this.toolRegistry = new LazyToolRegistry(context)
    this.cache = new LRUCache(1000)
  }

  async initialize(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // 并行初始化所有模块
      await Promise.all([
        this.initializeCore(),
        this.initializeTools(),
        this.initializeCache(),
        this.initializeServices(),
        this.initializeUI(),
      ])

      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`🚀 MiaoCode initialized in ${duration}ms`)
      
      // 缓存初始化性能数据
      this.cache.set('initializationDuration', duration)
      this.cache.set('initializedAt', new Date().toISOString())
      
    } catch (error) {
      console.error('Initialization failed:', error)
      throw error
    }
  }

  private async initializeCore(): Promise<void> {
    // 核心功能初始化，优先级最高
    console.log('🔧 Initializing core modules...')
    
    // 初始化权限系统
    await this.initializePermissions()
    
    // 初始化配置系统
    await this.initializeConfig()
    
    // 初始化日志系统
    await this.initializeLogging()
    
    console.log('✅ Core modules initialized')
  }

  private async initializeTools(): Promise<void> {
    // 工具系统初始化，可以延迟一点
    console.log('🛠️ Initializing tool system...')
    
    // 延迟100ms，让核心模块优先完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 预加载核心工具
    await this.toolRegistry.preloadTools(['Bash', 'FileEdit', 'Search'])
    
    console.log('✅ Tool system initialized')
  }

  private async initializeCache(): Promise<void> {
    // 缓存系统，后台初始化
    console.log('🗄️ Initializing cache system...')
    
    // 延迟500ms，确保不影响用户体验
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 预热缓存
    await this.warmupCache()
    
    console.log('✅ Cache system initialized')
  }

  private async initializeServices(): Promise<void> {
    // 服务层初始化
    console.log('🔌 Initializing services...')
    
    await Promise.all([
      this.initializeGitService(),
      this.initializeMCPService(),
      this.initializeTelemetry(),
    ])
    
    console.log('✅ Services initialized')
  }

  private async initializeUI(): Promise<void> {
    // UI组件初始化
    console.log('🎨 Initializing UI components...')
    
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 初始化主题系统
    await this.initializeTheme()
    
    // 初始化动画系统
    await this.initializeAnimations()
    
    console.log('✅ UI components initialized')
  }

  // 具体的初始化方法
  private async initializePermissions(): Promise<void> {
    // 初始化权限检查系统
    const { PermissionSystem } = await import('../permissions/PermissionSystem')
    const permissionSystem = new PermissionSystem()
    await permissionSystem.initialize()
  }

  private async initializeConfig(): Promise<void> {
    // 加载配置文件
    const { ConfigManager } = await import('../config/ConfigManager')
    const configManager = new ConfigManager()
    await configManager.loadConfig()
  }

  private async initializeLogging(): Promise<void> {
    // 初始化日志系统
    const { Logger } = await import('../../utils/Logger')
    const logger = new Logger()
    await logger.initialize()
  }

  private async warmupCache(): Promise<void> {
    // 缓存预热
    const commonTools = ['Bash', 'FileEdit', 'Search', 'WebFetch']
    
    for (const toolName of commonTools) {
      this.cache.set(`tool:${toolName}`, {
        name: toolName,
        loaded: false,
        usageCount: 0,
        lastUsed: null
      })
    }
  }

  private async initializeGitService(): Promise<void> {
    // 初始化Git服务
    const { GitService } = await import('../services/GitService')
    const gitService = new GitService()
    await gitService.initialize()
  }

  private async initializeMCPService(): Promise<void> {
    // 初始化MCP服务
    const { MCPService } = await import('../services/MCPService')
    const mcpService = new MCPService()
    await mcpService.initialize()
  }

  private async initializeTelemetry(): Promise<void> {
    // 初始化遥测系统
    const { Telemetry } = await import('../../utils/Telemetry')
    const telemetry = new Telemetry()
    await telemetry.initialize()
  }

  private async initializeTheme(): Promise<void> {
    // 初始化主题系统
    const { ThemeSystem } = await import('../../ui/theme/ThemeSystem')
    const themeSystem = new ThemeSystem()
    await themeSystem.initialize()
  }

  private async initializeAnimations(): Promise<void> {
    // 初始化动画系统
    const { AnimationSystem } = await import('../../ui/animation/AnimationSystem')
    const animationSystem = new AnimationSystem()
    await animationSystem.initialize()
  }

  // 获取器方法
  getToolRegistry(): LazyToolRegistry {
    return this.toolRegistry
  }

  getCache(): LRUCache<string, any> {
    return this.cache
  }

  // 性能监控
  async getInitializationMetrics(): Promise<InitializationMetrics> {
    return {
      duration: this.cache.get('initializationDuration'),
      timestamp: this.cache.get('initializedAt'),
      toolCount: this.toolRegistry.getCachedToolNames().length,
      cacheSize: this.cache.size()
    }
  }
}

export interface InitializationMetrics {
  duration: number | undefined
  timestamp: string | undefined
  toolCount: number
  cacheSize: number
}