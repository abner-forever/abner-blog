import {
  Injectable,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { captcha } from 'tencentcloud-sdk-nodejs-captcha';
import { CaptchaConfigResponseDto } from '../dto/captcha-config.response.dto';

const CAPTCHA_TYPE_WEB = 9;
const CAPTCHA_OK_CODE = 1;

@Injectable()
export class TencentCaptchaService {
  private readonly logger = new Logger(TencentCaptchaService.name);
  private runtimeBypassUntilMs = 0;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 显式关闭人机验证（套餐过期等场景）：
   * - TENCENT_CAPTCHA_DISABLED=true / 1 / yes / on
   * - TENCENT_CAPTCHA_ENABLED=false / 0 / no / off
   * 此时 /auth/captcha-config 返回 enabled:false，登录/发码不再要求 ticket。
   */
  private isExplicitlyDisabled(): boolean {
    const disabled = this.configService
      .get<string>('TENCENT_CAPTCHA_DISABLED')
      ?.trim()
      .toLowerCase();
    if (disabled && ['true', '1', 'yes', 'on'].includes(disabled)) {
      return true;
    }
    const enabled = this.configService
      .get<string>('TENCENT_CAPTCHA_ENABLED')
      ?.trim()
      .toLowerCase();
    if (enabled && ['false', '0', 'no', 'off'].includes(enabled)) {
      return true;
    }
    return false;
  }

  private isRuntimeBypassed(): boolean {
    return this.runtimeBypassUntilMs > Date.now();
  }

  private markRuntimeBypass(minutes = 30): void {
    this.runtimeBypassUntilMs = Date.now() + minutes * 60 * 1000;
  }

  isEnabled(): boolean {
    if (this.isExplicitlyDisabled() || this.isRuntimeBypassed()) {
      return false;
    }
    const secretId = this.configService.get<string>('TENCENTCLOUD_SECRET_ID');
    const secretKey = this.configService.get<string>('TENCENTCLOUD_SECRET_KEY');
    const appId = this.configService.get<string>('TENCENT_CAPTCHA_APP_ID');
    const appSecret = this.configService.get<string>(
      'TENCENT_CAPTCHA_APP_SECRET_KEY',
    );
    const idNum = appId?.trim() ? parseInt(appId.trim(), 10) : NaN;
    return Boolean(
      secretId?.trim() &&
        secretKey?.trim() &&
        appId?.trim() &&
        appSecret?.trim() &&
        Number.isFinite(idNum),
    );
  }

  getCaptchaAppId(): number | null {
    const raw = this.configService.get<string>('TENCENT_CAPTCHA_APP_ID');
    if (!raw?.trim()) {
      return null;
    }
    const n = parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  getPublicConfig(): CaptchaConfigResponseDto {
    const enabled = this.isEnabled();
    return {
      enabled,
      captchaAppId: enabled ? this.getCaptchaAppId() : null,
    };
  }

  /**
   * 未启用时直接通过；启用时校验 ticket/randstr 并调用腾讯云 DescribeCaptchaResult。
   */
  async verifyTicket(params: {
    ticket: string | undefined;
    randstr: string | undefined;
    userIp: string;
  }): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const { ticket, randstr, userIp } = params;
    const trimmedTicket = ticket?.trim();
    const trimmedRand = randstr?.trim();

    if (!trimmedTicket || !trimmedRand) {
      throw new BadRequestException('请完成人机验证');
    }

    if (trimmedTicket.startsWith('trerror_')) {
      throw new BadRequestException('人机验证不可用，请刷新页面后重试');
    }

    const secretId = this.configService
      .get<string>('TENCENTCLOUD_SECRET_ID')
      ?.trim();
    const secretKey = this.configService
      .get<string>('TENCENTCLOUD_SECRET_KEY')
      ?.trim();
    const appSecret = this.configService
      .get<string>('TENCENT_CAPTCHA_APP_SECRET_KEY')
      ?.trim();
    const captchaAppId = this.getCaptchaAppId();
    if (!secretId || !secretKey || !appSecret || captchaAppId === null) {
      throw new ServiceUnavailableException('验证码配置无效');
    }

    const Client = captcha.v20190722.Client;
    const client = new Client({
      credential: { secretId, secretKey },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'captcha.tencentcloudapi.com',
        },
      },
    });

    try {
      const res = await client.DescribeCaptchaResult({
        CaptchaType: CAPTCHA_TYPE_WEB,
        Ticket: trimmedTicket,
        Randstr: trimmedRand,
        UserIp: userIp?.trim() || '127.0.0.1',
        CaptchaAppId: captchaAppId,
        AppSecretKey: appSecret,
      });

      if (res.CaptchaCode !== CAPTCHA_OK_CODE) {
        const codeText = String(res.CaptchaCode ?? '');
        const msgText = String(res.CaptchaMsg ?? '');
        if (this.shouldBypassForQuotaOrServiceIssue(`${codeText} ${msgText}`)) {
          this.markRuntimeBypass();
          this.logger.warn(
            `Captcha quota/service issue detected from response, bypass and disable captcha for 30 minutes: code=${codeText} msg=${msgText}`,
          );
          return;
        }
        this.logger.warn(
          `Captcha verify failed: code=${String(res.CaptchaCode)} msg=${res.CaptchaMsg ?? ''}`,
        );
        throw new BadRequestException('人机验证未通过，请重试');
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      if (this.shouldBypassForQuotaOrServiceIssue(err)) {
        this.markRuntimeBypass();
        this.logger.warn(
          `Captcha service unavailable or quota expired, bypass verification and disable captcha for 30 minutes: ${this.stringifyCaptchaError(err)}`,
        );
        return;
      }
      const errDetail =
        err instanceof Error
          ? err.stack
          : typeof err === 'object' && err !== null
            ? JSON.stringify(err)
            : 'unknown error';
      this.logger.error('Tencent DescribeCaptchaResult error', errDetail);
      throw new BadRequestException('人机验证校验失败，请稍后重试');
    }
  }

  private shouldBypassForQuotaOrServiceIssue(input: unknown): boolean {
    const message = this.stringifyCaptchaError(input).toLowerCase();
    return (
      message.includes('resourceinsufficient') ||
      message.includes('insufficient') ||
      message.includes('quota') ||
      message.includes('balance') ||
      message.includes('套餐') ||
      message.includes('余量') ||
      message.includes('额度') ||
      message.includes('欠费') ||
      message.includes('captchaservice') ||
      message.includes('service unavailable')
    );
  }

  private stringifyCaptchaError(err: unknown): string {
    if (err instanceof Error) {
      return `${err.name}: ${err.message}`;
    }
    if (typeof err === 'object' && err !== null) {
      try {
        return JSON.stringify(err);
      } catch {
        return 'captcha_error_object';
      }
    }
    if (typeof err === 'string') return err;
    if (typeof err === 'number' || typeof err === 'boolean') {
      return `${err}`;
    }
    return 'unknown_error';
  }
}
