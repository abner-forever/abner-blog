<template>
  <div class="app">
    <h1>Upload Preview</h1>

    <div class="token-bar">
      <label>JWT Token:</label>
      <input
        v-model="token"
        type="text"
        placeholder="粘贴 JWT token（登录后从 localStorage 获取）"
      />
      <button @click="saveToken">保存</button>
      <span v-if="tokenSaved" class="saved-hint">已保存</span>
    </div>

    <div class="tabs">
      <button
        :class="{ active: activeTab === 'image' }"
        @click="activeTab = 'image'"
      >
        图片上传
      </button>
      <button
        :class="{ active: activeTab === 'chunk' }"
        @click="activeTab = 'chunk'"
      >
        分片上传
      </button>
      <button
        :class="{ active: activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        上传记录
      </button>
    </div>

    <div class="tab-content">
      <ImageUpload
        v-if="activeTab === 'image'"
        @uploaded="onUploaded"
      />
      <ChunkUpload
        v-if="activeTab === 'chunk'"
        @uploaded="onUploaded"
      />
      <UploadList
        v-if="activeTab === 'list'"
        :items="uploadedItems"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PreviewItem } from '../../src/types';
import ImageUpload from './components/ImageUpload.vue';
import ChunkUpload from './components/ChunkUpload.vue';
import UploadList from './components/UploadList.vue';

const activeTab = ref<'image' | 'chunk' | 'list'>('image');
const token = ref(localStorage.getItem('user-token') || '');
const tokenSaved = ref(false);
const uploadedItems = ref<PreviewItem[]>([]);

function saveToken() {
  localStorage.setItem('user-token', token.value);
  tokenSaved.value = true;
  setTimeout(() => (tokenSaved.value = false), 2000);
}

function onUploaded(item: PreviewItem) {
  uploadedItems.value.unshift(item);
  activeTab.value = 'list';
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.token-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.token-bar label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.token-bar input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.token-bar button {
  padding: 6px 16px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.token-bar button:hover {
  background: #4096ff;
}

.saved-hint {
  color: #52c41a;
  font-size: 13px;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.tabs button {
  padding: 10px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #1677ff;
}

.tabs button.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
  font-weight: 500;
}

.tab-content {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 24px;
}
</style>
