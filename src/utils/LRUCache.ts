interface CacheEntry<K, V> {
  key: K
  value: V
  timestamp: number
  accessCount: number
  ttl: number | null
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<K, V>>
  private accessTime: Map<K, number>
  private maxSize: number
  private defaultTTL: number | null
  private enableMetrics: boolean
  private cleanupInterval: NodeJS.Timeout | null = null

  // 性能指标
  private hitCount = 0
  private missCount = 0
  private evictionCount = 0
  private expiredCount = 0

  constructor(
    maxSize = 1000,
    defaultTTL: number | null = null,
    enableMetrics = true,
    cleanupIntervalMs = 60000 // 1分钟清理一次过期项
  ) {
    this.cache = new Map()
    this.accessTime = new Map()
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
    this.enableMetrics = enableMetrics

    // 定期清理过期项
    if (cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpired(),
        cleanupIntervalMs
      )
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.missCount++
      this.logMetrics('miss', key)
      return undefined
    }

    // 检查是否过期
    if (entry.ttl !== null && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.accessTime.delete(key)
      this.expiredCount++
      this.logMetrics('expired', key)
      return undefined
    }

    // 更新访问时间和计数
    entry.accessCount++
    this.accessTime.set(key, Date.now())

    this.hitCount++
    this.logMetrics('hit', key, entry)

    return entry.value
  }

  set(key: K, value: V, ttl?: number): void {
    const now = Date.now()
    const entryTTL = ttl ?? this.defaultTTL

    // 如果缓存已满，先清理
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    const entry: CacheEntry<K, V> = {
      key,
      value,
      timestamp: now,
      accessCount: 0,
      ttl: entryTTL
    }

    this.cache.set(key, entry)
    this.accessTime.set(key, now)

    this.logMetrics('set', key, entry)
  }

  has(key: K): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) return false

    // 检查是否过期
    if (entry.ttl !== null && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.accessTime.delete(key)
      this.expiredCount++
      return false
    }

    return true
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.accessTime.delete(key)
      this.logMetrics('delete', key)
    }
    return deleted
  }

  clear(): void {
    this.cache.clear()
    this.accessTime.clear()
    this.hitCount = 0
    this.missCount = 0
    this.evictionCount = 0
    this.expiredCount = 0

    this.logMetrics('clear', null)
  }

  size(): number {
    return this.cache.size
  }

  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value])
  }

  // 缓存策略方法

  getMany(keys: K[]): Map<K, V> {
    const result = new Map<K, V>()
    
    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result.set(key, value)
      }
    }
    
    return result
  }

  setMany(entries: [K, V][], ttl?: number): void {
    for (const [key, value] of entries) {
      this.set(key, value, ttl)
    }
  }

  deleteMany(keys: K[]): number {
    let deleted = 0
    
    for (const key of keys) {
      if (this.delete(key)) {
        deleted++
      }
    }
    
    return deleted
  }

  // 缓存清理策略

  private evictLeastRecentlyUsed(): void {
    if (this.accessTime.size === 0) return

    let oldestKey: K | null = null
    let oldestTime = Infinity

    // 找到最久未访问的键
    for (const [key, time] of this.accessTime.entries()) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      this.cache.delete(oldestKey)
      this.accessTime.delete(oldestKey)
      this.evictionCount++
      
      this.logMetrics('evict', oldestKey)
    }
  }

  evictByPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace('*', '.*'))
      : pattern
    
    const keysToDelete: K[] = []
    
    for (const key of this.cache.keys()) {
      if (regex.test(String(key))) {
        keysToDelete.push(key)
      }
    }
    
    return this.deleteMany(keysToDelete)
  }

  cleanupExpired(): number {
    const now = Date.now()
    const expiredKeys: K[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl !== null && now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key)
      }
    }
    
    const expiredCount = this.deleteMany(expiredKeys)
    this.expiredCount += expiredCount
    
    if (this.enableMetrics && expiredCount > 0) {
      console.log(`[LRUCache] Cleaned up ${expiredCount} expired entries`)
    }
    
    return expiredCount
  }

  // 性能分析

  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      evictionCount: this.evictionCount,
      expiredCount: this.expiredCount,
      uptime: Date.now() - this.getCreationTime()
    }
  }

  private getCreationTime(): number {
    // 使用时间最早的条目作为创建时间
    let earliestTime = Infinity
    for (const entry of this.cache.values()) {
      if (entry.timestamp < earliestTime) {
        earliestTime = entry.timestamp
      }
    }
    return earliestTime === Infinity ? Date.now() : earliestTime
  }

  logStats(): void {
    if (!this.enableMetrics) return

    const stats = this.getStats()
    
    console.log('\n=== LRU Cache Stats ===')
    console.log(`Size: ${stats.size}/${stats.maxSize}`)
    console.log(`Hit rate: ${stats.hitRate.toFixed(2)}% (${stats.hitCount}/${stats.hitCount + stats.missCount})`)
    console.log(`Evictions: ${stats.evictionCount}`)
    console.log(`Expired: ${stats.expiredCount}`)
    console.log(`Uptime: ${Math.floor(stats.uptime / 1000)}s`)
    console.log('========================\n')
  }

  private logMetrics(action: string, key: K | null, entry?: CacheEntry<K, V>): void {
    if (!this.enableMetrics || process.env.NODE_ENV !== 'development') return

    const keyStr = key !== null ? String(key) : 'null'
    
    switch (action) {
      case 'hit':
        console.debug(`[LRUCache] Hit: ${keyStr} (accessCount: ${entry?.accessCount})`)
        break
      case 'miss':
        console.debug(`[LRUCache] Miss: ${keyStr}`)
        break
      case 'set':
        console.debug(`[LRUCache] Set: ${keyStr} (ttl: ${entry?.ttl ?? 'none'})`)
        break
      case 'delete':
        console.debug(`[LRUCache] Delete: ${keyStr}`)
        break
      case 'evict':
        console.debug(`[LRUCache] Evict: ${keyStr}`)
        break
      case 'expired':
        console.debug(`[LRUCache] Expired: ${keyStr}`)
        break
      case 'clear':
        console.debug(`[LRUCache] Clear: all entries removed`)
        break
    }
  }

  // 高级功能

  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize
    
    // 如果新大小小于当前大小，清理多余的项
    while (this.cache.size > this.maxSize) {
      this.evictLeastRecentlyUsed()
    }
    
    if (this.enableMetrics) {
      console.log(`[LRUCache] Resized to ${newMaxSize}`)
    }
  }

  updateTTL(key: K, newTTL: number | null): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) return false
    
    entry.ttl = newTTL
    entry.timestamp = Date.now() // 重置时间戳
    
    return true
  }

  // 持久化功能

  async export(): Promise<CacheExportData<K, V>> {
    const data = new Map<K, any>()
    
    for (const [key, entry] of this.cache.entries()) {
      data.set(key, {
        value: entry.value,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        ttl: entry.ttl
      })
    }
    
    return {
      data,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      stats: this.getStats()
    }
  }

  async import(data: CacheExportData<K, V>): Promise<void> {
    this.clear()
    
    this.maxSize = data.maxSize
    this.defaultTTL = data.defaultTTL
    
    for (const [key, entryData] of data.data.entries()) {
      if (entryData.ttl === null || Date.now() - entryData.timestamp < entryData.ttl) {
        this.cache.set(key, entryData)
        this.accessTime.set(key, entryData.timestamp)
      }
    }
  }

  // 自动清理资源
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.clear()
  }
}

