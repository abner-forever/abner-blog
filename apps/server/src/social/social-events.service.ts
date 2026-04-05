import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class SocialEventsService {
  private server: Server | null = null;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: number, event: string, data: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }
}
