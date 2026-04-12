import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SkillsService } from './skills.service';
import { SkillVectorService } from './skill-vector.service';
import type { SkillWorkflow } from '../entities/skill.entity';
import { Skill, SkillStatus, SkillType } from '../entities/skill.entity';

describe('SkillsService', () => {
  let service: SkillsService;
  let repo: jest.Mocked<Pick<Repository<Skill>, 'find' | 'findOne' | 'create' | 'save' | 'remove'>>;

  const emptyWorkflow: SkillWorkflow = {
    nodes: [],
    edges: [],
    startNodeId: '',
  };

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockSkillVector = {
    syncSkill: jest.fn().mockResolvedValue(undefined),
    removeSkill: jest.fn().mockResolvedValue(undefined),
    searchSkillIds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: mockRepo },
        { provide: SkillVectorService, useValue: mockSkillVector },
      ],
    }).compile();

    service = module.get(SkillsService);
    repo = mockRepo;
  });

  describe('findAll', () => {
    it('maps entities for user and global skills', async () => {
      const created = new Date('2026-01-01T00:00:00.000Z');
      repo.find.mockResolvedValue([
        {
          id: 'a',
          name: 'S1',
          description: 'd',
          icon: 'i',
          type: SkillType.MARKETPLACE,
          workflow: emptyWorkflow,
          avatar: '',
          tools: ['t1'],
          marketplaceId: 'code-reviewer',
          isGlobal: false,
          userId: 1,
          status: SkillStatus.ACTIVE,
          createdAt: created,
        } as Skill,
      ]);

      const list = await service.findAll(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: [{ userId: 1 }, { isGlobal: true }],
        order: { createdAt: 'DESC' },
      });
      expect(list).toEqual([
        expect.objectContaining({
          id: 'a',
          name: 'S1',
          status: SkillStatus.ACTIVE,
        }),
      ]);
    });
  });

  describe('install', () => {
    it('returns existing row when already installed (idempotent)', async () => {
      const existing = {
        id: 'uuid-1',
        name: 'Code Reviewer',
        description: 'x',
        icon: 'code',
        type: SkillType.MARKETPLACE,
        workflow: emptyWorkflow,
        avatar: '',
        tools: ['github'],
        marketplaceId: 'code-reviewer',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.INACTIVE,
        createdAt: new Date(),
      } as Skill;
      repo.findOne.mockResolvedValueOnce(existing);

      const out = await service.install('code-reviewer', 1);
      expect(out.id).toBe('uuid-1');
      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates skill from marketplace definition when not installed', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      const createdEntity = {
        id: 'new-id',
        name: 'Code Reviewer',
        description: '专业的代码审查助手，帮助审查代码质量、安全性和性能问题',
        icon: 'code',
        type: SkillType.MARKETPLACE,
        workflow: {
          nodes: [{ id: 'start', type: 'prompt' as const, prompt: 'p' }],
          edges: [],
          startNodeId: 'start',
        },
        avatar: '',
        tools: ['github'],
        marketplaceId: 'code-reviewer',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.INACTIVE,
        createdAt: new Date(),
      } as Skill;
      repo.create.mockReturnValue(createdEntity);
      repo.save.mockResolvedValue(createdEntity);

      const out = await service.install('code-reviewer', 1);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(createdEntity);
      expect(out.id).toBe('new-id');
    });

    it('throws when marketplace id unknown', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.install('no-such-skill', 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('buildSystemPromptForActiveSkill', () => {
    it('returns null when skillId empty', async () => {
      await expect(
        service.buildSystemPromptForActiveSkill('', 1),
      ).resolves.toBeNull();
      await expect(
        service.buildSystemPromptForActiveSkill(undefined, 1),
      ).resolves.toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('returns null when no active skill matches', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.buildSystemPromptForActiveSkill('x', 1),
      ).resolves.toBeNull();
    });

    it('returns prompt text for active owned skill', async () => {
      repo.findOne.mockResolvedValueOnce({
        id: 'sk',
        name: 'Reviewer',
        description: '审查',
        icon: 'code',
        type: SkillType.MARKETPLACE,
        workflow: {
          nodes: [
            {
              id: 'start',
              type: 'prompt' as const,
              prompt: '请提供代码',
            },
          ],
          edges: [],
          startNodeId: 'start',
        },
        avatar: '',
        tools: ['github'],
        marketplaceId: 'code-reviewer',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.ACTIVE,
        createdAt: new Date(),
      } as Skill);

      const text = await service.buildSystemPromptForActiveSkill('sk', 1);
      expect(text).toContain('Reviewer');
      expect(text).toContain('请提供代码');
    });
  });

  describe('buildSystemPromptForChat', () => {
    it('without skillId returns null when no active skills in repo', async () => {
      repo.find.mockResolvedValueOnce([]);
      await expect(service.buildSystemPromptForChat(1, undefined)).resolves.toBeNull();
    });

    it('without skillId uses single-skill full format when exactly one active', async () => {
      const sk = {
        id: 'sk',
        name: 'Only',
        description: 'desc',
        icon: 'code',
        type: SkillType.MARKETPLACE,
        workflow: {
          nodes: [{ id: 'n1', type: 'prompt' as const, prompt: 'step' }],
          edges: [],
          startNodeId: 'n1',
        },
        avatar: '',
        tools: ['t'],
        marketplaceId: 'code-reviewer',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.ACTIVE,
        createdAt: new Date(),
      } as Skill;
      repo.find.mockResolvedValueOnce([sk]);
      const text = await service.buildSystemPromptForChat(1);
      expect(text).toContain('Only');
      expect(text).toContain('step');
    });

    it('without skillId merges multiple actives into compact multi block', async () => {
      const a = {
        id: 'a',
        name: 'A',
        description: 'da',
        icon: '',
        type: SkillType.CUSTOM,
        workflow: emptyWorkflow,
        avatar: '',
        tools: ['x'],
        marketplaceId: '',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.ACTIVE,
        createdAt: new Date(),
      } as Skill;
      const b = {
        id: 'b',
        name: 'B',
        description: 'db',
        icon: '',
        type: SkillType.CUSTOM,
        workflow: emptyWorkflow,
        avatar: '',
        tools: [],
        marketplaceId: '',
        isGlobal: false,
        userId: 1,
        status: SkillStatus.ACTIVE,
        createdAt: new Date(),
      } as Skill;
      repo.find.mockResolvedValueOnce([a, b]);
      const text = await service.buildSystemPromptForChat(1);
      expect(text).toContain('### 「A」');
      expect(text).toContain('### 「B」');
      expect(text).toContain('用户已在技能库中');
    });

    it('without skillId uses vector match when >= min actives and userMessage', async () => {
      const mk = (id: string, name: string) =>
        ({
          id,
          name,
          description: 'd',
          icon: '',
          type: SkillType.CUSTOM,
          workflow: emptyWorkflow,
          avatar: '',
          tools: [],
          marketplaceId: '',
          isGlobal: false,
          userId: 1,
          status: SkillStatus.ACTIVE,
          createdAt: new Date(),
        }) as Skill;
      const four = ['s1', 's2', 's3', 's4'].map((id, i) =>
        mk(id, `N${i}`),
      );
      repo.find.mockResolvedValueOnce(four);
      mockSkillVector.searchSkillIds.mockResolvedValueOnce(['s1', 's3']);
      const text = await service.buildSystemPromptForChat(
        1,
        undefined,
        '写一篇文章',
      );
      expect(mockSkillVector.searchSkillIds).toHaveBeenCalledWith(
        1,
        '写一篇文章',
        ['s1', 's2', 's3', 's4'],
        4,
      );
      expect(text).toContain('向量检索');
      expect(text).toContain('N0');
      expect(text).toContain('N2');
    });
  });
});
