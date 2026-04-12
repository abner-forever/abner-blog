import { BadRequestException } from '@nestjs/common';
import type { ChatImageDto } from '../dto/chat.dto';

export const MAX_CHAT_IMAGE_BYTES = 4 * 1024 * 1024;

export function validateChatImages(images?: ChatImageDto[]): void {
  if (!images?.length) return;
  for (const img of images) {
    const buf = Buffer.from(img.dataBase64, 'base64');
    if (!buf.length || buf.length > MAX_CHAT_IMAGE_BYTES) {
      throw new BadRequestException(
        `单张图片过大或无效，请压缩后重试（最大 ${MAX_CHAT_IMAGE_BYTES / 1024 / 1024}MB）`,
      );
    }
  }
}

export function toHistoryUserText(
  message: string,
  images?: ChatImageDto[],
): string {
  const text = message.trim();
  if (images?.length) {
    const tag = `[图片×${images.length}]`;
    return text ? `${tag} ${text}` : tag;
  }
  return text;
}

/** 联网轮次写入会话历史：保留用户原话 + 截断后的检索摘要，便于多轮追问「总结上文」时仍有事实依据 */
const MAX_SEARCH_DIGEST_IN_HISTORY_CHARS = 4500;

export function buildChatHistoryUserLine(
  message: string,
  images: ChatImageDto[] | undefined,
  searchDigest?: string,
): string {
  const base = toHistoryUserText(message, images);
  const d = searchDigest?.trim();
  if (!d) return base;
  const clipped =
    d.length > MAX_SEARCH_DIGEST_IN_HISTORY_CHARS
      ? `${d.slice(0, MAX_SEARCH_DIGEST_IN_HISTORY_CHARS)}…`
      : d;
  return `${base}\n\n【检索摘要（供后续多轮引用）】\n${clipped}`;
}
