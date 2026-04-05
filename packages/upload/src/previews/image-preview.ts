import type { PreviewItem } from '../types';
import { FileType } from '../types';

/**
 * 图片预览管理器
 */
export class ImagePreview {
  private currentIndex: number = 0;
  private items: PreviewItem[] = [];
  private container: HTMLElement | null = null;
  private onClose?: () => void;

  constructor(items: PreviewItem[], startIndex = 0) {
    this.items = items.filter((item) => item.type === FileType.IMAGE);
    this.currentIndex = startIndex;
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
      this.container.remove();
      this.container = null;
    }
    this.onClose?.();
  }

  /**
   * 渲染预览
   */
  private render(): void {
    if (this.items.length === 0) return;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'image-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    // 创建图片容器
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-preview-container';
    imgContainer.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    `;

    // 创建图片
    const img = document.createElement('img');
    img.src = this.items[this.currentIndex].url;
    img.style.cssText = `
      max-width: 90vw;
      max-height: 85vh;
      object-fit: contain;
    `;

    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'image-preview-close';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
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

    // 创建导航按钮
    if (this.items.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = '‹';
      prevBtn.style.cssText = `
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 36px;
        cursor: pointer;
        border-radius: 50%;
      `;
      prevBtn.onclick = () => this.prev();

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = '›';
      nextBtn.style.cssText = `
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 36px;
        cursor: pointer;
        border-radius: 50%;
      `;
      nextBtn.onclick = () => this.next();

      imgContainer.appendChild(prevBtn);
      imgContainer.appendChild(nextBtn);
    }

    // 创建指示器
    const indicator = document.createElement('div');
    indicator.className = 'image-preview-indicator';
    indicator.textContent = `${this.currentIndex + 1} / ${this.items.length}`;
    indicator.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.5);
      padding: 5px 15px;
      border-radius: 20px;
    `;

    imgContainer.appendChild(img);
    imgContainer.appendChild(closeBtn);
    imgContainer.appendChild(indicator);
    overlay.appendChild(imgContainer);

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

  /**
   * 上一张
   */
  private prev(): void {
    this.currentIndex =
      (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.updateImage();
  }

  /**
   * 下一张
   */
  private next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.updateImage();
  }

  /**
   * 更新图片
   */
  private updateImage(): void {
    const container = this.container;
    if (!container) return;

    const img = container.querySelector('img');
    const indicator = container.querySelector('.image-preview-indicator');

    if (img) {
      img.src = this.items[this.currentIndex].url;
    }
    if (indicator) {
      indicator.textContent = `${this.currentIndex + 1} / ${this.items.length}`;
    }
  }
}
