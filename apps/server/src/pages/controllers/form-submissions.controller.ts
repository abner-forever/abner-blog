import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { FormsService } from '../services/forms.service';
import { AdminGuard } from '../../modules/admin/guards/admin.guard';

@ApiTags('Pages')
@ApiBearerAuth('SSO')
@Controller('pages')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class FormSubmissionsController {
  constructor(private readonly formsService: FormsService) {}

  @ApiOperation({ summary: '获取表单提交记录' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Get(':id/submissions')
  async findAll(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.formsService.findByPage(+id, page, pageSize);
  }

  @ApiOperation({ summary: '导出表单提交记录为 CSV' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Get(':id/submissions/export')
  async exportCsv(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.formsService.exportCsv(+id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="submissions_${id}.csv"`,
    );
    res.send(csv);
  }
}
