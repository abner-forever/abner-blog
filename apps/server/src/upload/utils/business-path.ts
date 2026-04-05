import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

/** 与分片临时目录等冲突的业务路径关键字 */
const RESERVED = new Set(['chunks']);

/**
 * 业务路径：用于 assets/{image|video|file}/{businessPath}/...
 * 仅允许小写字母、数字、下划线、连字符，默认 common
 */
export function normalizeBusinessPath(raw?: string): string {
  const key = (
    raw?.trim() && raw.trim().length > 0 ? raw.trim() : 'common'
  ).toLowerCase();
  if (!/^[a-z0-9_-]{1,64}$/.test(key)) {
    throw new BadRequestException('非法的业务路径 businessPath');
  }
  if (RESERVED.has(key)) {
    throw new BadRequestException('不能使用保留的业务路径');
  }
  return key;
}

export function resolveBusinessPathFromQuery(req: Request): string {
  return normalizeBusinessPath(req.query?.businessPath as string | undefined);
}
