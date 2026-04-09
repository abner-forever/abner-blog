import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemAnnouncement } from '../../../entities/system-announcement.entity';
import { NotificationsService } from '../../../social/services';
import { sanitizeAnnouncementHtml } from '../../../social/utils/sanitize-announcement-html';
import {
  CreateSystemAnnouncementDto,
  SystemAnnouncementQueryDto,
  UpdateSystemAnnouncementDto,
} from '../dto/system-announcement-manage.dto';

@Injectable()
export class AdminSystemAnnouncementsService {
  constructor(
    @InjectRepository(SystemAnnouncement)
    private readonly systemAnnouncementRepository: Repository<SystemAnnouncement>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getSystemAnnouncements(query: SystemAnnouncementQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const [list, total] = await this.systemAnnouncementRepository.findAndCount({
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async createSystemAnnouncement(dto: CreateSystemAnnouncementDto) {
    const row = this.systemAnnouncementRepository.create({
      title: dto.title,
      bodyRich: sanitizeAnnouncementHtml(dto.bodyRich),
      imageUrls: dto.imageUrls?.length ? dto.imageUrls : null,
      sortOrder: dto.sortOrder ?? 0,
      published: false,
    });
    return this.systemAnnouncementRepository.save(row);
  }

  async getSystemAnnouncementById(id: number) {
    const row = await this.systemAnnouncementRepository.findOne({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('系统通知不存在');
    }
    return row;
  }

  async updateSystemAnnouncement(id: number, dto: UpdateSystemAnnouncementDto) {
    const row = await this.getSystemAnnouncementById(id);
    if (dto.title !== undefined) {
      row.title = dto.title;
    }
    if (dto.bodyRich !== undefined) {
      row.bodyRich = sanitizeAnnouncementHtml(dto.bodyRich);
    }
    if (dto.imageUrls !== undefined) {
      row.imageUrls = dto.imageUrls?.length ? dto.imageUrls : null;
    }
    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }
    return this.systemAnnouncementRepository.save(row);
  }

  async deleteSystemAnnouncement(id: number) {
    await this.getSystemAnnouncementById(id);
    await this.systemAnnouncementRepository.delete({ id });
  }

  async publishSystemAnnouncement(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (row.published) {
      return { announcement: row, notificationsCreated: 0 };
    }
    row.published = true;
    row.publishedAt = new Date();
    row.recalledAt = null;
    row.notifyRevision = 1;
    await this.systemAnnouncementRepository.save(row);
    const { created } =
      await this.notificationsService.createForAllUsersFromAnnouncement(row);
    return { announcement: row, notificationsCreated: created };
  }

  async recallSystemAnnouncement(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (!row.published) {
      throw new BadRequestException('未发布的通知不能撤回');
    }
    if (row.recalledAt) {
      throw new BadRequestException('该通知已撤回');
    }
    row.recalledAt = new Date();
    await this.systemAnnouncementRepository.save(row);
    const { updated } =
      await this.notificationsService.bulkMarkRecalledForAnnouncement(row.id);
    return { announcement: row, notificationsUpdated: updated };
  }

  async syncSystemAnnouncementNotifications(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (!row.published) {
      throw new BadRequestException('仅已发布的通知可重新推送');
    }
    row.notifyRevision = (row.notifyRevision ?? 0) + 1;
    if (row.notifyRevision < 1) {
      row.notifyRevision = 1;
    }
    row.recalledAt = null;
    await this.systemAnnouncementRepository.save(row);
    const { updated, created } =
      await this.notificationsService.syncAnnouncementFeeds(row);
    return {
      announcement: row,
      notificationsUpdated: updated,
      notificationsCreated: created,
    };
  }
}
