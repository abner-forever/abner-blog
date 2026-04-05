import { authControllerCaptchaConfig } from '@services/generated/auth/auth';
import {
  showTencentCaptcha,
  type TencentCaptchaShowOptions,
} from './showTencentCaptcha';
import { loadTJCaptchaScript } from './loadTJCaptchaScript';
import { buildDefaultTencentCaptchaShowOptions } from './captchaAppearance';

function parseEnvCaptchaScale(): number | undefined {
  const raw = import.meta.env.VITE_TENCENT_CAPTCHA_SCALE as string | undefined;
  if (raw == null || String(raw).trim() === '') return undefined;
  const n = parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseEnvCaptchaLoading(): boolean | undefined {
  const raw = import.meta.env.VITE_TENCENT_CAPTCHA_LOADING as string | undefined;
  if (raw == null || String(raw).trim() === '') return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === 'false') return false;
  if (s === '1' || s === 'true') return true;
  return undefined;
}

/** 随登录 / 发码 请求提交的验证码字段（未启用时为空对象） */
export type AuthCaptchaFields = {
  captchaTicket?: string;
  captchaRandstr?: string;
};

/**
 * 若服务端已启用腾讯云验证码：加载脚本并弹出验证，返回 ticket/randstr；
 * 未启用则返回 {}。
 *
 * @param appearanceOverrides 覆盖默认外观（默认已与站点深色模式、i18n 语言对齐；可传 loading、scale、sdkOpts 等）
 */
export async function resolveAuthCaptchaFields(
  appearanceOverrides?: Partial<TencentCaptchaShowOptions>,
): Promise<AuthCaptchaFields> {
  const config = await authControllerCaptchaConfig();
  if (!config.enabled || config.captchaAppId == null) {
    return {};
  }
  await loadTJCaptchaScript();
  const envScale = parseEnvCaptchaScale();
  const envLoading = parseEnvCaptchaLoading();
  const showOptions: TencentCaptchaShowOptions = {
    ...buildDefaultTencentCaptchaShowOptions(),
    ...(envScale != null ? { scale: envScale } : {}),
    ...(envLoading !== undefined ? { loading: envLoading } : {}),
    ...appearanceOverrides,
  };
  const { ticket, randstr } = await showTencentCaptcha(
    config.captchaAppId,
    showOptions,
  );
  return { captchaTicket: ticket, captchaRandstr: randstr };
}
