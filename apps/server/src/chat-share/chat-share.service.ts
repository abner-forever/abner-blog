import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareSession } from '../entities/share-session.entity';
import { CreateShareDto, ShareSessionResponseDto } from './dto/create-share.dto';

@Injectable()
export class ChatShareService {
  constructor(
    @InjectRepository(ShareSession)
    private readonly shareSessionRepository: Repository<ShareSession>,
  ) {}

  async create(createShareDto: CreateShareDto, userId: number): Promise<ShareSessionResponseDto> {
    const shareSession = this.shareSessionRepository.create({
      sessionId: createShareDto.sessionId,
      title: createShareDto.title,
      messages: createShareDto.messages,
      createdById: userId,
      isActive: true,
    });

    const saved = await this.shareSessionRepository.save(shareSession);
    return this.toResponseDto(saved);
  }

  async findById(id: string): Promise<ShareSessionResponseDto> {
    const shareSession = await this.shareSessionRepository.findOne({
      where: { id },
    });

    if (!shareSession) {
      throw new NotFoundException('分享会话不存在');
    }

    if (!shareSession.isActive) {
      throw new NotFoundException('分享会话已失效');
    }

    if (shareSession.expiresAt && new Date() > shareSession.expiresAt) {
      throw new NotFoundException('分享会话已过期');
    }

    return this.toResponseDto(shareSession);
  }

  async delete(id: string, userId: number): Promise<void> {
    const shareSession = await this.shareSessionRepository.findOne({
      where: { id, createdById: userId },
    });

    if (!shareSession) {
      throw new NotFoundException('分享会话不存在');
    }

    await this.shareSessionRepository.remove(shareSession);
  }

  private toResponseDto(entity: ShareSession): ShareSessionResponseDto {
    return {
      id: entity.id,
      title: entity.title,
      messages: entity.messages,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
    };
  }
}
