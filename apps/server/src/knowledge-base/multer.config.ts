import { memoryStorage } from 'multer';

export const knowledgeBaseMulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
