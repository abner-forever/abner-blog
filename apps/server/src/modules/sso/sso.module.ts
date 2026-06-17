import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { SSOIdentity } from '../../entities/sso-identity.entity';
import { User } from '../../entities/user.entity';
import { RedisModule } from '../../redis/redis.module';
import { SSOOidcService } from './services/sso-oidc.service';
import { SSOSessionService } from './services/sso-session.service';
import { SSOUserMappingService } from './services/sso-user-mapping.service';
import { SSOAuthController } from './controllers/sso-auth.controller';
import { SSOSessionStrategy } from './strategies/sso-session.strategy';
import { SSOSessionGuard } from './guards/sso-session.guard';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    PassportModule,
    TypeOrmModule.forFeature([SSOIdentity, User]),
  ],
  controllers: [SSOAuthController],
  providers: [
    SSOOidcService,
    SSOSessionService,
    SSOUserMappingService,
    SSOSessionStrategy,
    SSOSessionGuard,
    Logger,
  ],
  exports: [
    SSOSessionService,
    SSOSessionStrategy,
    SSOSessionGuard,
    SSOOidcService,
  ],
})
export class SSOModule {
  constructor(
    private configService: ConfigService,
    private logger: Logger,
  ) {
    const enabled = configService.get<string>('SSO_ENABLED', 'false');
    if (enabled === 'true') {
      this.logger.log('SSO 模块已启用');
    } else {
      this.logger.log('SSO 模块已禁用（SSO_ENABLED=false）');
    }
  }
}
