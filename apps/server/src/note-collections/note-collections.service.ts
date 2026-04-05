import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NoteCollection,
  NoteCollectionItem,
} from '../entities/note-collection.entity';
import { Note } from '../entities/note.entity';
import { NoteFavorite } from '../entities/note-favorite.entity';
import { CreateNoteCollectionDto } from './dto/create-note-collection.dto';

@Injectable()
export class NoteCollectionsService {
  constructor(
    @InjectRepository(NoteCollection)
    private collectionsRepository: Repository<NoteCollection>,
    @InjectRepository(NoteCollectionItem)
    private collectionItemsRepository: Repository<NoteCollectionItem>,
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    @InjectRepository(NoteFavorite)
    private noteFavoritesRepository: Repository<NoteFavorite>,
  ) {}

  /** 收藏夹首次收录时补一条 NoteFavorite，使笔记 favoriteCount / 详情 isFavorited 与列表一致 */
  private async ensureFavoriteRowForCollectionCollect(
    noteId: number,
    userId: number,
  ): Promise<void> {
    const exists = await this.noteFavoritesRepository.findOne({
      where: { note: { id: noteId }, user: { id: userId } },
    });
    if (exists) return;
    const favorite = this.noteFavoritesRepository.create({
      note: { id: noteId },
      user: { id: userId },
      syncedFromCollection: true,
    });
    await this.noteFavoritesRepository.save(favorite);
    await this.notesRepository.increment({ id: noteId }, 'favoriteCount', 1);
  }

  /** 用户在该笔记下已无任何收藏夹项时，移除由收藏夹同步产生的 NoteFavorite */
  private async removeSyncedFavoriteIfNoCollectionItems(
    noteId: number,
    userId: number,
  ): Promise<void> {
    const remaining = await this.collectionItemsRepository.count({
      where: { note: { id: noteId }, user: { id: userId } },
    });
    if (remaining > 0) return;
    const fav = await this.noteFavoritesRepository.findOne({
      where: {
        note: { id: noteId },
        user: { id: userId },
        syncedFromCollection: true,
      },
    });
    if (!fav) return;
    await this.noteFavoritesRepository.remove(fav);
    await this.notesRepository.decrement({ id: noteId }, 'favoriteCount', 1);
  }

  // 创建收藏夹
  async create(
    createDto: CreateNoteCollectionDto,
    userId: number,
  ): Promise<NoteCollection> {
    const collection = this.collectionsRepository.create({
      ...createDto,
      user: { id: userId },
    });
    return this.collectionsRepository.save(collection);
  }

  // 获取我的收藏夹列表
  async findMyCollections(userId: number): Promise<NoteCollection[]> {
    return this.collectionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // 获取收藏夹详情（包含笔记列表）
  async findOne(
    collectionId: number,
    userId: number,
  ): Promise<NoteCollection & { notes: Note[] }> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, user: { id: userId } },
      relations: [
        'items',
        'items.note',
        'items.note.author',
        'items.note.topic',
      ],
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    const notes = collection.items.map((item) => item.note);

    return {
      ...collection,
      notes,
    };
  }

  // 删除收藏夹
  async remove(collectionId: number, userId: number): Promise<void> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, user: { id: userId } },
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    await this.collectionsRepository.remove(collection);
  }

  // 收藏笔记到指定收藏夹
  async addNoteToCollection(
    noteId: number,
    collectionId: number,
    userId: number,
  ): Promise<{ collected: boolean }> {
    const note = await this.notesRepository.findOne({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, user: { id: userId } },
    });
    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    // 检查是否已收藏
    const existing = await this.collectionItemsRepository.findOne({
      where: {
        collection: { id: collectionId },
        note: { id: noteId },
        user: { id: userId },
      },
    });

    if (existing) {
      // 已收藏则取消收藏
      await this.collectionItemsRepository.remove(existing);
      await this.collectionsRepository.decrement(
        { id: collectionId },
        'noteCount',
        1,
      );
      await this.removeSyncedFavoriteIfNoCollectionItems(noteId, userId);
      return { collected: false };
    }

    // 添加收藏
    const item = this.collectionItemsRepository.create({
      collection: { id: collectionId },
      note: { id: noteId },
      user: { id: userId },
    });
    await this.collectionItemsRepository.save(item);
    await this.collectionsRepository.increment(
      { id: collectionId },
      'noteCount',
      1,
    );
    await this.ensureFavoriteRowForCollectionCollect(noteId, userId);
    return { collected: true };
  }

  // 从收藏夹移除笔记
  async removeNoteFromCollection(
    noteId: number,
    collectionId: number,
    userId: number,
  ): Promise<void> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId, user: { id: userId } },
    });

    if (!collection) {
      throw new NotFoundException('收藏夹不存在');
    }

    const item = await this.collectionItemsRepository.findOne({
      where: {
        collection: { id: collectionId },
        note: { id: noteId },
        user: { id: userId },
      },
    });

    if (item) {
      await this.collectionItemsRepository.remove(item);
      await this.collectionsRepository.decrement(
        { id: collectionId },
        'noteCount',
        1,
      );
      await this.removeSyncedFavoriteIfNoCollectionItems(noteId, userId);
    }
  }

  // 获取笔记在哪些收藏夹中
  async getNoteCollections(
    noteId: number,
    userId: number,
  ): Promise<NoteCollection[]> {
    const items = await this.collectionItemsRepository.find({
      where: { note: { id: noteId }, user: { id: userId } },
      relations: ['collection'],
    });
    return items.map((item) => item.collection);
  }
}
