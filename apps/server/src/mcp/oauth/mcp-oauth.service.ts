import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

type CodeChallengeMethod = 'S256' | 'plain';

interface AuthCodeRecord {
  userId: number;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
  expiresAt: number;
}

@Injectable()
export class McpOauthService {
  private readonly authCodes = new Map<string, AuthCodeRecord>();
  private readonly authCodeTtlMs = 5 * 60 * 1000;

  issueAuthorizationCode(input: Omit<AuthCodeRecord, 'expiresAt'>): string {
    this.gcExpiredCodes();
    const code = randomBytes(24).toString('base64url');
    this.authCodes.set(code, {
      ...input,
      expiresAt: Date.now() + this.authCodeTtlMs,
    });
    return code;
  }

  consumeAuthorizationCode(code: string): AuthCodeRecord | null {
    const record = this.authCodes.get(code);
    if (!record) return null;
    this.authCodes.delete(code);
    if (Date.now() > record.expiresAt) return null;
    return record;
  }

  verifyPkce(
    verifier: string,
    challenge: string,
    method: CodeChallengeMethod,
  ): boolean {
    if (!verifier) return false;
    if (method === 'plain') {
      return verifier === challenge;
    }
    const digest = createHash('sha256').update(verifier).digest('base64url');
    return digest === challenge;
  }

  private gcExpiredCodes(): void {
    const now = Date.now();
    for (const [code, record] of this.authCodes.entries()) {
      if (record.expiresAt <= now) {
        this.authCodes.delete(code);
      }
    }
  }
}
