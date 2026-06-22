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
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ComponentService } from '../services/component.service';
import { AdminGuard } from '../../modules/admin/guards/admin.guard';

@ApiTags('Custom Components')
@ApiBearerAuth('SSO')
@Controller('page-components')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class ComponentController {
  constructor(private readonly componentService: ComponentService) {}

  @ApiOperation({ summary: '获取自定义组件列表' })
  @ApiQuery({ name: 'type', required: false, description: '按类型筛选' })
  @ApiResponse({ status: 200, description: '组件列表' })
  @Get()
  findAll(@Query('type') type?: string) {
    return this.componentService.findAll(type);
  }

  @ApiOperation({ summary: '获取组件详情' })
  @ApiParam({ name: 'id', description: '组件 ID' })
  @ApiResponse({ status: 200, description: '组件详情' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.componentService.findOne(+id);
  }

  @ApiOperation({ summary: '注册自定义组件' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @Post()
  create(
    @Body()
    dto: {
      name: string;
      description?: string;
      thumbnail?: string;
      html: string;
      css?: string;
      script?: string;
    },
  ) {
    return this.componentService.create(dto);
  }

  @ApiOperation({ summary: '更新组件' })
  @ApiParam({ name: 'id', description: '组件 ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      thumbnail?: string;
      html?: string;
      css?: string;
      script?: string;
    },
  ) {
    return this.componentService.update(+id, dto);
  }

  @ApiOperation({ summary: '删除组件' })
  @ApiParam({ name: 'id', description: '组件 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.componentService.remove(+id);
  }
}
