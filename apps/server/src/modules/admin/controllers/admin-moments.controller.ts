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
import { ApiTags } from '@nestjs/swagger';
import { AdminMomentsService } from '../services/admin-moments.service';
import { SearchMomentDto } from '../../../moments/dto/search-moment.dto';
import { UpdateMomentDto } from '../../../moments/dto/update-moment.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminMomentsController {
  constructor(private readonly adminMomentsService: AdminMomentsService) {}

  @Get('moments')
  async getMoments(@Query() query: SearchMomentDto) {
    return this.adminMomentsService.getMoments(query);
  }

  @Get('moments/:id')
  async getMomentById(@Param('id', ParseIntPipe) id: number) {
    return this.adminMomentsService.getMomentById(id);
  }

  @Patch('moments/:id')
  async updateMoment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMomentDto,
  ) {
    return this.adminMomentsService.updateMoment(id, dto);
  }

  @Delete('moments/:id')
  async deleteMoment(@Param('id', ParseIntPipe) id: number) {
    return this.adminMomentsService.deleteMoment(id);
  }
}
