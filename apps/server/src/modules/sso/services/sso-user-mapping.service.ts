import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { SSOIdentity } from '../../../entities/sso-identity.entity';

interface KeycloakClaims {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

/**
 * SSOUserMappingService — 用户映射
 *
 * 职责：
 * 1. 按 sub 查询 sso_identity 表 → 找到本地 user.id
 * 2. 若未找到，尝试按邮箱匹配 User.email
 * 3. 若仍未找到且 SSO_AUTO_PROVISION=true，自动创建本地 User
 * 4. 写入 sso_identity 关联记录
 */
@Injectable()
export class SSOUserMappingService {
  private readonly logger = new Logger(SSOUserMappingService.name);
  private readonly autoProvision: boolean;
  private readonly defaultRole: UserRole;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SSOIdentity)
    private ssoIdentityRepository: Repository<SSOIdentity>,
    private configService: ConfigService,
  ) {
    this.autoProvision =
      this.configService.get<string>('SSO_AUTO_PROVISION', 'true') === 'true';
    this.defaultRole =
      (this.configService.get<string>(
        'SSO_DEFAULT_ROLE',
        'admin',
      ) as UserRole) || UserRole.ADMIN;
  }

  /**
   * 根据 Keycloak 用户信息查找或创建本地用户
   * @param claims ID Token 中的用户声明
   * @returns 本地 User 实体
   * @throws UnauthorizedException 当无法映射且自动创建关闭时
   */
  async findOrCreateLocalUser(claims: KeycloakClaims): Promise<User> {
    const { sub, email } = claims;

    // 1. 按 sub 查询 sso_identity 表
    const identity = await this.ssoIdentityRepository.findOne({
      where: { keycloakSub: sub },
      relations: ['user'],
    });

    if (identity?.user) {
      // 检查用户状态
      if (identity.user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('用户已被禁用');
      }
      this.logger.log(
        `SSO 用户映射命中（sub）: keycloakSub=${sub}, userId=${identity.user.id}`,
      );
      return identity.user;
    }

    // 2. 按邮箱匹配
    if (email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        // 关联并写入 sso_identity
        await this.linkIdentity(existingUser.id, sub);
        this.logger.log(
          `SSO 用户映射命中（email）: email=${email}, userId=${existingUser.id}`,
        );
        return existingUser;
      }
    }

    // 3. 自动创建
    if (this.autoProvision) {
      const newUser = await this.provisionLocalUser(claims);
      await this.linkIdentity(newUser.id, sub);
      this.logger.log(
        `SSO 用户自动创建: username=${newUser.username}, userId=${newUser.id}`,
      );
      return newUser;
    }

    // 4. 无匹配且未开启自动创建
    this.logger.warn(
      `SSO 用户映射失败，无匹配用户且自动创建关闭: sub=${sub}, email=${email}`,
    );
    throw new UnauthorizedException('未授权访问，请联系管理员开通 SSO 权限');
  }

  /**
   * 写入 sso_identity 关联记录
   */
  async linkIdentity(localUserId: number, keycloakSub: string): Promise<void> {
    const identity = this.ssoIdentityRepository.create({
      userId: localUserId,
      keycloakSub,
      idp: 'keycloak',
    });

    await this.ssoIdentityRepository.save(identity);
    this.logger.log(
      `SSO Identity 关联创建: userId=${localUserId}, keycloakSub=${keycloakSub}`,
    );
  }

  /**
   * 删除 sso_identity 关联记录（解除绑定）
   */
  async unlinkIdentity(keycloakSub: string): Promise<void> {
    await this.ssoIdentityRepository.delete({ keycloakSub });
    this.logger.log(`SSO Identity 关联已删除: keycloakSub=${keycloakSub}`);
  }

  /**
   * 自动创建本地用户
   * 生成 username 时处理重名情况
   */
  private async provisionLocalUser(claims: KeycloakClaims): Promise<User> {
    const { email, preferred_username } = claims;

    // 生成唯一 username
    let baseUsername = preferred_username || email?.split('@')[0] || 'sso-user';
    // 确保符合 username 要求（小写字母开头，只含字母数字）
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!baseUsername || !/^[a-zA-Z]/.test(baseUsername)) {
      baseUsername = 'sso-user';
    }

    const username = await this.generateUniqueUsername(baseUsername);

    const user = this.userRepository.create({
      username,
      email: email || `${username}@sso.local`,
      nickname: claims.name || preferred_username || username,
      role: this.defaultRole,
      status: UserStatus.ACTIVE,
      // SSO 用户无需本地密码
      password: '',
    });

    return this.userRepository.save(user);
  }

  /**
   * 生成唯一的 username（处理后缀重名）
   */
  private async generateUniqueUsername(base: string): Promise<string> {
    const existing = await this.userRepository.findOne({
      where: { username: base },
    });

    if (!existing) {
      return base;
    }

    // 追加数字后缀直到唯一
    for (let i = 1; i < 1000; i++) {
      const candidate = `${base}-${i}`;
      const exist = await this.userRepository.findOne({
        where: { username: candidate },
      });
      if (!exist) return candidate;
    }

    // 极低概率：用时间戳
    return `${base}-${Date.now()}`;
  }
}
