import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface McpRequestContext {
  userId: number | null;
  sessionId: string | null;
}

@Injectable()
export class McpRequestContextService {
  private readonly storage = new AsyncLocalStorage<McpRequestContext>();

  run<T>(context: McpRequestContext, callback: () => Promise<T>): Promise<T> {
    return this.storage.run(context, callback);
  }

  getUserId(): number | null {
    return this.storage.getStore()?.userId ?? null;
  }

  getSessionId(): string | null {
    return this.storage.getStore()?.sessionId ?? null;
  }
}
