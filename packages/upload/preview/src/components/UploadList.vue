<template>
  <div class="upload-list">
    <div v-if="items.length === 0" class="empty">
      暂无上传记录
    </div>

    <div v-for="(item, i) in items" :key="i" class="list-item">
      <div class="item-preview">
        <img
          v-if="item.type === 'image'"
          :src="item.url"
          alt="preview"
        />
        <div v-else class="file-icon">
          {{ getExt(item.name || '') }}
        </div>
      </div>

      <div class="item-info">
        <div class="item-name">{{ item.name || '未知文件' }}</div>
        <div class="item-url">{{ item.url }}</div>
        <div class="item-type">
          <span class="tag" :class="item.type">{{ typeLabel(item.type) }}</span>
        </div>
      </div>

      <div class="item-actions">
        <a :href="item.url" target="_blank" class="action-btn">打开</a>
        <button class="action-btn" @click="copyUrl(item.url)">复制链接</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PreviewItem } from '../../../src/types';
import { FileType } from '../../../src/types';

defineProps<{ items: PreviewItem[] }>();

function typeLabel(type: FileType): string {
  switch (type) {
    case FileType.IMAGE:
      return '图片';
    case FileType.VIDEO:
      return '视频';
    default:
      return '文件';
  }
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
}

function copyUrl(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    alert('已复制到剪贴板');
  });
}
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 12px;
}

.list-item:hover {
  background: #fafafa;
}

.item-preview {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-url {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-type {
  margin-top: 4px;
}

.tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
}

.tag.image {
  background: #e6f4ff;
  color: #1677ff;
}

.tag.video {
  background: #fff7e6;
  color: #fa8c16;
}

.tag.file {
  background: #f6ffed;
  color: #52c41a;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  text-decoration: none;
  line-height: 1.5;
}

.action-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}
</style>
