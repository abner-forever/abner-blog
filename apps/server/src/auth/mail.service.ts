import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // 明确获取配置并提供默认值或类型断言
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);

    if (!host || !port || !user || !pass) {
      this.logger.warn(
        'SMTP 配置不完整，邮件服务可能无法正常工作。请检查 .env 文件。',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: `"ABNER的博客" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: '您的验证码 - ABNER的博客',
      html: `
        <div style="padding: 20px; background-color: #f8fafc; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #4f46e5; margin-bottom: 24px;">验证您的邮箱</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">您好！感谢您使用 ABNER的博客。您的登录验证码如下：</p>
            <div style="margin: 32px 0; padding: 20px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e293b;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">该验证码 5 分钟内有效。如果不是您本人的操作，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2025 ABNER的博客. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`验证码已成功发送至 ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`发送邮件失败至 ${email}:`, error);
      throw error;
    }
  }

  async sendResetPasswordLink(email: string, token: string) {
    const resetLink = `${this.configService.get<string>('web_URL', 'http://localhost:5173')}/reset-password?token=${token}`;
    const mailOptions = {
      from: `"ABNER的博客" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: '重置您的密码 - ABNER的博客',
      html: `
        <div style="padding: 20px; background-color: #f8fafc; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #4f46e5; margin-bottom: 24px;">重置密码</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">您收到此邮件是因为我们收到了您的账户密码重置请求。</p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 24px; font-weight: 600; font-size: 16px;">重置密码</a>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">该链接 1 小时内有效。如果不是您本人的操作，请忽略此邮件。</p>
            <p style="color: #94a3b8; font-size: 14px;">如果按钮无法点击，请直接访问以下链接：<br>${resetLink}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2025 ABNER的博客. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`重置密码链接已成功发送至 ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`发送邮件失败至 ${email}:`, error);
      throw error;
    }
  }
}