export interface CacheStats {
  size: number
  maxSize: number
  hitCount: number
  missCount: number
  hitRate: number
  evictionCount: number
  expiredCount: number
  uptime: number
}

export interface CacheExportData<K, V> {
  data: Map<K, {
    value: V
    timestamp: number
    accessCount: number
    ttl: number | null
  }>
  maxSize: number
  defaultTTL: number | null
  stats: CacheStats
}

// 特定类型的缓存实现

export class MessageCache extends LRUCache<string, any> {
  constructor(maxSize = 100) {
    super(maxSize, 300000) // 5分钟TTL
  }
}

export class ToolCache extends LRUCache<string, any> {
  constructor(maxSize = 500) {
    super(maxSize, 3600000) // 1小时TTL
  }
}

export class APICache extends LRUCache<string, any> {
  constructor(maxSize = 1000) {
    super(maxSize, 1800000) // 30分钟TTL
  }
}

// 缓存管理器（全局管理多个缓存实例）
export class CacheManager {
  private caches = new Map<string, LRUCache<any, any>>()
  private enableMetrics = true

  createCache<K, V>(
    name: string,
    maxSize = 1000,
    ttl?: number
  ): LRUCache<K, V> {
    const cache = new LRUCache<K, V>(maxSize, ttl, this.enableMetrics)
    this.caches.set(name, cache)
    
    if (this.enableMetrics) {
      console.log(`[CacheManager] Created cache: ${name}`)
    }
    
    return cache
  }

