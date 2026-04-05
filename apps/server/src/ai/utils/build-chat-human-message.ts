import { HumanMessage } from '@langchain/core/messages';
import type { ChatImageDto } from '../dto/chat.dto';

function normalizeMime(mime: string): string {
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

/**
 * 构建聊天用户消息：支持纯文本或多模态（图片 + 文本）。
 * 图片以 data URL 形式嵌入，供各厂商在 model 层映射。
 */
export function buildChatHumanMessage(
  textPrompt: string,
  images?: ChatImageDto[],
): HumanMessage {
  if (!images?.length) {
    return new HumanMessage(textPrompt);
  }
  // 文本在前、图片在后：与 MiniMax / OpenAI 等官方多模态示例一致，避免部分网关只认首段文本
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'text', text: textPrompt }];
  for (const img of images) {
    const mime = normalizeMime(img.mimeType);
    content.push({
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${img.dataBase64}` },
    });
  }
  return new HumanMessage({ content });
}
