import { useState, useCallback } from 'react';
import { Modal, Slider, Button, Typography, Space } from 'antd';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateLeftOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import './index.less';

const { Text } = Typography;

interface AvatarCropModalProps {
  open: boolean;
  imageSrc: string;
  onCancel: () => void;
  /** 回调参数为压缩后的 File 对象，可直接用于上传 */
  onConfirm: (file: File) => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

/**
 * 用 Canvas 从原图中裁出选区，支持旋转，输出 300×300 JPEG Blob。
 * react-easy-crop 的 croppedAreaPixels 是在"旋转后的坐标系"中给出的，
 * 所以需要先把整图旋转到一个安全画布上，再从中裁出选区。
 */
async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const OUTPUT_SIZE = 300;

  // ── 第一步：把整张图旋转到「安全尺寸」画布 ──────────────────────────
  // 安全尺寸 = 对角线长度，保证旋转后四角不被裁掉
  const maxDim = Math.max(img.width, img.height);
  const safeArea = Math.ceil(2 * maxDim * Math.sqrt(2));

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = safeArea;
  rotCanvas.height = safeArea;
  const rotCtx = rotCanvas.getContext('2d');
  if (!rotCtx) throw new Error('无法创建 Canvas 上下文');

  rotCtx.translate(safeArea / 2, safeArea / 2);
  rotCtx.rotate((rotation * Math.PI) / 180);
  rotCtx.translate(-img.width / 2, -img.height / 2);
  rotCtx.drawImage(img, 0, 0);

  // ── 第二步：从旋转画布中读取裁剪区域的像素 ─────────────────────────
  // croppedAreaPixels 是相对于原图尺寸的，转换到安全画布坐标需加上偏移
  const offsetX = safeArea / 2 - img.width / 2;
  const offsetY = safeArea / 2 - img.height / 2;

  const cropData = rotCtx.getImageData(
    pixelCrop.x + offsetX,
    pixelCrop.y + offsetY,
    pixelCrop.width,
    pixelCrop.height,
  );

  // ── 第三步：绘制到输出画布并加圆形裁剪 ─────────────────────────────
  const outCanvas = document.createElement('canvas');
  outCanvas.width = OUTPUT_SIZE;
  outCanvas.height = OUTPUT_SIZE;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('无法创建输出 Canvas 上下文');

  // 把裁剪区域缩放绘制到临时中间画布
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = pixelCrop.width;
  tmpCanvas.height = pixelCrop.height;
  tmpCanvas.getContext('2d')!.putImageData(cropData, 0, 0);

  outCtx.beginPath();
  outCtx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
  outCtx.clip();
  outCtx.drawImage(tmpCanvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas 输出为空'))),
      'image/jpeg',
      0.9,
    );
  });
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  open,
  imageSrc,
  onCancel,
  onConfirm,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      const rawFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

      // 压缩到 300KB 以内，最大分辨率 400px
      const compressed = await imageCompression(rawFile, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.88,
      });

      onConfirm(compressed);
    } catch (err) {
      console.error('裁剪/压缩失败:', err);
    } finally {
      setConfirming(false);
    }
  };

  const handleAfterClose = () => {
    // 关闭后重置状态
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  return (
    <Modal
      title="裁剪头像"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
      className="avatar-crop-modal"
      afterClose={handleAfterClose}
      destroyOnHidden
    >
      {/* 裁剪画布 */}
      <div className="crop-canvas-wrap">
        {imageSrc && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>

      {/* 控制区 */}
      <div className="crop-controls">
        <div className="control-row">
          <Text type="secondary" className="control-label">
            <ZoomOutOutlined />
            &nbsp;缩放
          </Text>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(v) => setZoom(v)}
            className="control-slider"
            tooltip={{
              formatter: (v) => `${Math.round((((v ?? 1) - 1) / 2) * 100)}%`,
            }}
          />
          <ZoomInOutlined className="control-suffix" />
        </div>

        <div className="control-row">
          <Text type="secondary" className="control-label">
            <RotateLeftOutlined />
            &nbsp;旋转
          </Text>
          <Slider
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(v) => setRotation(v)}
            className="control-slider"
            tooltip={{ formatter: (v) => `${v}°` }}
          />
          <Text type="secondary" className="control-suffix">
            {rotation}°
          </Text>
        </div>
      </div>

      <div className="crop-hint">
        <Text type="secondary">
          拖拽移动图片，滚轮可缩放，调整选区到合适位置
        </Text>
      </div>

      {/* 操作按钮 */}
      <div className="crop-footer">
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={confirming} onClick={handleConfirm}>
            确认裁剪
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default AvatarCropModal;
