import {
  Controller,
  Get,
  Post,
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
import { ChatShareService } from './chat-share.service';
import { CreateShareDto, ShareSessionResponseDto } from './dto/create-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

@ApiTags('chat-share')
@ApiBearerAuth('JWT')
@Controller('chat-share')
@UseGuards(JwtAuthGuard)
export class ChatShareController {
  constructor(private readonly chatShareService: ChatShareService) {}

  @ApiOperation({ summary: '创建分享链接' })
  @ApiResponse({ status: 201, type: ShareSessionResponseDto })
  @Post()
  create(@Body() createShareDto: CreateShareDto, @Request() req: AuthenticatedRequest) {
    return this.chatShareService.create(createShareDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取分享内容' })
  @ApiResponse({ status: 200, type: ShareSessionResponseDto })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatShareService.findById(id);
  }

  @ApiOperation({ summary: '删除分享' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.chatShareService.delete(id, req.user.userId);
  }
}
