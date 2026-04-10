import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Skill,
  SkillType,
  SkillStatus,
  SkillWorkflow,
} from '../entities/skill.entity';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillResponseDto,
  MarketplaceSkillDto,
} from './dto/skill.dto';

// Predefined marketplace skills
const MARKETPLACE_SKILLS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  workflow: SkillWorkflow;
}> = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: '专业的代码审查助手，帮助审查代码质量、安全性和性能问题',
    icon: 'code',
    tools: ['github'],
    workflow: {
      nodes: [
        { id: 'start', type: 'prompt', prompt: '请提供要审查的代码' },
        {
          id: 'review',
          type: 'prompt',
          prompt: '请详细分析以下代码的问题：\n{{code}}',
        },
        {
          id: 'end',
          type: 'end',
          end: { message: '代码审查完成，如有其他问题请继续。' },
        },
      ],
      edges: [
        { from: 'start', to: 'review' },
        { from: 'review', to: 'end' },
      ],
      startNodeId: 'start',
    },
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    description: '智能旅行规划助手，整合日历和天气信息，为您规划完美行程',
    icon: 'car',
    tools: ['weather', 'calendar'],
    workflow: {
      nodes: [
        { id: 'start', type: 'prompt', prompt: '请问您想去哪里旅行？' },
        {
          id: 'weather',
          type: 'tool',
          tool: { name: 'get_weather', params: { location: '{{location}}' } },
        },
        { id: 'calendar', type: 'tool', tool: { name: 'list_events' } },
        {
          id: 'plan',
          type: 'prompt',
          prompt: '根据天气{{weather}}和您的日历{{calendar}}，为您规划行程。',
        },
        { id: 'end', type: 'end', end: { message: '行程规划完成！' } },
      ],
      edges: [
        { from: 'start', to: 'weather' },
        { from: 'weather', to: 'calendar' },
        { from: 'calendar', to: 'plan' },
        { from: 'plan', to: 'end' },
      ],
      startNodeId: 'start',
    },
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: '研究助手，帮助搜索、整理信息并生成研究报告',
    icon: 'search',
    tools: ['web-search'],
    workflow: {
      nodes: [
        { id: 'start', type: 'prompt', prompt: '请问您想研究什么主题？' },
        {
          id: 'search',
          type: 'tool',
          tool: { name: 'search', params: { query: '{{topic}}' } },
        },
        {
          id: 'report',
          type: 'prompt',
          prompt: '根据搜索结果，请生成一份关于{{topic}}的研究报告。',
        },
        { id: 'end', type: 'end', end: { message: '研究报告已生成。' } },
      ],
      edges: [
        { from: 'start', to: 'search' },
        { from: 'search', to: 'report' },
        { from: 'report', to: 'end' },
      ],
      startNodeId: 'start',
    },
  },
];

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async findAll(userId: number): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.find({
      where: [{ userId }, { isGlobal: true }],
      order: { createdAt: 'DESC' },
    });
    return skills.map((s) => this.toResponseDto(s));
  }

  async findOne(id: string, userId: number): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: [
        { id, userId },
        { id, isGlobal: true },
      ],
    });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }
    return this.toResponseDto(skill);
  }

  async create(dto: CreateSkillDto, userId: number): Promise<SkillResponseDto> {
    const skill = this.skillRepository.create({
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      avatar: dto.avatar,
      workflow: dto.workflow || { nodes: [], edges: [], startNodeId: '' },
      tools: dto.tools,
      type: SkillType.MARKETPLACE,
      userId,
      isGlobal: false,
      status: SkillStatus.INACTIVE,
    });
    const saved = await this.skillRepository.save(skill);
    return this.toResponseDto(saved);
  }

  async update(
    id: string,
    dto: UpdateSkillDto,
    userId: number,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: { id, userId },
    });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }

    if (dto.name !== undefined) skill.name = dto.name;
    if (dto.description !== undefined) skill.description = dto.description;
    if (dto.icon !== undefined) skill.icon = dto.icon;
    if (dto.avatar !== undefined) skill.avatar = dto.avatar;
    if (dto.workflow !== undefined) skill.workflow = dto.workflow;
    if (dto.tools !== undefined) skill.tools = dto.tools;
    if (dto.status !== undefined) skill.status = dto.status as SkillStatus;

    const saved = await this.skillRepository.save(skill);
    return this.toResponseDto(saved);
  }

  async remove(id: string, userId: number): Promise<void> {
    const skill = await this.skillRepository.findOne({
      where: { id, userId, isGlobal: false },
    });
    if (!skill) {
      throw new NotFoundException('技能不存在或无法删除全局技能');
    }
    await this.skillRepository.remove(skill);
  }

  async install(
    marketplaceId: string,
    userId: number,
  ): Promise<SkillResponseDto> {
    // Check if already installed
    const existing = await this.skillRepository.findOne({
      where: { marketplaceId, userId },
    });
    if (existing) {
      return this.toResponseDto(existing);
    }

    // Find marketplace definition
    const marketplaceDef = MARKETPLACE_SKILLS.find(
      (m) => m.id === marketplaceId,
    );
    if (!marketplaceDef) {
      throw new NotFoundException('市场技能不存在');
    }

    const skill = this.skillRepository.create({
      name: marketplaceDef.name,
      description: marketplaceDef.description,
      icon: marketplaceDef.icon,
      workflow: marketplaceDef.workflow,
      tools: marketplaceDef.tools,
      type: SkillType.MARKETPLACE,
      marketplaceId: marketplaceDef.id,
      userId,
      isGlobal: false,
      status: SkillStatus.INACTIVE,
    });

    const saved = await this.skillRepository.save(skill);
    return this.toResponseDto(saved);
  }

  async activate(id: string, userId: number): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: [
        { id, userId },
        { id, isGlobal: true },
      ],
    });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }
    skill.status = SkillStatus.ACTIVE;
    const saved = await this.skillRepository.save(skill);
    return this.toResponseDto(saved);
  }

  async deactivate(id: string, userId: number): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: [
        { id, userId },
        { id, isGlobal: true },
      ],
    });
    if (!skill) {
      throw new NotFoundException('技能不存在');
    }
    skill.status = SkillStatus.INACTIVE;
    const saved = await this.skillRepository.save(skill);
    return this.toResponseDto(saved);
  }

  async getMarketplace(userId: number): Promise<MarketplaceSkillDto[]> {
    // Get user's installed skills
    const installed = await this.skillRepository.find({
      where: { userId },
      select: ['marketplaceId', 'isGlobal'],
    });
    const installedIds = new Set(installed.map((s) => s.marketplaceId));

    return MARKETPLACE_SKILLS.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      tools: m.tools,
      isInstalled: installedIds.has(m.id),
      isGlobal: false,
    }));
  }

  private toResponseDto(entity: Skill): SkillResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      icon: entity.icon || '',
      type: entity.type,
      workflow: entity.workflow,
      avatar: entity.avatar || '',
      tools: entity.tools || [],
      isGlobal: entity.isGlobal,
      status: entity.status,
      createdAt: entity.createdAt,
    };
  }
}
