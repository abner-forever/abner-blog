import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { StatsService } from './services/stats.service';

@ApiTags('Pages (Public)')
@Controller('public/pages')
export class PublicPagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly statsService: StatsService,
  ) {}

  @ApiOperation({ summary: '根据 slug 获取已发布的页面（公开）' })
  @ApiParam({ name: 'slug', description: '页面 URL 标识' })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const page = await this.pagesService.findBySlug(slug);

    // 异步记录访问 PV（不阻塞响应）
    this.statsService.recordPV(page.id).catch(() => {});

    return {
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      ogImage: page.ogImage,
      html: page.html,
      css: page.css,
    };
  }
}
