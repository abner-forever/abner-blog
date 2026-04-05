import type { PreviewItem } from '../types';

/**
 * 视频预览管理器
 */
export class VideoPreview {
  private item: PreviewItem;
  private container: HTMLElement | null = null;
  private onClose?: () => void;

  constructor(item: PreviewItem) {
    this.item = item;
  }

  /**
   * 显示预览
   */
  show(onClose?: () => void): void {
    this.onClose = onClose;
    this.render();
  }

  /**
   * 关闭预览
   */
  close(): void {
    if (this.container) {
      const video = this.container.querySelector('video');
      if (video) {
        video.pause();
      }
      this.container.remove();
      this.container = null;
    }
    this.onClose?.();
  }

  /**
   * 渲染预览
   */
  private render(): void {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'video-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    // 创建视频容器
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-preview-container';
    videoContainer.style.cssText = `
      position: relative;
      width: 90vw;
      max-width: 1200px;
    `;

    // 创建视频元素
    const video = document.createElement('video');
    video.src = this.item.url;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = `
      width: 100%;
      max-height: 80vh;
      border-radius: 8px;
    `;

    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'video-preview-close';
    closeBtn.style.cssText = `
      position: absolute;
      top: -50px;
      right: 0;
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 24px;
      cursor: pointer;
      border-radius: 50%;
    `;
    closeBtn.onclick = () => this.close();

    // 创建文件名
    const name = document.createElement('div');
    name.textContent = this.item.name || '视频预览';
    name.style.cssText = `
      color: white;
      text-align: center;
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.7;
    `;

    videoContainer.appendChild(video);
    videoContainer.appendChild(closeBtn);
    videoContainer.appendChild(name);
    overlay.appendChild(videoContainer);

    // ESC 关闭
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    this.container = overlay;
    document.body.appendChild(overlay);
  }
}
