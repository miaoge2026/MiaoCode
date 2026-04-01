#!/bin/bash

# MiaoCode 构建脚本
# 用于构建、测试和部署项目

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示用法
usage() {
    echo "Usage: $0 [option]"
    echo "Options:"
    echo "  build          Build the project"
    echo "  test           Run tests"
    echo "  lint           Run linting"
    echo "  format         Format code"
    echo "  type-check     Check TypeScript types"
    echo "  all            Run all checks and build"
    echo "  clean          Clean build artifacts"
    echo "  docker-build   Build Docker image"
    echo "  docker-run     Run Docker container"
    echo "  release        Create release"
    echo "  help           Show this help message"
}

# 清理函数
clean() {
    log_info "Cleaning build artifacts..."
    
    # 删除构建目录
    if [ -d "dist" ]; then
        rm -rf dist
        log_success "Removed dist directory"
    fi
    
    # 删除缓存
    if [ -d ".cache" ]; then
        rm -rf .cache
        log_success "Removed cache directory"
    fi
    
    # 删除 node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log_success "Removed node_modules directory"
    fi
    
    # 删除日志文件
    if [ -d "logs" ]; then
        rm -rf logs
        log_success "Removed logs directory"
    fi
    
    log_success "Clean completed"
}

# 安装依赖
install_deps() {
    log_info "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

# 代码检查
run_lint() {
    log_info "Running linting..."
    npm run lint
    log_success "Linting completed"
}

# 代码格式化
run_format() {
    log_info "Formatting code..."
    npm run format
    log_success "Formatting completed"
}

# 类型检查
run_type_check() {
    log_info "Running type checking..."
    npm run type-check
    log_success "Type checking completed"
}

# 运行测试
run_tests() {
    log_info "Running tests..."
    npm test -- --coverage --watchAll=false
    log_success "Tests completed"
}

# 构建项目
build_project() {
    log_info "Building project..."
    npm run build
    log_success "Build completed"
}

# 检查所有
run_all_checks() {
    log_info "Running all checks..."
    
    run_lint
    run_format
    run_type_check
    run_tests
    
    log_success "All checks completed"
}

# 构建 Docker 镜像
docker_build() {
    log_info "Building Docker image..."
    
    # 获取版本号
    VERSION=$(node -p "require('./package.json').version")
    
    # 构建镜像
    docker build -t miaoge2026/miao-code:latest \
        -t miaoge2026/miao-code:${VERSION} \
        .
    
    log_success "Docker image built: miaoge2026/miao-code:${VERSION}"
}

# 运行 Docker 容器
docker_run() {
    log_info "Running Docker container..."
    
    # 检查镜像是否存在
    if [[ "$(docker images -q miaoge2026/miao-code:latest 2>/dev/null)" == "" ]]; then
        log_error "Docker image not found. Please build it first."
        exit 1
    fi
    
    # 运行容器
    docker run -d \
        --name miao-code \
        -p 3000:3000 \
        -v miao-code-cache:/app/.cache \
        --restart unless-stopped \
        miaoge2026/miao-code:latest
    
    log_success "Docker container running on http://localhost:3000"
}

# 创建发布版本
create_release() {
    log_info "Creating release..."
    
    # 运行所有检查
    run_all_checks
    
    # 构建项目
    build_project
    
    # 获取版本号
    VERSION=$(node -p "require('./package.json').version")
    
    # 创建 Git 标签
    git tag -a v${VERSION} -m "Release v${VERSION}"
    git push origin v${VERSION}
    
    log_success "Release v${VERSION} created"
}

# 显示项目信息
show_info() {
    echo ""
    echo "🐱 MiaoCode Project Information"
    echo "================================"
    
    # 获取基本信息
    NAME=$(node -p "require('./package.json').name")
    VERSION=$(node -p "require('./package.json').version")
    DESCRIPTION=$(node -p "require('./package.json').description")
    
    echo "Name: $NAME"
    echo "Version: $VERSION"
    echo "Description: $DESCRIPTION"
    echo ""
    
    # 检查环境
    echo "Environment:"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo "  TypeScript: $(npx tsc --version)"
    echo ""
    
    # 检查目录
    echo "Project Structure:"
    [ -d "src" ] && echo "  ✅ src/" || echo "  ❌ src/"
    [ -d "tests" ] && echo "  ✅ tests/" || echo "  ❌ tests/"
    [ -d "docs" ] && echo "  ✅ docs/" || echo "  ❌ docs/"
    [ -d "examples" ] && echo "  ✅ examples/" || echo "  ❌ examples/"
    [ -f "package.json" ] && echo "  ✅ package.json" || echo "  ❌ package.json"
    [ -f "tsconfig.json" ] && echo "  ✅ tsconfig.json" || echo "  ❌ tsconfig.json"
    [ -f "Dockerfile" ] && echo "  ✅ Dockerfile" || echo "  ❌ Dockerfile"
    echo ""
    
    # 检查依赖
    echo "Dependencies:"
    npm list --depth=0 2>/dev/null | grep -E "^@miao|^@anthropic|^@modelcontextprotocol" || echo "  No special dependencies found"
    echo ""
}

# 主函数
main() {
    # 如果没有参数，显示用法
    if [ $# -eq 0 ]; then
        usage
        exit 1
    fi

    case $1 in
        "build")
            build_project
            ;;
        "test")
            run_tests
            ;;
        "lint")
            run_lint
            ;;
        "format")
            run_format
            ;;
        "type-check")
            run_type_check
            ;;
        "all")
            run_all_checks
            build_project
            ;;
        "clean")
            clean
            ;;
        "docker-build")
            docker_build
            ;;
        "docker-run")
            docker_run
            ;;
        "release")
            create_release
            ;;
        "info")
            show_info
            ;;
        "help")
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
    
    log_success "Done!"
}

# 运行主函数
main "$@"