import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../../../entities/topic.entity';
import {
  TopicManageQueryDto,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from '../dto/topic-manage.dto';

@Injectable()
export class AdminTopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
  ) {}

  async getTopics(query: TopicManageQueryDto) {
    const pageNum = query.page || 1;
    const sizeNum = query.size || 10;
    const { keyword } = query;
    const qb = this.topicRepository.createQueryBuilder('topic');

    if (keyword) {
      qb.where('topic.name LIKE :keyword OR topic.description LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await qb
      .orderBy('topic.id', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return { list, total };
  }

  async createTopic(dto: AdminCreateTopicDto) {
    const topic = this.topicRepository.create(dto);
    return this.topicRepository.save(topic);
  }

  async updateTopic(id: number, dto: UpdateTopicDto) {
    const topic = await this.topicRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }
    Object.assign(topic, dto);
    return this.topicRepository.save(topic);
  }

  async deleteTopic(id: number) {
    const topic = await this.topicRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }
    await this.topicRepository.remove(topic);
  }
}
