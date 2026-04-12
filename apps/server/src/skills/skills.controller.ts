import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillResponseDto,
  MarketplaceSkillDto,
} from './dto/skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('skills')
@ApiBearerAuth('JWT')
@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiOperation({ summary: '获取用户所有技能' })
  @ApiResponse({ status: 200, type: [SkillResponseDto] })
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.skillsService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: '获取技能市场' })
  @ApiResponse({ status: 200, type: [MarketplaceSkillDto] })
  @Get('marketplace/list')
  getMarketplace(@Request() req: AuthenticatedRequest) {
    return this.skillsService.getMarketplace(req.user.userId);
  }

  @ApiOperation({ summary: '从市场安装技能' })
  @ApiResponse({ status: 201, type: SkillResponseDto })
  @Post('install/:marketplaceId')
  install(
    @Param('marketplaceId') marketplaceId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.skillsService.install(marketplaceId, req.user.userId);
  }

  @ApiOperation({ summary: '获取技能详情' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.skillsService.findOne(id, req.user.userId);
  }

  @ApiOperation({ summary: '创建自定义技能' })
  @ApiResponse({ status: 201, type: SkillResponseDto })
  @Post()
  create(@Body() dto: CreateSkillDto, @Request() req: AuthenticatedRequest) {
    return this.skillsService.create(dto, req.user.userId);
  }

  @ApiOperation({ summary: '更新技能' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.skillsService.update(id, dto, req.user.userId);
  }

  @ApiOperation({ summary: '删除技能' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.skillsService.remove(id, req.user.userId);
  }

  @ApiOperation({ summary: '激活技能' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Post(':id/activate')
  activate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.skillsService.activate(id, req.user.userId);
  }

  @ApiOperation({ summary: '停用技能' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  @Post(':id/deactivate')
  deactivate(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.skillsService.deactivate(id, req.user.userId);
  }
}