  getCache<K, V>(name: string): LRUCache<K, V> | undefined {
    return this.caches.get(name)
  }

  removeCache(name: string): void {
    const cache = this.caches.get(name)
    if (cache) {
      cache.destroy()
      this.caches.delete(name)
      
      if (this.enableMetrics) {
        console.log(`[CacheManager] Removed cache: ${name}`)
      }
    }
  }

  clearAll(): void {
    for (const [name, cache] of this.caches) {
      cache.destroy()
      
      if (this.enableMetrics) {
        console.log(`[CacheManager] Cleared cache: ${name}`)
      }
    }
    this.caches.clear()
  }

  getGlobalStats(): GlobalCacheStats {
    const stats: GlobalCacheStats = {
      totalCaches: this.caches.size,
      totalEntries: 0,
      totalHits: 0,
      totalMisses: 0,
      averageHitRate: 0,
      caches: {}
    }

    let totalHitRate = 0
    let cachesWithStats = 0

    for (const [name, cache] of this.caches) {
      const cacheStats = cache.getStats()
      stats.caches[name] = cacheStats
      
      stats.totalEntries += cacheStats.size
      stats.totalHits += cacheStats.hitCount
      stats.totalMisses += cacheStats.missCount
      
      if (!isNaN(cacheStats.hitRate) && cacheStats.hitRate > 0) {
        totalHitRate += cacheStats.hitRate
        cachesWithStats++
      }
    }

    stats.averageHitRate = cachesWithStats > 0 ? totalHitRate / cachesWithStats : 0

    return stats
  }

  logGlobalStats(): void {
    if (!this.enableMetrics) return

    const stats = this.getGlobalStats()
    
    console.log('\n=== Cache Manager Global Stats ===')
    console.log(`Total caches: ${stats.totalCaches}`)
    console.log(`Total entries: ${stats.totalEntries}`)
    console.log(`Total hits: ${stats.totalHits}`)
    console.log(`Total misses: ${stats.totalMisses}`)
    console.log(`Average hit rate: ${stats.averageHitRate.toFixed(2)}%`)
    
    for (const [name, cacheStats] of Object.entries(stats.caches)) {
      console.log(`\nCache: ${name}`)
      console.log(`  Size: ${cacheStats.size}`)
      console.log(`  Hit rate: ${cacheStats.hitRate.toFixed(2)}%`)
      console.log(`  Evictions: ${cacheStats.evictionCount}`)
      console.log(`  Expired: ${cacheStats.expiredCount}`)
    }
    console.log('===================================\n')
  }
}

export interface GlobalCacheStats {
  totalCaches: number
  totalEntries: number
  totalHits: number
  totalMisses: number
  averageHitRate: number
  caches: Record<string, CacheStats>
}