<template>
  <div class="cropper-overlay" @mousedown.self="close">
    <div class="cropper-modal">
      <div class="cropper-header">
        <span>裁剪图片</span>
        <div class="mode-switch">
          <button
            :class="{ active: mode === 'rect' }"
            @click="setMode('rect')"
          >
            矩形
          </button>
          <button
            :class="{ active: mode === 'circle' }"
            @click="setMode('circle')"
          >
            圆形
          </button>
        </div>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="cropper-body" ref="containerRef">
        <canvas
          ref="canvasRef"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @mouseleave="onCanvasMouseUp"
        ></canvas>
      </div>

      <div class="cropper-footer">
        <button class="btn-cancel" @click="close">取消</button>
        <button class="btn-confirm" @click="confirm">确认裁剪</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';

type CropMode = 'rect' | 'circle';
type DragAction = 'none' | 'create' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-r' | 'resize-b' | 'resize-l';

const props = defineProps<{
  file: File;
}>();

const emit = defineEmits<{
  confirm: [blob: Blob, mode: CropMode];
  cancel: [];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const containerRef = ref<HTMLDivElement>();
const mode = ref<CropMode>('rect');

let img: HTMLImageElement | null = null;
let canvasW = 0;
let canvasH = 0;
let imgX = 0;
let imgY = 0;
let imgW = 0;
let imgH = 0;

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

let crop: CropRect = { x: 0, y: 0, w: 0, h: 0 };
let dragAction: DragAction = 'none';
let dragStartX = 0;
let dragStartY = 0;
let dragStartCrop: CropRect = { x: 0, y: 0, w: 0, h: 0 };
let dragCreateStartX = 0;
let dragCreateStartY = 0;

const HANDLE_SIZE = 10;
const MIN_CROP = 20;

onMounted(() => {
  loadImage();
});

watch(mode, () => {
  draw();
});

function loadImage() {
  img = new Image();
  img.onload = () => {
    nextTick(() => fitImageToCanvas());
  };
  img.src = URL.createObjectURL(props.file);
}

function fitImageToCanvas() {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas || !img) return;

  const maxW = container.clientWidth - 16;
  const maxH = container.clientHeight - 16;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);

  canvasW = Math.round(img.naturalWidth * scale);
  canvasH = Math.round(img.naturalHeight * scale);

  canvas.width = canvasW;
  canvas.height = canvasH;

  imgW = canvasW;
  imgH = canvasH;
  imgX = 0;
  imgY = 0;

  // Default crop: centered 80% area
  const cropSize = Math.min(canvasW, canvasH) * 0.8;
  crop = {
    x: (canvasW - cropSize) / 2,
    y: (canvasH - cropSize) / 2,
    w: cropSize,
    h: cropSize,
  };

  draw();
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas || !img) return;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvasW, canvasH);

  // Draw image
  ctx.drawImage(img, imgX, imgY, imgW, imgH);

  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Clip crop area and redraw image inside
  ctx.save();
  if (mode.value === 'circle') {
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    const rx = crop.w / 2;
    const ry = crop.h / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(crop.x, crop.y, crop.w, crop.h);
    ctx.clip();
  }
  ctx.drawImage(img, imgX, imgY, imgW, imgH);
  ctx.restore();

  // Crop border
  if (mode.value === 'circle') {
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    const rx = crop.w / 2;
    const ry = crop.h / 2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);

    // Grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      // Vertical
      ctx.beginPath();
      ctx.moveTo(crop.x + (crop.w / 3) * i, crop.y);
      ctx.lineTo(crop.x + (crop.w / 3) * i, crop.y + crop.h);
      ctx.stroke();
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(crop.x, crop.y + (crop.h / 3) * i);
      ctx.lineTo(crop.x + crop.w, crop.y + (crop.h / 3) * i);
      ctx.stroke();
    }

    // Corner handles
    drawHandle(ctx, crop.x, crop.y);
    drawHandle(ctx, crop.x + crop.w, crop.y);
    drawHandle(ctx, crop.x, crop.y + crop.h);
    drawHandle(ctx, crop.x + crop.w, crop.y + crop.h);

    // Edge handles
    drawHandle(ctx, crop.x + crop.w / 2, crop.y);
    drawHandle(ctx, crop.x + crop.w, crop.y + crop.h / 2);
    drawHandle(ctx, crop.x + crop.w / 2, crop.y + crop.h);
    drawHandle(ctx, crop.x, crop.y + crop.h / 2);
  }
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const s = HANDLE_SIZE / 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - s, y - s, HANDLE_SIZE, HANDLE_SIZE);
}

