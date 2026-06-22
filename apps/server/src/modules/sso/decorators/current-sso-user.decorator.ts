import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentSSOUser — 参数装饰器
 *
 * 从当前请求中提取 SSO 登录用户信息。
 * 支持按属性提取：@CurrentSSOUser('userId') userId: number
 * 也可获取完整对象：@CurrentSSOUser() user: AdminJwtUser
 */
export const CurrentSSOUser = createParamDecorator(
  (
    data: keyof { userId: number; username: string; role: string } | undefined,
    ctx: ExecutionContext,
  ) => {
    const request: { user?: Record<string, unknown> } = ctx
      .switchToHttp()
      .getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
