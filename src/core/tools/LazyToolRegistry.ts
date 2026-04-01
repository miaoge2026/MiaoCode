import type { Tool } from '../../types/tools'
import type { ToolContext } from '../../types/context'

export class LazyToolRegistry {
  private toolCache = new Map<string, Tool>()
  private loadingPromises = new Map<string, Promise<Tool>>()
  private initialized = false

  constructor(private context: ToolContext) {}

  async initialize(): Promise<void> {
    if (this.initialized) return
    
    // 预加载核心工具
    const coreTools = ['Bash', 'FileEdit', 'Search']
    await Promise.all(
      coreTools.map(tool => this.getTool(tool))
    )
    
    this.initialized = true
  }

  async getTool(name: string): Promise<Tool | undefined> {
    // 检查缓存
    if (this.toolCache.has(name)) {
      return this.toolCache.get(name)
    }

    // 检查是否已经在加载中
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)
    }

    // 开始加载工具
    const loadPromise = this.loadTool(name)
    this.loadingPromises.set(name, loadPromise)
    
    try {
      const tool = await loadPromise
      if (tool) {
        this.toolCache.set(name, tool)
      }
      return tool
    } finally {
      this.loadingPromises.delete(name)
    }
  }

  private async loadTool(name: string): Promise<Tool | undefined> {
    try {
      // 动态导入工具模块
      const module = await import(`../tools/individual/${name}Tool.ts`)
      const toolClass = module[`${name}Tool`]
      
      if (!toolClass) {
        console.warn(`Tool class ${name}Tool not found`)
        return undefined
      }

      return new toolClass()
    } catch (error) {
      console.error(`Failed to load tool ${name}:`, error)
      return undefined
    }
  }

  async getTools(names: string[]): Promise<Tool[]> {
    const tools = await Promise.all(
      names.map(name => this.getTool(name))
    )
    return tools.filter((tool): tool is Tool => tool !== undefined)
  }

  clearCache(): void {
    this.toolCache.clear()
  }

  getCachedToolNames(): string[] {
    return Array.from(this.toolCache.keys())
  }

  async preloadTools(toolNames: string[]): Promise<void> {
    await Promise.all(
      toolNames.map(name => this.getTool(name))
    )
  }
}