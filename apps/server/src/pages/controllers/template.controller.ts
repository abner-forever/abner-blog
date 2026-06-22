import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { AdminGuard } from '../../modules/admin/guards/admin.guard';

@ApiTags('Page Templates')
@ApiBearerAuth('SSO')
@Controller('page-templates')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @ApiOperation({ summary: '获取模板列表' })
  @ApiQuery({ name: 'category', required: false, description: '按分类筛选' })
  @ApiResponse({ status: 200, description: '模板列表' })
  @Get()
  findAll(@Query('category') category?: string) {
    return this.templateService.findAll(category);
  }

  @ApiOperation({ summary: '获取模板详情' })
  @ApiParam({ name: 'id', description: '模板 ID' })
  @ApiResponse({ status: 200, description: '模板详情' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(+id);
  }

  @ApiOperation({ summary: '创建模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templateService.create(dto);
  }

  @ApiOperation({ summary: '更新模板' })
  @ApiParam({ name: 'id', description: '模板 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templateService.update(+id, dto);
  }

  @ApiOperation({ summary: '删除模板' })
  @ApiParam({ name: 'id', description: '模板 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.templateService.remove(+id);
  }
}
