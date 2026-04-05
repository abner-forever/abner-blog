import type { PreviewItem } from '../types';
import { FileType } from '../types';
import { ImagePreview } from './image-preview';
import { VideoPreview } from './video-preview';

/**
 * 预览管理器 - 统一管理图片和视频预览
 */
export class PreviewManager {
  private currentPreview: ImagePreview | VideoPreview | null = null;

  /**
   * 预览单个文件
   */
  show(item: PreviewItem): void {
    this.close();

    if (item.type === FileType.IMAGE) {
      this.currentPreview = new ImagePreview([item]);
      this.currentPreview.show(() => {
        this.currentPreview = null;
      });
    } else if (item.type === FileType.VIDEO) {
      this.currentPreview = new VideoPreview(item);
      this.currentPreview.show(() => {
        this.currentPreview = null;
      });
    }
  }

  /**
   * 预览多个文件
   */
  preview(items: PreviewItem[], startIndex = 0): void {
    this.close();

    const imageItems = items.filter((item) => item.type === FileType.IMAGE);
    const videoItems = items.filter((item) => item.type === FileType.VIDEO);

    if (imageItems.length > 0) {
      // 如果有图片，先显示图片预览
      this.currentPreview = new ImagePreview(imageItems, startIndex);
      this.currentPreview.show(() => {
        // 图片预览关闭后，如果有视频可以继续预览视频
        this.currentPreview = null;
      });
    } else if (videoItems.length > 0) {
      // 如果只有视频，显示第一个视频
      this.currentPreview = new VideoPreview(videoItems[0]);
      this.currentPreview.show(() => {
        this.currentPreview = null;
      });
    }
  }

  /**
   * 关闭当前预览
   */
  close(): void {
    if (this.currentPreview) {
      if (this.currentPreview instanceof ImagePreview) {
        this.currentPreview.close();
      } else if (this.currentPreview instanceof VideoPreview) {
        this.currentPreview.close();
      }
      this.currentPreview = null;
    }
  }
}

// 导出单例
export const previewManager = new PreviewManager();