function getCanvasCoords(e: MouseEvent): { x: number; y: number } {
  const canvas = canvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function hitTest(x: number, y: number): DragAction {
  const s = HANDLE_SIZE;
  const { x: cx, y: cy, w, h } = crop;

  // Corner handles
  if (Math.abs(x - cx) < s && Math.abs(y - cy) < s) return 'resize-tl';
  if (Math.abs(x - (cx + w)) < s && Math.abs(y - cy) < s) return 'resize-tr';
  if (Math.abs(x - cx) < s && Math.abs(y - (cy + h)) < s) return 'resize-bl';
  if (Math.abs(x - (cx + w)) < s && Math.abs(y - (cy + h)) < s) return 'resize-br';

  // Edge handles
  if (Math.abs(y - cy) < s && x > cx + s && x < cx + w - s) return 'resize-t';
  if (Math.abs(x - (cx + w)) < s && y > cy + s && y < cy + h - s) return 'resize-r';
  if (Math.abs(y - (cy + h)) < s && x > cx + s && x < cx + w - s) return 'resize-b';
  if (Math.abs(x - cx) < s && y > cy + s && y < cy + h - s) return 'resize-l';

  // Inside crop area
  if (x > cx && x < cx + w && y > cy && y < cy + h) return 'move';

  return 'none';
}

function onCanvasMouseDown(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e);
  const hit = hitTest(x, y);

  if (hit === 'none') {
    // Start creating a new crop area
    dragAction = 'create';
    dragCreateStartX = x;
    dragCreateStartY = y;
    crop = { x, y, w: 0, h: 0 };
  } else {
    dragAction = hit;
  }

  dragStartX = x;
  dragStartY = y;
  dragStartCrop = { ...crop };
}

function onCanvasMouseMove(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e);

  if (dragAction === 'none') {
    // Update cursor
    const hit = hitTest(x, y);
    const canvas = canvasRef.value!;
    switch (hit) {
      case 'resize-tl':
      case 'resize-br':
        canvas.style.cursor = 'nwse-resize';
        break;
      case 'resize-tr':
      case 'resize-bl':
        canvas.style.cursor = 'nesw-resize';
        break;
      case 'resize-t':
      case 'resize-b':
        canvas.style.cursor = 'ns-resize';
        break;
      case 'resize-l':
      case 'resize-r':
        canvas.style.cursor = 'ew-resize';
        break;
      case 'move':
        canvas.style.cursor = 'move';
        break;
      default:
        canvas.style.cursor = 'crosshair';
    }
    return;
  }

  const dx = x - dragStartX;
  const dy = y - dragStartY;

  if (dragAction === 'create') {
    const sx = Math.min(dragCreateStartX, x);
    const sy = Math.min(dragCreateStartY, y);
    let w = Math.abs(x - dragCreateStartX);
    let h = Math.abs(y - dragCreateStartY);

    if (mode.value === 'circle') {
      const size = Math.max(w, h);
      w = size;
      h = size;
    }

    crop = clampCrop({
      x: mode.value === 'circle' ? dragCreateStartX - (w - Math.abs(x - dragCreateStartX)) / 2 : sx,
      y: mode.value === 'circle' ? dragCreateStartY - (h - Math.abs(y - dragCreateStartY)) / 2 : sy,
      w,
      h,
    });
  } else if (dragAction === 'move') {
    crop = clampCrop({
      x: dragStartCrop.x + dx,
      y: dragStartCrop.y + dy,
      w: dragStartCrop.w,
      h: dragStartCrop.h,
    });
  } else {
    crop = resizeCrop(dragStartCrop, dx, dy, dragAction);
  }

  draw();
}

