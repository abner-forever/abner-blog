#!/bin/bash
set -e

# =============================================
# server 本地部署脚本
# 用法: ./scripts/deploy-server.sh [local|qa|online]
#
# - local: 部署到本地电脑（直接运行）
# - qa:    部署到 QA 环境（阿里云）
# - online: 部署到生产环境（阿里云）
# =============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

ENV=${1:-local}
APP_NAME="blog-server"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$ENV] $1"
}

# 本地部署（直接运行）
deploy_local() {
  log "本地部署 server..."

  # 加载 .env 文件（排除注释和空行，使用 export 避免解析问题）
  if [ -f "apps/server/.env" ]; then
    log "加载 .env..."
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
      # 跳过注释和空行
      [[ "$line" =~ ^[[:space:]]*# ]] && continue
      [[ -z "${line// /}" ]] && continue
      # 导出变量
      export "$line"
    done < "apps/server/.env"
    set +a
  fi

  # 安装依赖
  log "安装依赖..."
  cd apps/server
  pnpm install
  cd ../..

  # 构建
  log "构建..."
  pnpm --filter @abner-blog/server build

  # 使用 PM2 运行（如果已存在则重启，否则启动）
  log "启动 PM2..."
  cd apps/server
  npx pm2 restart $APP_NAME-local || npx pm2 start dist/main.js --name $APP_NAME-local
  npx pm2 save
  cd ../..

  log "本地部署完成！"
  npx pm2 status
}

# 远程部署（阿里云 ECS）
deploy_remote() {
  DEPLOY_HOST_VAR="DEPLOY_HOST_${ENV}"
  DEPLOY_USER_VAR="DEPLOY_USER_${ENV}"
  DEPLOY_KEY_VAR="DEPLOY_KEY_${ENV}"

  DEPLOY_HOST="${!DEPLOY_HOST_VAR}"
  DEPLOY_USER="${!DEPLOY_USER_VAR}"
  DEPLOY_KEY="${!DEPLOY_KEY_VAR:-~/.ssh/deploy_key}"

  if [ -z "$DEPLOY_HOST" ]; then
    echo "错误: ${DEPLOY_HOST_VAR} 环境变量未设置"
    exit 1
  fi

  log "部署 server 到 $ENV ($DEPLOY_HOST)..."

  # 构建
  pnpm --filter @abner-blog/server build

  # 同步到服务器
  rsync -avz \
    -e "ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    apps/server/dist/ \
    $DEPLOY_USER@$DEPLOY_HOST:/opt/$APP_NAME-$ENV/

  # 远程执行
  ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST << EOF
    set -e
    cd /opt/$APP_NAME-$ENV
    pnpm install --prod --frozen-lockfile
    pm2 restart $APP_NAME-$ENV || pm2 start dist/main.js --name $APP_NAME-$ENV
    pm2 save
    pm2 status
EOF

  log "远程部署完成"
}

# 执行
case $ENV in
  local)
    deploy_local
    ;;
  qa|online)
    deploy_remote
    ;;
  *)
    echo "错误: ENV 必须是 local|qa|online"
    echo "用法: $0 [local|qa|online]"
    exit 1
    ;;
esac
