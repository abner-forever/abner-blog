import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormSubmission } from '../entities/form-submission.entity';
import { Page } from '../entities/page.entity';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    @InjectRepository(FormSubmission)
    private readonly submissionRepository: Repository<FormSubmission>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
  ) {}

  async submit(
    slug: string,
    fields: Record<string, string>,
  ): Promise<FormSubmission> {
    const page = await this.pageRepository.findOne({
      where: { slug, status: 'published' },
    });

    if (!page) {
      throw new NotFoundException('页面不存在或未发布');
    }

    const submission = this.submissionRepository.create({
      pageId: page.id,
      pageSlug: slug,
      fields,
    });

    return this.submissionRepository.save(submission);
  }

  async findByPage(pageId: number, page = 1, pageSize = 20) {
    // 验证页面存在
    const pageEntity = await this.pageRepository.findOne({
      where: { id: pageId },
    });
    if (!pageEntity) {
      throw new NotFoundException(`页面 #${pageId} 不存在`);
    }

    const [list, total] = await this.submissionRepository.findAndCount({
      where: { pageId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async exportCsv(pageId: number): Promise<string> {
    const pageEntity = await this.pageRepository.findOne({
      where: { id: pageId },
    });
    if (!pageEntity) {
      throw new NotFoundException(`页面 #${pageId} 不存在`);
    }

    const submissions = await this.submissionRepository.find({
      where: { pageId },
      order: { createdAt: 'ASC' },
    });

    if (submissions.length === 0) {
      return '无数据';
    }

    // 从所有提交中收集所有字段名
    const allKeys = new Set<string>();
    submissions.forEach((s) => {
      Object.keys(s.fields).forEach((k) => allKeys.add(k));
    });
    const headers = ['提交时间', ...Array.from(allKeys)];

    // 构建 CSV
    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = submissions.map((s) => {
      const fields = headers.slice(1).map((k) => escapeCsv(s.fields[k] || ''));
      return [escapeCsv(s.createdAt.toISOString()), ...fields].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
