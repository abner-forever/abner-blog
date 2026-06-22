import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { PagesService } from './pages.service';
import {
  PagesAssetsService,
  pagesImageMulterOptions,
} from './services/pages-assets.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto, PublishPageDto } from './dto/update-page.dto';
import { PageQueryDto } from './dto/page-query.dto';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { ReviewActionDto } from './dto/review.dto';
import { AdminGuard } from '../modules/admin/guards/admin.guard';

@ApiTags('Pages')
@ApiBearerAuth('SSO')
@Controller('pages')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly pagesAssetsService: PagesAssetsService,
  ) {}

  @ApiOperation({ summary: '创建页面' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @ApiOperation({ summary: '上传页面图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '上传成功，返回图片 URL' })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', pagesImageMulterOptions))
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    const url = this.pagesAssetsService.buildImageUrl(req, file.filename);
    return { url };
  }

  @ApiOperation({ summary: '获取页面列表（分页）' })
  @ApiResponse({ status: 200, description: '页面分页列表' })
  @Get()
  findAll(@Query() queryDto: PageQueryDto) {
    return this.pagesService.findAll(queryDto);
  }

  @ApiOperation({ summary: '获取页面详情' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '页面详情' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(+id);
  }

  @ApiOperation({ summary: '更新页面（全量）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(+id, updatePageDto);
  }

  @ApiOperation({ summary: '更新页面（增量）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Patch(':id')
  partialUpdate(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(+id, updatePageDto);
  }

  @ApiOperation({ summary: '发布页面' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '发布成功' })
  @Patch(':id/publish')
  publish(@Param('id') id: string, @Body() publishDto: PublishPageDto) {
    return this.pagesService.publish(+id, publishDto);
  }

  @ApiOperation({ summary: '归档页面' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '归档成功' })
  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.pagesService.archive(+id);
  }

  @ApiOperation({ summary: '克隆页面' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 201, description: '克隆成功，返回新页面（草稿状态）' })
  @Post(':id/clone')
  clone(@Param('id') id: string) {
    return this.pagesService.clone(+id);
  }

  @ApiOperation({ summary: '恢复已删除页面' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.pagesService.restore(+id);
  }

  @ApiOperation({ summary: '永久删除页面（不可恢复）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 204, description: '永久删除成功' })
  @Delete(':id/hard')
  async hardRemove(@Param('id') id: string) {
    await this.pagesService.hardRemove(+id);
  }

  @ApiOperation({ summary: '删除页面（软删除）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.pagesService.remove(+id);
  }

  /* ==================== 多语言 ==================== */

  @ApiOperation({ summary: '获取页面翻译版本列表' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Get(':id/translations')
  findTranslations(@Param('id') id: string) {
    return this.pagesService.findTranslations(+id);
  }

  @ApiOperation({ summary: '创建页面翻译版本' })
  @ApiParam({ name: 'id', description: '源页面 ID' })
  @Post(':id/translations')
  createTranslation(
    @Param('id') id: string,
    @Body() dto: CreateTranslationDto,
  ) {
    return this.pagesService.createTranslation(+id, dto);
  }

  /* ==================== 审批流程 ==================== */

  @ApiOperation({ summary: '提交审核（draft → reviewing）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Patch(':id/submit-review')
  submitReview(@Param('id') id: string) {
    return this.pagesService.submitReview(+id);
  }

  @ApiOperation({ summary: '审核通过（reviewing → published）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Patch(':id/approve')
  approveReview(@Param('id') id: string, @Body() dto: ReviewActionDto) {
    return this.pagesService.approveReview(+id, dto?.comment);
  }

  @ApiOperation({ summary: '驳回（reviewing → rejected）' })
  @ApiParam({ name: 'id', description: '页面 ID' })
  @Patch(':id/reject')
  rejectReview(@Param('id') id: string, @Body() dto: ReviewActionDto) {
    return this.pagesService.rejectReview(+id, dto.comment);
  }

  @ApiOperation({ summary: '获取待审核页面列表' })
  @Get('/review/pending')
  findPendingReview(@Query() queryDto: PageQueryDto) {
    return this.pagesService.findPendingReview(queryDto);
  }
}
