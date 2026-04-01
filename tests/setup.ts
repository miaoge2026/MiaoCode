// Jest 测试环境设置
import '@testing-library/jest-dom'

// 模拟全局对象
global.ResizeObserver = require('resize-observer-polyfill').default

// 设置测试超时时间
jest.setTimeout(30000)

// 全局测试配置
beforeAll(() => {
  console.log('🧪 Starting test suite...')
})

beforeEach(() => {
  // 在每个测试之前重置模拟
  jest.clearAllMocks()
})

afterAll(() => {
  console.log('✅ Test suite completed')
})

// 自定义匹配器
expect.extend({
  toBeInRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max
    if (pass) {
      return {
        message: () => `expected ${received} not to be in range [${min}, ${max}]`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be in range [${min}, ${max}]`,
        pass: false,
      }
    }
  },
  toBeValidTool(received: any) {
    const hasName = typeof received.name === 'string' && received.name.length > 0
    const hasDescription = typeof received.description === 'string'
    const hasCallMethod = typeof received.call === 'function'
    const pass = hasName && hasDescription && hasCallMethod
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid tool`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid tool`,
        pass: false,
      }
    }
  }
})