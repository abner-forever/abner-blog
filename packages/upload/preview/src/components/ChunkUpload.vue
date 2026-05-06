<template>
  <div class="chunk-upload">
    <div
      class="drop-zone"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input
        ref="fileInput"
        type="file"
        hidden
        @change="onFileChange"
      />
      <div class="drop-hint">
        <span class="icon">+</span>
        <p>点击或拖拽文件到此处</p>
        <p class="sub">支持任意文件，大文件将自动分片上传</p>
      </div>
    </div>

    <div v-if="selectedFile" class="file-info">
      <div class="info-row">
        <span class="label">文件名：</span>
        <span>{{ selectedFile.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">大小：</span>
        <span>{{ formatSize(selectedFile.size) }}</span>
      </div>
      <div class="info-row">
        <span class="label">类型：</span>
        <span>{{ selectedFile.type || '未知' }}</span>
      </div>
    </div>

    <div v-if="status" class="status" :class="statusType">
      {{ status }}
    </div>

    <div v-if="totalChunks > 0" class="chunk-progress">
      <div class="progress-header">
        <span>分片上传进度：{{ uploadedChunks }} / {{ totalChunks }}</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div class="actions">
      <button
        v-if="selectedFile && statusType !== 'success'"
        class="upload-btn"
        :disabled="uploading"
        @click="doUpload"
      >
        {{ uploading ? '上传中...' : '开始上传' }}
      </button>
      <button
        v-if="uploading"
        class="cancel-btn"
        @click="doCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChunkUploader } from '../../../src/core/chunk-uploader';
import { FileType } from '../../../src/types';
import type { PreviewItem } from '../../../src/types';

const emit = defineEmits<{ uploaded: [item: PreviewItem] }>();

const fileInput = ref<HTMLInputElement>();
const dragging = ref(false);
const selectedFile = ref<File | null>(null);
const status = ref('');
const statusType = ref<'info' | 'error' | 'success'>('info');
const progress = ref(0);
const uploadedChunks = ref(0);
const totalChunks = ref(0);
const uploading = ref(false);

let uploader: ChunkUploader | null = null;

function onDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) selectFile(file);
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) selectFile(file);
}

function selectFile(file: File) {
  selectedFile.value = file;
  status.value = `已选择: ${file.name}`;
  statusType.value = 'info';
  progress.value = 0;
  uploadedChunks.value = 0;
  totalChunks.value = 0;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function doUpload() {
  if (!selectedFile.value || uploading.value) return;

  uploading.value = true;
  status.value = '初始化分片上传...';
  statusType.value = 'info';
  progress.value = 0;

  const chunkSize = 2 * 1024 * 1024; // 2MB per chunk
  totalChunks.value = Math.ceil(selectedFile.value.size / chunkSize);

  uploader = new ChunkUploader({
    type: FileType.FILE,
    baseUrl: '',
    chunkSize,
    concurrency: 3,
    onProgress: (task) => {
      progress.value = task.progress;
      uploadedChunks.value = task.chunks?.length ?? 0;
    },
  });

  try {
    const task = await uploader.upload(selectedFile.value);

    if (task.url) {
      status.value = `上传成功！URL: ${task.url}`;
      statusType.value = 'success';
      emit('uploaded', {
        url: task.url,
        type: FileType.FILE,
        name: selectedFile.value.name,
      });
    } else {
      status.value = task.error || '上传失败';
      statusType.value = 'error';
    }
  } catch (err) {
    status.value = err instanceof Error ? err.message : '上传异常';
    statusType.value = 'error';
  } finally {
    uploading.value = false;
  }
}

function doCancel() {
  if (uploader) {
    uploader.cancel('');
    uploading.value = false;
    status.value = '已取消上传';
    statusType.value = 'info';
  }
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: #1677ff;
  background: #f0f5ff;
}

.drop-hint .icon {
  font-size: 40px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}

.drop-hint p {
  font-size: 14px;
  color: #666;
}

.drop-hint .sub {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.file-info {
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.info-row {
  font-size: 13px;
  line-height: 1.8;
}

.info-row .label {
  color: #999;
  margin-right: 4px;
}

.status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  word-break: break-all;
}

.status.info {
  background: #e6f4ff;
  color: #1677ff;
}

.status.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.status.success {
  background: #f6ffed;
  color: #52c41a;
}

.chunk-progress {
  margin-top: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.progress-bar {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1677ff, #4096ff);
  transition: width 0.2s;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.upload-btn {
  flex: 1;
  padding: 10px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.upload-btn:hover {
  background: #4096ff;
}

.upload-btn:disabled {
  background: #91caff;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 10px 24px;
  background: #fff;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #fff2f0;
}
</style>
