import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminMomentsService } from '../services/admin-moments.service';
import { SearchMomentDto } from '../../../moments/dto/search-moment.dto';
import { UpdateMomentDto } from '../../../moments/dto/update-moment.dto';
import { AdminGuard } from '../guards/admin.guard';
import {
  MomentDto,
  MomentListResponse,
} from '../../../common/dto/responses/moment.response.dto';

@ApiExtraModels(MomentDto, MomentListResponse)
@ApiTags('管理后台 - 动态管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminMomentsController {
  constructor(private readonly adminMomentsService: AdminMomentsService) {}

  @ApiOperation({ summary: '获取动态列表', operationId: 'getAdminMoments' })
  @ApiOkResponse({ type: MomentListResponse, description: '动态列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Get('moments')
  async getMoments(@Query() query: SearchMomentDto) {
    return this.adminMomentsService.getMoments(query);
  }

  @ApiOperation({ summary: '获取动态详情', operationId: 'getAdminMomentById' })
  @ApiOkResponse({ type: MomentDto, description: '动态详情' })
  @ApiParam({ name: 'id', type: Number, description: '动态 ID' })
  @Get('moments/:id')
  async getMomentById(@Param('id', ParseIntPipe) id: number) {
    return this.adminMomentsService.getMomentById(id);
  }

  @ApiOperation({ summary: '更新动态', operationId: 'updateAdminMoment' })
  @ApiOkResponse({ type: MomentDto, description: '更新后的动态' })
  @ApiParam({ name: 'id', type: Number, description: '动态 ID' })
  @Patch('moments/:id')
  async updateMoment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMomentDto,
  ) {
    return this.adminMomentsService.updateMoment(id, dto);
  }

  @ApiOperation({ summary: '删除动态', operationId: 'deleteAdminMoment' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '动态 ID' })
  @Delete('moments/:id')
  async deleteMoment(@Param('id', ParseIntPipe) id: number) {
    return this.adminMomentsService.deleteMoment(id);
  }
}
