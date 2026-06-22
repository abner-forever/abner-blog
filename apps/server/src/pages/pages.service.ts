import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Page } from './entities/page.entity';
import { PageVersion } from './entities/page-version.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto, PublishPageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { CreateTranslationDto } from './dto/create-translation.dto';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pagesRepository: Repository<Page>,
    @InjectRepository(PageVersion)
    private readonly versionRepository: Repository<PageVersion>,
  ) {}

  /** 记录页面版本快照 */
  private async recordVersion(page: Page): Promise<void> {
    try {
      if (!page.schema) return;
      const lastVersion = await this.versionRepository.findOne({
        where: { pageId: page.id },
        order: { versionNumber: 'DESC' },
      });
      const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;
      await this.versionRepository.save(
        this.versionRepository.create({
          pageId: page.id,
          versionNumber,
          title: page.title,
          schema: page.schema,
          status: page.status,
        }),
      );
    } catch (err) {
      this.logger.warn(`记录版本失败 (page #${page.id}): ${err}`);
    }
  }

  async create(dto: CreatePageDto): Promise<Page> {
    const existing = await this.pagesRepository.findOne({
      where: { slug: dto.slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" 已存在`);
    }

    const page = this.pagesRepository.create({
      ...dto,
      schema: '',
      status: 'draft',
      locale: dto.locale || 'zh-CN',
      reviewStatus: 'draft',
    });

    return this.pagesRepository.save(page);
  }

  async findAll(query: PageQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      status,
      keyword,
      withDeleted,
      deleted,
      locale,
      reviewStatus,
      translationGroupId,
    } = query;

    // 回收站模式：仅查询已软删除的页面
    if (deleted) {
      const [list] = await this.pagesRepository.findAndCount({
        where: keyword
          ? [
              { title: Like(`%${keyword}%`) },
              { description: Like(`%${keyword}%`) },
            ]
          : undefined,
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        withDeleted: true,
        // 仅已删除：在 where 中过滤 deletedAt IS NOT NULL
      });
      // 手动过滤未删除的（TypeORM withDeleted 会返回全部）
      const deletedList = list.filter((p) => p.deletedAt !== null);
      return {
        list: deletedList,
        total: deletedList.length,
        page,
        pageSize,
        totalPages: Math.ceil(deletedList.length / pageSize),
      };
    }

    const baseWhere: Record<string, unknown> = {};
    if (status) {
      baseWhere.status = status;
    }
    if (locale) {
      baseWhere.locale = locale;
    }
    if (reviewStatus) {
      baseWhere.reviewStatus = reviewStatus;
    }
    if (translationGroupId !== undefined) {
      baseWhere.translationGroupId = translationGroupId;
    }

    // 搜索同时匹配 title 和 description
    const where = keyword
      ? [
          { ...baseWhere, title: Like(`%${keyword}%`) },
          { ...baseWhere, description: Like(`%${keyword}%`) },
        ]
      : baseWhere;

    const [list, total] = await this.pagesRepository.findAndCount({
      where: where as FindOptionsWhere<Page> | FindOptionsWhere<Page>[],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      withDeleted: withDeleted === true,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { id },
    });
    if (!page) {
      throw new NotFoundException(`页面 #${id} 不存在`);
    }
    return page;
  }

  async update(id: number, dto: UpdatePageDto): Promise<Page> {
    const page = await this.findOne(id);

    if (dto.slug && dto.slug !== page.slug) {
      const existing = await this.pagesRepository.findOne({
        where: { slug: dto.slug },
        withDeleted: true,
      });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" 已存在`);
      }
    }

    Object.assign(page, dto);
    const saved = await this.pagesRepository.save(page);
    return saved;
  }

  async publish(id: number, dto: PublishPageDto): Promise<Page> {
    const page = await this.findOne(id);

    // 检查内容是否变更：与上次发布时的快照（publishedSchema）对比，而非最新的自动保存内容
    if (page.status === 'published' && page.publishedSchema) {
      try {
        const newSchema = JSON.parse(dto.schema);
        const oldSchema = JSON.parse(page.publishedSchema);
        // 排除 editorData，只比较渲染内容
        delete newSchema.editorData;
        delete oldSchema.editorData;
        if (JSON.stringify(newSchema) === JSON.stringify(oldSchema)) {
          throw new ConflictException('页面内容未变更，无需重复发布');
        }
      } catch (err) {
        if (err instanceof ConflictException) throw err;
        // JSON 解析失败则继续执行发布（降级处理）
      }
    }

    page.schema = dto.schema;
    // 记录本次发布的 schema 快照，供下次发布时比对
    page.publishedSchema = dto.schema;
    page.status = 'published';
    page.publishedAt = new Date();
    if (dto.cover !== undefined) {
      page.cover = dto.cover;
    }

    const saved = await this.pagesRepository.save(page);
    await this.recordVersion(saved);
    return saved;
  }

  async archive(id: number): Promise<Page> {
    const page = await this.findOne(id);

    page.status = 'archived';
    return this.pagesRepository.save(page);
  }

  async remove(id: number): Promise<void> {
    const page = await this.findOne(id);
    await this.pagesRepository.softRemove(page);
  }

  /** 恢复已软删除的页面 */
  async restore(id: number): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!page) {
      throw new NotFoundException(`页面 #${id} 不存在`);
    }
    if (!page.deletedAt) {
      return page; // 未删除，直接返回
    }
    await this.pagesRepository.restore(id);
    page.deletedAt = null;
    return page;
  }

  /** 永久删除（彻底从数据库移除） */
  async hardRemove(id: number): Promise<void> {
    const page = await this.pagesRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!page) {
      throw new NotFoundException(`页面 #${id} 不存在`);
    }
    await this.pagesRepository.remove(page);
  }

  async clone(id: number): Promise<Page> {
    const source = await this.findOne(id);

    // 生成唯一 slug：添加 -copy 后缀，如有冲突递增数字
    let newSlug = `${source.slug}-copy`;
    let slugIndex = 1;
    while (
      await this.pagesRepository.findOne({
        where: { slug: newSlug },
        withDeleted: true,
      })
    ) {
      slugIndex++;
      newSlug = `${source.slug}-copy-${slugIndex}`;
    }

    const newPage = this.pagesRepository.create({
      title: `${source.title} - 副本`,
      slug: newSlug,
      description: source.description,
      keywords: source.keywords,
      ogImage: source.ogImage,
      schema: source.schema,
      status: 'draft',
    });

    return this.pagesRepository.save(newPage);
  }

  /** 应用版本回滚数据（由 VersionService.restore 调用） */
  async applyVersionRestore(
    page: Page,
    data: { schema: string; title?: string },
  ): Promise<Page> {
    page.schema = data.schema;
    if (data.title) {
      page.title = data.title;
    }
    const saved = await this.pagesRepository.save(page);
    await this.recordVersion(saved);
    return saved;
  }

  async findBySlug(slug: string): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { slug, status: 'published' },
    });
    if (!page) {
      throw new NotFoundException('页面不存在');
    }
    return page;
  }

  /** 根据 slug 查找页面（管理端预览用，返回任意状态页面） */
  async findBySlugForAdmin(slug: string): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { slug },
    });
    if (!page) {
      throw new NotFoundException('页面不存在');
    }
    return page;
  }

  /** 根据 ID 查找已发布的页面（公开访问用） */
  async findPublishedById(id: number): Promise<Page> {
    const page = await this.pagesRepository.findOne({
      where: { id, status: 'published' },
    });
    if (!page) {
      throw new NotFoundException('页面不存在');
    }
    return page;
  }

  /* ==================== 多语言 ==================== */

  /** 获取页面的翻译版本列表 */
  async findTranslations(id: number): Promise<Page[]> {
    const page = await this.findOne(id);
    if (!page.translationGroupId) {
      return [page]; // 没有翻译组，仅返回自身
    }
    return this.pagesRepository.find({
      where: { translationGroupId: page.translationGroupId },
    });
  }

  /** 创建页面的翻译版本 */
  async createTranslation(
    id: number,
    dto: CreateTranslationDto,
  ): Promise<Page> {
    const source = await this.findOne(id);

    // 检查 slug 唯一性
    const existing = await this.pagesRepository.findOne({
      where: { slug: dto.slug },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" 已存在`);
    }

    // 首次创建翻译时为源页面分配翻译组 ID
    let groupId = source.translationGroupId;
    if (!groupId) {
      source.translationGroupId = source.id;
      groupId = source.id;
      await this.pagesRepository.save(source);
    }

    const translation = this.pagesRepository.create({
      title: dto.title,
      slug: dto.slug,
      description: dto.description || source.description,
      locale: dto.locale,
      schema: source.schema,
      status: 'draft',
      reviewStatus: 'draft',
      translationGroupId: groupId,
    });

    return this.pagesRepository.save(translation);
  }

  /* ==================== 审批流程 ==================== */

  /** 提交审核（draft → reviewing） */
  async submitReview(id: number): Promise<Page> {
    const page = await this.findOne(id);
    if (page.reviewStatus === 'reviewing') {
      throw new ConflictException('该页面已在审核中');
    }
    if (page.status === 'published') {
      throw new ConflictException('已发布的页面无需审核');
    }
    page.reviewStatus = 'reviewing';
    return this.pagesRepository.save(page);
  }

  /** 审核通过（reviewing → approved + published） */
  async approveReview(id: number, comment?: string): Promise<Page> {
    const page = await this.findOne(id);
    if (page.reviewStatus !== 'reviewing') {
      throw new ConflictException('仅审核中的页面可批准');
    }
    page.reviewStatus = 'approved';
    page.status = 'published';
    page.publishedAt = new Date();
    page.reviewComment = comment || undefined;
    page.reviewedAt = new Date();
    const saved = await this.pagesRepository.save(page);
    await this.recordVersion(saved);
    return saved;
  }

  /** 驳回（reviewing → rejected） */
  async rejectReview(id: number, comment: string): Promise<Page> {
    const page = await this.findOne(id);
    if (page.reviewStatus !== 'reviewing') {
      throw new ConflictException('仅审核中的页面可驳回');
    }
    page.reviewStatus = 'rejected';
    page.reviewComment = comment;
    page.reviewedAt = new Date();
    return this.pagesRepository.save(page);
  }

  /** 获取待审核列表 */
  async findPendingReview(query: PageQueryDto) {
    return this.findAll({
      ...query,
      reviewStatus: 'reviewing',
    });
  }
}
