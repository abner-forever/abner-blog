import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import type { Request } from 'express';
import { normalizeBusinessPath } from '../upload/utils/business-path';

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
) {
  const uniqueSuffix = uuidv4();
  const ext =
    extname(file.originalname) || extFromMimetype[file.mimetype] || '.png';
  const originalName = file.originalname.replace(/\.[^/.]+$/, '');
  callback(null, `${originalName}_${uniqueSuffix}${ext}`);
}

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const hasValidExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
  const hasValidMime = allowedMimetypes.has(file.mimetype);
  if (!hasValidExt && !hasValidMime) {
    return callback(new Error('只允许上传图片文件！'), false);
  }
  callback(null, true);
};

const imageLimits = { fileSize: 5 * 1024 * 1024 };

/**
 * 图片落盘：uploads/assets/image/{businessPath}/
 * query.businessPath，默认 common
 */
export function multerImageStorageByBusinessPath() {
  return diskStorage({
    destination: (req, _file, cb) => {
      try {
        const businessPath = normalizeBusinessPath(
          req.query?.businessPath as string | undefined,
        );
        const uploadDir = join(
          process.cwd(),
          'uploads',
          'assets',
          'image',
          businessPath,
        );
        ensureDir(uploadDir);
        cb(null, uploadDir);
      } catch (e) {
        if (e instanceof BadRequestException) {
          cb(e, '');
          return;
        }
        cb(e instanceof Error ? e : new Error(String(e)), '');
      }
    },
    filename: imageFilename,
  });
}

export const imageMulterOptionsByBusinessPath = {
  storage: multerImageStorageByBusinessPath(),
  fileFilter: imageFileFilter,
  limits: imageLimits,
};
