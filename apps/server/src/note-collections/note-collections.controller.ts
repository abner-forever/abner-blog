import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { NoteCollectionsService } from './note-collections.service';
import { CreateNoteCollectionDto } from './dto/create-note-collection.dto';
import { AddNoteToCollectionDto } from './dto/add-note-to-collection.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('note-collections')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('note-collections')
export class NoteCollectionsController {
  constructor(
    private readonly noteCollectionsService: NoteCollectionsService,
  ) {}

  @ApiOperation({ summary: '创建收藏夹' })
  @ApiResponse({ status: 201 })
  @Post()
  create(
    @Body() createDto: CreateNoteCollectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.noteCollectionsService.create(createDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取我的收藏夹列表' })
  @ApiResponse({ status: 200 })
  @Get()
  findMyCollections(@Req() req: AuthenticatedRequest) {
    return this.noteCollectionsService.findMyCollections(req.user.userId);
  }

  @ApiOperation({ summary: '获取笔记所在收藏夹列表' })
  @ApiParam({ name: 'noteId', description: '笔记 ID' })
  @Get('note/:noteId')
  getNoteCollections(
    @Param('noteId') noteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.noteCollectionsService.getNoteCollections(
      +noteId,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: '获取收藏夹详情' })
  @ApiParam({ name: 'id', description: '收藏夹 ID' })
  @ApiResponse({ status: 200 })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.noteCollectionsService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: '删除收藏夹' })
  @ApiParam({ name: 'id', description: '收藏夹 ID' })
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.noteCollectionsService.remove(+id, req.user.userId);
  }
}

@ApiTags('notes')
@Controller('notes')
export class NoteCollectionsNoteController {
  constructor(
    private readonly noteCollectionsService: NoteCollectionsService,
  ) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '收藏笔记到指定收藏夹' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Post(':id/collect')
  addNoteToCollection(
    @Param('id') id: string,
    @Body() addNoteToCollectionDto: AddNoteToCollectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.noteCollectionsService.addNoteToCollection(
      +id,
      addNoteToCollectionDto.collectionId,
      req.user.userId,
    );
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '从收藏夹移除笔记' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiParam({ name: 'collectionId', description: '收藏夹 ID' })
  @Delete(':id/collect/:collectionId')
  removeNoteFromCollection(
    @Param('id') id: string,
    @Param('collectionId') collectionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.noteCollectionsService.removeNoteFromCollection(
      +id,
      +collectionId,
      req.user.userId,
    );
  }
}
