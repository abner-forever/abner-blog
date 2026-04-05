import { spawn } from 'child_process';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import type { NextFunction, Request, Response } from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { normalizeBusinessPath } from './utils/business-path';

/**
 * 视频封面抽帧（示例）：
 * http://localhost:8080/assets/video/notes/test1_xxx.mp4?cover=1&t=2&w=640&h=360
 */
function normalizeQueryNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export function registerVideoCoverRoute(
  app: NestExpressApplication,
  uploadsRoot: string,
): void {
  const assetsVideoRoot = join(uploadsRoot, 'assets', 'video');
  const videoCoversDir = join(assetsVideoRoot, '.covers');
  if (!existsSync(videoCoversDir)) {
    mkdirSync(videoCoversDir, { recursive: true });
  }

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get(
    '/assets/video/:business/:filename',
    async (req: Request, res: Response, next: NextFunction) => {
      const needCover = req.query.cover === '1' || req.query.vframe === '1';
      if (!needCover) {
        return next();
      }

      let business: string;
      try {
        business = normalizeBusinessPath(
          String(
            Array.isArray(req.params.business)
              ? req.params.business[0]
              : req.params.business,
          ),
        );
      } catch {
        return res.status(400).json({ message: '非法业务路径' });
      }

      const filenameParam = req.params.filename;
      const filename = Array.isArray(filenameParam)
        ? filenameParam[0]
        : filenameParam;
      const businessRoot = join(assetsVideoRoot, business);
      const safeVideoPath = join(businessRoot, filename);
      if (!safeVideoPath.startsWith(businessRoot)) {
        return res.status(400).json({ message: '非法视频路径' });
      }
      if (!existsSync(safeVideoPath)) {
        return res.status(404).json({ message: '视频不存在' });
      }

      const t = normalizeQueryNumber(req.query.t, 1);
      const width = Math.floor(normalizeQueryNumber(req.query.w, 0));
      const height = Math.floor(normalizeQueryNumber(req.query.h, 0));
      const coverName = `${sanitizeFilename(business)}_${sanitizeFilename(filename)}_${t}_${width || 'auto'}x${height || 'auto'}.jpg`;
      const coverPath = join(videoCoversDir, coverName);

      try {
        if (!existsSync(coverPath)) {
          const ffmpegArgs = [
            '-ss',
            String(t),
            '-i',
            safeVideoPath,
            '-frames:v',
            '1',
          ];
          if (width > 0 || height > 0) {
            const scale = `scale=${width > 0 ? width : -1}:${height > 0 ? height : -1}`;
            ffmpegArgs.push('-vf', scale);
          }
          ffmpegArgs.push('-q:v', '2', '-y', coverPath);

          await new Promise<void>((resolve, reject) => {
            const child = spawn('ffmpeg', ffmpegArgs, { stdio: 'ignore' });
            child.on('error', reject);
            child.on('close', (code) => {
              if (code === 0) {
                resolve();
                return;
              }
              reject(new Error(`ffmpeg exited with code ${code}`));
            });
          });
        }

        const coverBuffer = await fsPromises.readFile(coverPath);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(coverBuffer);
      } catch (error) {
        return res
          .status(500)
          .json({ message: `生成视频封面失败: ${(error as Error).message}` });
      }
    },
  );
}
