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
import { MCPServersService } from './mcp-servers.service';
import {
  InstallMCPServerDto,
  UpdateMCPServerDto,
  MCPServerResponseDto,
  MarketplaceMCPServerDto,
} from './dto/mcp-server.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('mcp-servers')
@ApiBearerAuth('JWT')
@Controller('mcp-servers')
@UseGuards(JwtAuthGuard)
export class MCPServersController {
  constructor(private readonly mcpServersService: MCPServersService) {}

  @ApiOperation({ summary: '获取用户已安装的MCP服务器' })
  @ApiResponse({ status: 200, type: [MCPServerResponseDto] })
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.mcpServersService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: '获取MCP服务器详情' })
  @ApiResponse({ status: 200, type: MCPServerResponseDto })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.mcpServersService.findOne(id, req.user.userId);
  }

  @ApiOperation({ summary: '从市场安装MCP服务器' })
  @ApiResponse({ status: 201, type: MCPServerResponseDto })
  @Post('install')
  install(
    @Body() dto: InstallMCPServerDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.mcpServersService.install(dto, req.user.userId);
  }

  @ApiOperation({ summary: '更新MCP服务器' })
  @ApiResponse({ status: 200, type: MCPServerResponseDto })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMCPServerDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.mcpServersService.update(id, dto, req.user.userId);
  }

  @ApiOperation({ summary: '卸载MCP服务器' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  uninstall(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.mcpServersService.uninstall(id, req.user.userId);
  }

  @ApiOperation({ summary: '获取MCP服务器市场' })
  @ApiResponse({ status: 200, type: [MarketplaceMCPServerDto] })
  @Get('marketplace/list')
  getMarketplace(@Request() req: AuthenticatedRequest) {
    return this.mcpServersService.getMarketplace(req.user.userId);
  }

  @ApiOperation({ summary: '检查MCP服务器状态' })
  @ApiResponse({ status: 200 })
  @Get(':id/status')
  getStatus(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.mcpServersService.getStatus(id, req.user.userId);
  }
}
