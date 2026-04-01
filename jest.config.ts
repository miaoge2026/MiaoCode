import type { Config } from 'jest'
import { defaults } from 'jest-config'

const config: Config = {
  // 使用 ts-jest 处理 TypeScript 文件
  preset: 'ts-jest',
  
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 忽略的目录
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.git/',
    '<rootDir>/coverage/'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // 转换器配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  
  // 需要编译的模块
  transformIgnorePatterns: [
    'node_modules/(?!(lodash-es | p-map | uuid )/)'
  ],
  
  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        warnOnly: true
      }
    }
  },
  
  // 测试运行器配置
  runner: 'jest-runner',
  
  // 测试超时时间
  testTimeout: 30000,
  
  // 是否显示详细日志
  verbose: true,
  
  // 是否只运行有变化的测试
  onlyChanged: false,
  
  // 是否缓存测试结果
  cache: true,
  
  // 缓存目录
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // 是否使用 worker 池
  maxWorkers: '50%',
  
  // 测试环境变量
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
}

export default config