import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageVersion } from '../entities/page-version.entity';
import { Page } from '../entities/page.entity';
import { PagesService } from '../pages.service';

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  constructor(
    @InjectRepository(PageVersion)
    private readonly versionRepository: Repository<PageVersion>,
    @Inject(forwardRef(() => PagesService))
    private readonly pagesService: PagesService,
  ) {}

  /** 获取某个页面的所有版本 */
  async findByPageId(pageId: number): Promise<PageVersion[]> {
    return this.versionRepository.find({
      where: { pageId },
      order: { versionNumber: 'DESC' },
    });
  }

  /** 获取单个版本详情 */
  async findOne(id: number): Promise<PageVersion> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`版本 #${id} 不存在`);
    }
    return version;
  }

  /** 记录新版本 */
  async record(pageId: number, page: Page): Promise<PageVersion> {
    const lastVersion = await this.versionRepository.findOne({
      where: { pageId },
      order: { versionNumber: 'DESC' },
    });
    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = this.versionRepository.create({
      pageId,
      versionNumber,
      title: page.title,
      html: page.html,
      css: page.css,
      components: page.components,
      status: page.status,
    });

    return this.versionRepository.save(version);
  }

  /** 恢复到指定版本 */
  async restore(pageId: number, versionId: number): Promise<Page> {
    const version = await this.findOne(versionId);
    if (version.pageId !== pageId) {
      throw new NotFoundException('版本与页面不匹配');
    }

    // 用版本数据更新页面（通过 PagesService 更新以触发版本记录）
    const page = await this.pagesService.findOne(pageId);
    const updatedPage = await this.pagesService.applyVersionRestore(page, {
      html: version.html,
      css: version.css,
      components: version.components,
      title: version.title,
    });

    return updatedPage;
  }
}
