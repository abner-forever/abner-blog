import { z } from 'zod';

/** 获取用户信息参数 */
export const GetUserInfoSchema = z.object({
  id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('用户 ID；不传时默认查询当前登录用户'),
});

export type GetUserInfoInput = z.infer<typeof GetUserInfoSchema>;
