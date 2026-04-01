export class ObjectPool<T> {
  private pool: T[] = []
  private maxSize: number
  private factory: () => T
  private reset: (obj: T) => void
  private createdCount = 0
  private reusedCount = 0
  private disposedCount = 0

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize = 100,
    private enableMetrics = true
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }

  acquire(): T {
    let obj: T

    if (this.pool.length > 0) {
      // 从池中获取对象
      obj = this.pool.pop()!
      this.reusedCount++
      
      if (this.enableMetrics) {
        this.logMetrics('reused')
      }
    } else {
      // 创建新对象
      obj = this.factory()
      this.createdCount++
      
      if (this.enableMetrics) {
        this.logMetrics('created')
      }
    }

    return obj
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      // 重置对象状态
      this.reset(obj)
      // 将对象放回池中
      this.pool.push(obj)
      
      if (this.enableMetrics) {
        this.logMetrics('released')
      }
    } else {
      // 池已满，释放对象
      this.dispose(obj)
    }
  }

  private dispose(obj: T): void {
    // 清理对象资源
    if (typeof (obj as any).destroy === 'function') {
      (obj as any).destroy()
    }
    
    this.disposedCount++
    
    if (this.enableMetrics) {
      this.logMetrics('disposed')
    }
  }

  clear(): void {
    // 清理池中所有对象
    for (const obj of this.pool) {
      this.dispose(obj)
    }
    
    this.pool = []
    
    if (this.enableMetrics) {
      this.logMetrics('pool_cleared')
    }
  }

  getStats(): ObjectPoolStats {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      createdCount: this.createdCount,
      reusedCount: this.reusedCount,
      disposedCount: this.disposedCount,
      hitRate: this.calculateHitRate()
    }
  }

  private calculateHitRate(): number {
    const total = this.createdCount + this.reusedCount
    if (total === 0) return 0
    return (this.reusedCount / total) * 100
  }

  private logMetrics(action: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[ObjectPool] ${action} - Pool size: ${this.pool.length}, ` +
        `Created: ${this.createdCount}, Reused: ${this.reusedCount}, ` +
        `Hit rate: ${this.calculateHitRate().toFixed(2)}%`)
    }
  }

  // 性能优化：批量预创建对象
  preload(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.pool.length)
    
    for (let i = 0; i < toCreate; i++) {
      const obj = this.factory()
      this.reset(obj)
      this.pool.push(obj)
      this.createdCount++
    }
    
    if (this.enableMetrics) {
      console.log(`[ObjectPool] Preloaded ${toCreate} objects`)
    }
  }

  // 性能优化：动态调整池大小
  adjustMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize
    
    // 如果新大小小于当前池大小，清理多余对象
    if (this.pool.length > this.maxSize) {
      const toRemove = this.pool.length - this.maxSize
      for (let i = 0; i < toRemove; i++) {
        const obj = this.pool.pop()
        if (obj) {
          this.dispose(obj)
        }
      }
    }
    
    if (this.enableMetrics) {
      console.log(`[ObjectPool] Max size adjusted to ${newMaxSize}`)
    }
  }
}

export interface ObjectPoolStats {
  poolSize: number
  maxSize: number
  createdCount: number
  reusedCount: number
  disposedCount: number
  hitRate: number
}

// 对象池管理器（全局管理多个对象池）
export class ObjectPoolManager {
  private pools = new Map<string, ObjectPool<any>>()
  private enableGlobalMetrics = true

  createPool<T>(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    maxSize = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(factory, reset, maxSize, this.enableGlobalMetrics)
    this.pools.set(name, pool)
    
    if (this.enableGlobalMetrics) {
      console.log(`[ObjectPoolManager] Created pool: ${name}`)
    }
    
    return pool
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name)
  }

  removePool(name: string): void {
    const pool = this.pools.get(name)
    if (pool) {
      pool.clear()
      this.pools.delete(name)
      
      if (this.enableGlobalMetrics) {
        console.log(`[ObjectPoolManager] Removed pool: ${name}`)
      }
    }
  }

  clearAll(): void {
    for (const [name, pool] of this.pools) {
      pool.clear()
      
      if (this.enableGlobalMetrics) {
        console.log(`[ObjectPoolManager] Cleared pool: ${name}`)
      }
    }
    this.pools.clear()
  }

  getGlobalStats(): GlobalObjectPoolStats {
    const stats: GlobalObjectPoolStats = {
      totalPools: this.pools.size,
      totalCreated: 0,
      totalReused: 0,
      totalDisposed: 0,
      averageHitRate: 0,
      pools: {}
    }

    let totalHitRate = 0
    let poolsWithStats = 0

    for (const [name, pool] of this.pools) {
      const poolStats = pool.getStats()
      stats.pools[name] = poolStats
      
      stats.totalCreated += poolStats.createdCount
      stats.totalReused += poolStats.reusedCount
      stats.totalDisposed += poolStats.disposedCount
      
      if (!isNaN(poolStats.hitRate) && poolStats.hitRate > 0) {
        totalHitRate += poolStats.hitRate
        poolsWithStats++
      }
    }

    stats.averageHitRate = poolsWithStats > 0 ? totalHitRate / poolsWithStats : 0

    return stats
  }

  logGlobalStats(): void {
    if (!this.enableGlobalMetrics) return

    const stats = this.getGlobalStats()
    
    console.log('\n=== Object Pool Global Stats ===')
    console.log(`Total pools: ${stats.totalPools}`)
    console.log(`Total created: ${stats.totalCreated}`)
    console.log(`Total reused: ${stats.totalReused}`)
    console.log(`Total disposed: ${stats.totalDisposed}`)
    console.log(`Average hit rate: ${stats.averageHitRate.toFixed(2)}%`)
    
    for (const [name, poolStats] of Object.entries(stats.pools)) {
      console.log(`\nPool: ${name}`)
      console.log(`  Size: ${poolStats.poolSize}/${poolStats.maxSize}`)
      console.log(`  Created: ${poolStats.createdCount}`)
      console.log(`  Reused: ${poolStats.reusedCount}`)
      console.log(`  Disposed: ${poolStats.disposedCount}`)
      console.log(`  Hit rate: ${poolStats.hitRate.toFixed(2)}%`)
    }
    console.log('==============================\n')
  }
}

export interface GlobalObjectPoolStats {
  totalPools: number
  totalCreated: number
  totalReused: number
  totalDisposed: number
  averageHitRate: number
  pools: Record<string, ObjectPoolStats>
}

// 使用示例
export class ObjectPoolExamples {
  static createMessagePool(): ObjectPool<any> {
    return new ObjectPool(
      () => ({ content: '', role: 'user', timestamp: Date.now() }),
      (msg) => {
        msg.content = ''
        msg.role = 'user'
        msg.timestamp = Date.now()
      },
      50 // 最大50个消息对象
    )
  }

  static createToolResultPool(): ObjectPool<any> {
    return new ObjectPool(
      () => ({ success: false, data: null, error: null, metadata: {} }),
      (result) => {
        result.success = false
        result.data = null
        result.error = null
        result.metadata = {}
      },
      100 // 最大100个结果对象
    )
  }

  static createHTMLElementPool(): ObjectPool<HTMLElement> {
    return new ObjectPool(
      () => document.createElement('div'),
      (element) => {
        element.innerHTML = ''
        element.className = ''
        element.style.cssText = ''
      },
      20 // 最大20个DOM元素
    )
  }
}