function onCanvasMouseUp() {
  dragAction = 'none';
}

function resizeCrop(orig: CropRect, dx: number, dy: number, action: DragAction): CropRect {
  let { x, y, w, h } = orig;

  switch (action) {
    case 'resize-tl':
      x += dx; y += dy; w -= dx; h -= dy;
      break;
    case 'resize-tr':
      y += dy; w += dx; h -= dy;
      break;
    case 'resize-bl':
      x += dx; w -= dx; h += dy;
      break;
    case 'resize-br':
      w += dx; h += dy;
      break;
    case 'resize-t':
      y += dy; h -= dy;
      break;
    case 'resize-r':
      w += dx;
      break;
    case 'resize-b':
      h += dy;
      break;
    case 'resize-l':
      x += dx; w -= dx;
      break;
  }

  if (mode.value === 'circle') {
    const size = Math.max(w, h);
    if (action.includes('l')) x = orig.x + orig.w - size;
    if (action.includes('t')) y = orig.y + orig.h - size;
    w = size;
    h = size;
  }

  // Enforce minimum size
  if (w < MIN_CROP) { w = MIN_CROP; if (action.includes('l')) x = orig.x + orig.w - MIN_CROP; }
  if (h < MIN_CROP) { h = MIN_CROP; if (action.includes('t')) y = orig.y + orig.h - MIN_CROP; }

  return clampCrop({ x, y, w, h });
}

function clampCrop(r: CropRect): CropRect {
  let { x, y, w, h } = r;
  if (w < MIN_CROP) w = MIN_CROP;
  if (h < MIN_CROP) h = MIN_CROP;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + w > canvasW) x = canvasW - w;
  if (y + h > canvasH) y = canvasH - h;
  if (x < 0) { x = 0; w = canvasW; }
  if (y < 0) { y = 0; h = canvasH; }
  return { x, y, w, h };
}

function setMode(m: CropMode) {
  mode.value = m;
  if (m === 'circle') {
    // Convert to square crop
    const size = Math.min(crop.w, crop.h);
    crop = {
      x: crop.x + (crop.w - size) / 2,
      y: crop.y + (crop.h - size) / 2,
      w: size,
      h: size,
    };
  }
  draw();
}

function confirm() {
  if (!img) return;

  // Scale crop coordinates back to original image dimensions
  const scaleX = img.naturalWidth / imgW;
  const scaleY = img.naturalHeight / imgH;

  const sx = (crop.x - imgX) * scaleX;
  const sy = (crop.y - imgY) * scaleY;
  const sw = crop.w * scaleX;
  const sh = crop.h * scaleY;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.round(sw);
  outCanvas.height = Math.round(sh);
  const ctx = outCanvas.getContext('2d')!;

  if (mode.value === 'circle') {
    ctx.beginPath();
    ctx.ellipse(sw / 2, sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
    ctx.clip();
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  outCanvas.toBlob((blob) => {
    if (blob) emit('confirm', blob, mode.value);
  }, 'image/png');
}

function close() {
  emit('cancel');
}
</script>

<style scoped>
.cropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cropper-modal {
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
  width: 640px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 500;
}

.mode-switch {
  display: flex;
  gap: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.mode-switch button {
  padding: 4px 16px;
  border: none;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: all 0.15s;
}

.mode-switch button:not(:last-child) {
  border-right: 1px solid #d9d9d9;
}

.mode-switch button.active {
  background: #1677ff;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.close-btn:hover {
  color: #333;
}

.cropper-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  min-height: 300px;
  max-height: 60vh;
  overflow: hidden;
}

.cropper-body canvas {
  display: block;
  cursor: crosshair;
}

.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 8px 24px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
}

.btn-cancel:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.btn-confirm {
  padding: 8px 24px;
  background: #1677ff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  color: #fff;
}

.btn-confirm:hover {
  background: #4096ff;
}
</style>
