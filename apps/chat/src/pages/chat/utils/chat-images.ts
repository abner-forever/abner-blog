export const CHAT_MAX_IMAGES = 4;
export const CHAT_MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export interface ChatImagePayload {
  id: string;
  mimeType: string;
  dataBase64: string;
  previewUrl: string;
}

function normalizeMime(mime: string): string {
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

export function readFileAsChatImage(file: File): Promise<ChatImagePayload> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not_image'));
      return;
    }
    const mimeType = normalizeMime(file.type);
    if (!ALLOWED_MIMES.has(file.type) && !ALLOWED_MIMES.has(mimeType)) {
      reject(new Error('bad_mime'));
      return;
    }
    if (file.size > CHAT_MAX_IMAGE_BYTES) {
      reject(new Error('too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('read_failed'));
        return;
      }
      const comma = dataUrl.indexOf(',');
      if (comma === -1) {
        reject(new Error('read_failed'));
        return;
      }
      const dataBase64 = dataUrl.slice(comma + 1);
      const previewUrl = URL.createObjectURL(file);
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        mimeType,
        dataBase64,
        previewUrl,
      });
    };
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

export function revokeChatImagePreview(item: ChatImagePayload): void {
  URL.revokeObjectURL(item.previewUrl);
}
