import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomComponent } from '../entities/custom-component.entity';

@Injectable()
export class ComponentService {
  private readonly logger = new Logger(ComponentService.name);

  constructor(
    @InjectRepository(CustomComponent)
    private readonly componentRepository: Repository<CustomComponent>,
  ) {}

  async findAll(type?: string): Promise<CustomComponent[]> {
    const where = type ? { type: type as 'system' | 'user' } : {};
    return this.componentRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<CustomComponent> {
    const component = await this.componentRepository.findOne({
      where: { id },
    });
    if (!component) {
      throw new NotFoundException(`自定义组件 #${id} 不存在`);
    }
    return component;
  }

  async create(dto: {
    name: string;
    description?: string;
    thumbnail?: string;
    html: string;
    css?: string;
    script?: string;
  }): Promise<CustomComponent> {
    const existing = await this.componentRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`组件名称 "${dto.name}" 已存在`);
    }

    const component = this.componentRepository.create({
      name: dto.name,
      description: dto.description || undefined,
      thumbnail: dto.thumbnail || undefined,
      html: dto.html,
      css: dto.css || undefined,
      script: dto.script || undefined,
      type: 'user',
    });
    return this.componentRepository.save(component);
  }

  async update(
    id: number,
    dto: Partial<{
      name: string;
      description: string;
      thumbnail: string;
      html: string;
      css: string;
      script: string;
    }>,
  ): Promise<CustomComponent> {
    const component = await this.findOne(id);
    Object.assign(component, dto);
    return this.componentRepository.save(component);
  }

  async remove(id: number): Promise<void> {
    const component = await this.findOne(id);
    await this.componentRepository.remove(component);
  }
}
