import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Note } from '../entities/note.entity';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicsService implements OnModuleInit {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async onModuleInit() {
    // 初始化默认话题
    await this.initDefaultTopics();
  }

  private async initDefaultTopics() {
    const count = await this.topicsRepository.count();
    if (count === 0) {
      const defaultTopics = [
        {
          name: '日常',
          description: '记录日常生活点滴',
          color: '#8b5cf6',
          icon: '📝',
          isSystem: true,
        },
        {
          name: '技术',
          description: '技术分享与讨论',
          color: '#3b82f6',
          icon: '💻',
          isSystem: true,
        },
        {
          name: '美食',
          description: '美食分享',
          color: '#f59e0b',
          icon: '🍜',
          isSystem: true,
        },
        {
          name: '旅行',
          description: '旅行见闻',
          color: '#10b981',
          icon: '✈️',
          isSystem: true,
        },
        {
          name: '健身',
          description: '运动健身',
          color: '#ef4444',
          icon: '💪',
          isSystem: true,
        },
        {
          name: '读书',
          description: '读书笔记',
          color: '#8b5cf6',
          icon: '📚',
          isSystem: true,
        },
        {
          name: '音乐',
          description: '音乐分享',
          color: '#ec4899',
          icon: '🎵',
          isSystem: true,
        },
        {
          name: '电影',
          description: '电影观后感',
          color: '#f97316',
          icon: '🎬',
          isSystem: true,
        },
        {
          name: '游戏',
          description: '游戏心得',
          color: '#06b6d4',
          icon: '🎮',
          isSystem: true,
        },
        {
          name: '萌宠',
          description: '宠物日常',
          color: '#f43f5e',
          icon: '🐕',
          isSystem: true,
        },
        {
          name: '情感',
          description: '情感分享',
          color: '#e879f9',
          icon: '💕',
          isSystem: true,
        },
        {
          name: '职场',
          description: '职场话题',
          color: '#22c55e',
          icon: '💼',
          isSystem: true,
        },
      ];

      for (const topic of defaultTopics) {
        await this.topicsRepository.save(this.topicsRepository.create(topic));
      }
    }
  }

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    const topic = this.topicsRepository.create(createTopicDto);
    return this.topicsRepository.save(topic);
  }

  async findAll(): Promise<Topic[]> {
    return this.topicsRepository.find({
      order: { momentCount: 'DESC', followCount: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }
    return topic;
  }

  async findOneWithNotes(
    id: number,
    page: number = 1,
    pageSize: number = 10,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId?: number,
  ): Promise<{
    topic: Topic;
    notes: Note[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const topic = await this.topicsRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    const skip = (page - 1) * pageSize;

    const [notes, total] = await this.notesRepository.findAndCount({
      where: { topic: { id } },
      relations: ['author', 'topic'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      topic,
      notes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findHot(limit: number = 10): Promise<Topic[]> {
    // 如果没有数据，返回默认话题
    const count = await this.topicsRepository.count();
    if (count === 0) {
      await this.initDefaultTopics();
    }
    return this.topicsRepository.find({
      order: { momentCount: 'DESC', followCount: 'DESC' },
      take: limit,
    });
  }
}
