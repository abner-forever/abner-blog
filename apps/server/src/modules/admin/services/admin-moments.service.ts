import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moment } from '../../../entities/moment.entity';
import { Topic } from '../../../entities/topic.entity';
import { SearchMomentDto } from '../../../moments/dto/search-moment.dto';
import { UpdateMomentDto } from '../../../moments/dto/update-moment.dto';

interface MomentWithRelations {
  id: number;
  content: string;
  images: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  topic?: {
    id: number;
    name: string;
  };
}

@Injectable()
export class AdminMomentsService {
  constructor(
    @InjectRepository(Moment)
    private readonly momentRepository: Repository<Moment>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async getMoments(query: SearchMomentDto) {
    const pageNum = query.page ? parseInt(String(query.page), 10) : 1;
    const sizeNum = query.pageSize ? parseInt(String(query.pageSize), 10) : 10;
    const { search: keyword, topicId } = query;

    const qb = this.momentRepository
      .createQueryBuilder('moment')
      .leftJoinAndSelect('moment.author', 'author')
      .leftJoinAndSelect('moment.topic', 'topic')
      .select([
        'moment',
        'author.id',
        'author.username',
        'topic.id',
        'topic.name',
      ]);

    if (keyword) {
      qb.where('moment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (topicId) {
      qb.andWhere('moment.topicId = :topicId', {
        topicId: topicId,
      });
    }

    const [list, total] = await qb
      .orderBy('moment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((moment) => {
        const author = moment.author as
          | MomentWithRelations['author']
          | undefined;
        const topic = moment.topic as MomentWithRelations['topic'] | undefined;
        return {
          id: moment.id,
          content: moment.content,
          images: moment.images,
          authorUsername: author?.username,
          authorId: author?.id,
          topicName: topic?.name,
          topicId: topic?.id,
          viewCount: moment.viewCount,
          likeCount: moment.likeCount,
          commentCount: moment.commentCount,
          createdAt: moment.createdAt,
        };
      }),
      total,
    };
  }

  async getMomentById(id: number) {
    const moment = await this.momentRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });
    if (!moment) {
      throw new NotFoundException('闲聊不存在');
    }
    return moment;
  }

  async updateMoment(id: number, dto: UpdateMomentDto) {
    const moment = await this.getMomentById(id);
    if (dto.content !== undefined) {
      moment.content = dto.content;
    }
    if (dto.images !== undefined) {
      moment.images = dto.images;
    }
    if (dto.topicId !== undefined) {
      if (dto.topicId) {
        const topic = await this.topicRepository.findOne({
          where: { id: dto.topicId },
        });
        moment.topic = topic;
      } else {
        moment.topic = null;
      }
    }
    return this.momentRepository.save(moment);
  }

  async deleteMoment(id: number) {
    const moment = await this.getMomentById(id);
    await this.momentRepository.remove(moment);
  }
}
