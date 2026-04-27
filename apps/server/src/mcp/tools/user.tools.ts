import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { McpRequestContextService } from '../services/mcp-request-context.service';
import type { GetUserInfoInput } from '../schemas';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class UserTools {
  private readonly logger = new Logger(UserTools.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly requestContext: McpRequestContextService,
  ) {}

  // async getUserInfo(params: GetUserInfoInput) {
  //   const userId = params.id ?? this.requestContext.getUserId();
  //   const user = await this.usersService.findById(userId);
  //   return {
  //     content: [{ type: 'text', text: JSON.stringify(user) }],
  //   };
  // }
  async getUserInfo(params: GetUserInfoInput) {
    const requesterUserId = this.requestContext.getUserId();
    const targetUserId = params.id ?? requesterUserId;

    if (!targetUserId) {
      throw new Error(
        '未识别到登录用户，请在 MCP 请求头中携带有效 Bearer Token',
      );
    }

    if (requesterUserId && targetUserId !== requesterUserId) {
      const requester = await this.usersService.findById(requesterUserId);
      if (requester.role !== UserRole.ADMIN) {
        throw new Error('仅管理员可查询其他用户信息');
      }
    }

    const user = await this.usersService.findById(targetUserId);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(user, null, 2),
        },
      ],
      structuredContent: user,
    };
  }
}
