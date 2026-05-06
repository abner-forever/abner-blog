<template>
  <div class="image-upload">
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
        accept="image/jpeg,image/png,image/gif,image/webp"
        hidden
        @change="onFileChange"
      />
      <div class="drop-hint">
        <span class="icon">+</span>
        <p>点击或拖拽图片到此处上传</p>
        <p class="sub">支持 JPG / PNG / GIF / WebP，最大 5MB</p>
      </div>
    </div>

    <div v-if="previewUrl" class="preview-area">
      <div class="preview-wrapper">
        <img :src="previewUrl" alt="预览" />
        <div class="preview-actions">
          <button class="crop-btn" @click="showCropper = true">裁剪</button>
        </div>
      </div>
      <div v-if="cropMode" class="crop-badge">
        {{ cropMode === 'circle' ? '圆形裁剪' : '矩形裁剪' }}
      </div>
    </div>

    <div v-if="status" class="status" :class="statusType">
      {{ status }}
    </div>

    <div v-if="progress > 0 && progress < 100" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      <span class="progress-text">{{ progress }}%</span>
    </div>

    <button
      v-if="selectedFile && statusType !== 'success'"
      class="upload-btn"
      :disabled="uploading"
      @click="doUpload"
    >
      {{ uploading ? '上传中...' : '开始上传' }}
    </button>

    <ImageCropper
      v-if="showCropper && rawFile"
      :file="rawFile"
      @confirm="onCropConfirm"
      @cancel="showCropper = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleUploader } from '../../../src/core/simple-uploader';
import { FileType } from '../../../src/types';
import type { PreviewItem } from '../../../src/types';
import ImageCropper from './ImageCropper.vue';

const emit = defineEmits<{ uploaded: [item: PreviewItem] }>();

const fileInput = ref<HTMLInputElement>();
const dragging = ref(false);
const rawFile = ref<File | null>(null);
const selectedFile = ref<File | Blob | null>(null);
const previewUrl = ref('');
const status = ref('');
const statusType = ref<'info' | 'error' | 'success'>('info');
const progress = ref(0);
const uploading = ref(false);
const showCropper = ref(false);
const cropMode = ref<'rect' | 'circle' | null>(null);

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
  rawFile.value = file;
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  cropMode.value = null;
  status.value = `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  statusType.value = 'info';
  progress.value = 0;
  showCropper.value = true;
}

function onCropConfirm(blob: Blob, mode: 'rect' | 'circle') {
  showCropper.value = false;
  cropMode.value = mode;

  // Update preview with cropped image
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(blob);
  selectedFile.value = blob;

  const sizeKB = (blob.size / 1024).toFixed(1);
  status.value = `已裁剪（${mode === 'circle' ? '圆形' : '矩形'}），大小: ${sizeKB} KB`;
  statusType.value = 'info';
}

async function doUpload() {
  if (!selectedFile.value || uploading.value) return;

  uploading.value = true;
  status.value = '上传中...';
  statusType.value = 'info';
  progress.value = 0;

  const uploader = new SimpleUploader({
    type: FileType.IMAGE,
    baseUrl: '',
    onProgress: (task) => {
      progress.value = task.progress;
    },
  });

  try {
    // Ensure we have a File object (Blob needs a name for the uploader)
    const uploadFile =
      selectedFile.value instanceof File
        ? selectedFile.value
        : new File([selectedFile.value], rawFile.value?.name || 'cropped.png', {
            type: 'image/png',
          });

    const task = await uploader.upload(uploadFile);

    if (task.url) {
      status.value = `上传成功！URL: ${task.url}`;
      statusType.value = 'success';
      emit('uploaded', {
        url: task.url,
        type: FileType.IMAGE,
        name: uploadFile.name,
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

.preview-area {
  margin-top: 16px;
  text-align: center;
}

.preview-wrapper {
  position: relative;
  display: inline-block;
}

.preview-wrapper img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.preview-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.crop-btn {
  padding: 4px 14px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.crop-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.crop-badge {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 10px;
  background: #f0f5ff;
  color: #1677ff;
  border-radius: 10px;
  font-size: 12px;
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

.progress-bar {
  margin-top: 12px;
  position: relative;
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1677ff;
  transition: width 0.2s;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 20px;
  color: #333;
}

.upload-btn {
  margin-top: 12px;
  width: 100%;
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
</style>
