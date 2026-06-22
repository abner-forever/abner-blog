import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import * as fs from 'fs';

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const extFromMimetype: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const allowedMimetypes = new Set(Object.keys(extFromMimetype));

function imageFilename(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
): void {
  const uniqueSuffix = uuidv4();
  const ext =
    extname(file.originalname) || extFromMimetype[file.mimetype] || '.png';
  const originalName = file.originalname.replace(/\.[^/.]+$/, '');
  callback(null, `${originalName}_${uniqueSuffix}${ext}`);
}

function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  const hasValidExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
  const hasValidMime = allowedMimetypes.has(file.mimetype);
  if (!hasValidExt && !hasValidMime) {
    callback(new Error('只允许上传图片文件！'), false);
    return;
  }
  callback(null, true);
}

/** Pages 模块专用 multer 配置：图片存储至 uploads/assets/image/pages/ */
export const pagesImageMulterOptions = {
  storage: diskStorage({
    destination(
      _req: Request,
      _file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ): void {
      const uploadDir = join(
        process.cwd(),
        'uploads',
        'assets',
        'image',
        'pages',
      );
      ensureDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: imageFilename,
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};

@Injectable()
export class PagesAssetsService {
  /**
   * 构建图片访问 URL
   */
  buildImageUrl(req: Request, filename: string): string {
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.CDN_URL || `${protocol}://${host}`;
    return `${baseUrl}/assets/image/pages/${filename}`;
  }
}
