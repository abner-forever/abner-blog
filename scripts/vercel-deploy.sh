#!/bin/bash
set -e

# =============================================
# web/Admin 本地构建脚本
# 用法: ./scripts/vercel-deploy.sh [web|admin|all] [local|qa|online]
#
# - local: 本地构建（不部署，只生成 dist）
# - qa:    部署到 Vercel QA 环境
# - online: 部署到 Vercel 生产环境
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

APP=${1:-all}
ENV=${2:-local}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$APP] $ENV"
}

# 本地构建
build_local() {
  case $APP in
    web)
      log "本地构建 web..."
      cd apps/web && pnpm build && cd ../..
      ;;
    admin)
      log "本地构建 Admin..."
      cd apps/admin && pnpm build && cd ../..
      ;;
    all)
      log "本地构建 web + Admin..."
      pnpm --filter @abner-blog/web build
      pnpm --filter @abner-blog/admin build
      ;;
  esac
  log "本地构建完成！"
}

# Vercel 远程部署
deploy_vercel() {
  VERCEL_TOKEN=${VERCEL_TOKEN:-""}
  VERCEL_ORG_ID=${VERCEL_ORG_ID:-""}

  if [ -z "$VERCEL_TOKEN" ]; then
    echo "错误: VERCEL_TOKEN 环境变量未设置"
    exit 1
  fi

  local project_id_var="VERCEL_PROJECT_ID_${APP}_${ENV}"
  local project_id="${!project_id_var}"

  if [ -z "$project_id" ]; then
    echo "错误: $project_id_var 环境变量未设置"
    exit 1
  fi

  case $APP in
    web|admin)
      log "部署 $APP 到 Vercel ($ENV)..."
      cd apps/$APP
      npx vercel --prod \
        --token=$VERCEL_TOKEN \
        --yes
      cd ../..
      ;;
  esac
  log "Vercel 部署完成"
}

# 执行
case $ENV in
  local)
    build_local
    ;;
  qa|online)
    deploy_vercel
    ;;
  *)
    echo "错误: ENV 必须是 local|qa|online"
    echo "用法: $0 [web|admin|all] [local|qa|online]"
    exit 1
    ;;
esac
