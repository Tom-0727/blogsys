#!/bin/bash

# 自动更新博客 submodule 脚本
# 日志文件路径
LOG_FILE="/root/codes/blogsys/submodule_update.log"
PROJECT_DIR="/root/codes/blogsys"

# 记录日志函数
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# 切换到项目目录
cd "$PROJECT_DIR" || {
    log_message "错误: 无法切换到项目目录 $PROJECT_DIR"
    exit 1
}

log_message "开始更新 submodule..."

# 更新 submodule
if git submodule update --remote --merge; then
    log_message "Submodule 更新成功"
    
    # 检查是否有新的更改
    if git diff --quiet HEAD; then
        log_message "没有新的更改"
    else
        log_message "检测到新的更改，准备提交"
        
        # 添加并提交更改
        git add .
        if git commit -m "自动更新博客内容 submodule - $(date '+%Y-%m-%d %H:%M:%S')"; then
            log_message "更改已提交到本地仓库"
            
            # 可选：推送到远程仓库（如果需要的话，取消下面的注释）
            # if git push; then
            #     log_message "更改已推送到远程仓库"
            # else
            #     log_message "警告: 推送到远程仓库失败"
            # fi
        else
            log_message "警告: 提交失败"
        fi
    fi
else
    log_message "错误: Submodule 更新失败"
    exit 1
fi

log_message "Submodule 更新流程完成" 