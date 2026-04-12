import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { SkillVectorService } from './skill-vector.service';

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
  {
    id: 'blog-publish-assistant',
    name: 'Blog Publish Assistant',
    description:
      '根据你提供的草稿或要点，整理标题、摘要、Markdown 正文与标签，并说明如何在本站「写文章」或通过已登录请求 POST /api/blogs 完成发布（对话内不会自动发帖）。',
    icon: 'edit',
    tools: [],
    workflow: {
      nodes: [
        {
          id: 'start',
          type: 'prompt',
          prompt:
            '请用户说明文章主题、目标读者，并粘贴草稿、大纲或正文素材；信息不足时先简短追问。',
        },
        {
          id: 'draft',
          type: 'prompt',
          prompt:
            '基于用户素材撰写正文与元信息。除人类可读说明外，必须在回复末尾追加且仅追加一个代码块：推荐围栏第一行为 ```abner-blog-publish ；也可使用 ```json 但块内必须仅为合法 JSON 对象（勿夹杂说明文字）。字段 title、summary、content 为必填字符串；tags 为字符串数组可选；isPublished 为布尔可选（默认 false）。content 必须是可入库的完整 Markdown 正文（与上文可读正文一致），禁止使用 HTML 注释或「正文已在上方」等占位；content 内换行须写成 JSON 转义 \\n。该块用于聊天页「一键发布」按钮解析，不得省略。',
        },
        {
          id: 'publish-hint',
          type: 'prompt',
          prompt:
            '勿在 Markdown 正文末重复写「标签：…」行（标签只写 JSON.tags）；勿写「请点击发布到博客」「已准备好发布数据」等界面已有提示。若用户仅需润色且不需要发帖数据，可省略 JSON 块。',
        },
        {
          id: 'end',
          type: 'end',
          end: {
            message: '如需改写语气、缩略版或 SEO 标题变体，请继续说明。',
          },
        },
      ],
      edges: [
        { from: 'start', to: 'draft' },
        { from: 'draft', to: 'publish-hint' },
        { from: 'publish-hint', to: 'end' },
      ],
      startNodeId: 'start',
    },
  },
  {
    id: 'blog-direction-writer',
    name: 'Blog Direction Writer',
    description:
      '你只提供写作方向（主题、读者、字数、语气、是否要案例或数据），AI 自主完成选题、结构与全文，并在末尾附带与「Blog Publish Assistant」相同的一键发布数据块。',
    icon: 'bulb',
    tools: [],
    workflow: {
      nodes: [
        {
          id: 'collect',
          type: 'prompt',
          prompt:
            '用户可能只给一句话方向。判断信息是否足够成文：若缺少体裁/受众/大致篇幅/口吻（口语或正式）等关键点，最多追问 1～2 个问题；若方向已足够具体，可直接开始写作。',
        },
        {
          id: 'write',
          type: 'prompt',
          prompt:
            '根据用户方向独立完成一篇适合技术博客站的文章：含清晰小标题、Markdown 正文（必要时用列表、短代码块或伪代码说明）、原创语气。开头用一两段点明立意与读者收益。',
        },
        {
          id: 'package',
          type: 'prompt',
          prompt:
            '先输出人类可读的完整正文（Markdown）。在回复**最末尾且仅一处**追加代码块：推荐第一行 ```abner-blog-publish ；或使用 ```json 且块内仅为同一 JSON Schema。title、summary、content 必填；content 必须为与上文相同的完整 Markdown 正文（换行写成 \\n），禁止仅用注释或一句话表示「正文在上方」；tags 可选；isPublished 可选，默认 false。供聊天页「发布到博客」解析，禁止省略。',
        },
        {
          id: 'hint',
          type: 'prompt',
          prompt:
            '勿在正文再写「发布到博客」操作说明（界面已有按钮）；勿声称已自动发帖。',
        },
        {
          id: 'end',
          type: 'end',
          end: {
            message: '若要换角度、缩略版、系列大纲或中英双语版本，请继续说明。',
          },
        },
      ],
      edges: [
        { from: 'collect', to: 'write' },
        { from: 'write', to: 'package' },
        { from: 'package', to: 'hint' },
        { from: 'hint', to: 'end' },
      ],
      startNodeId: 'collect',
    },
  },
];

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly skillVectorService: SkillVectorService,
  ) {}

  private async safeSyncSkillIndex(skill: Skill): Promise<void> {
    try {
      await this.skillVectorService.syncSkill(skill);
    } catch (e) {
      this.logger.warn(
        `技能向量索引同步失败 skillId=${skill.id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

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
      type: SkillType.CUSTOM,
      userId,
      isGlobal: false,
      status: SkillStatus.INACTIVE,
    });
    const saved = await this.skillRepository.save(skill);
    await this.safeSyncSkillIndex(saved);
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
    await this.safeSyncSkillIndex(saved);
    return this.toResponseDto(saved);
  }

  async remove(id: string, userId: number): Promise<void> {
    const skill = await this.skillRepository.findOne({
      where: { id, userId, isGlobal: false },
    });
    if (!skill) {
      throw new NotFoundException('技能不存在或无法删除全局技能');
    }
    await this.skillVectorService.removeSkill(skill.id);
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
      await this.safeSyncSkillIndex(existing);
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
    await this.safeSyncSkillIndex(saved);
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
    await this.safeSyncSkillIndex(saved);
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
    await this.safeSyncSkillIndex(saved);
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

  /**
   * 为聊天组装系统侧技能说明：仅当技能存在、已激活且用户有权访问时返回文本。
   */
  async buildSystemPromptForActiveSkill(
    skillId: string | undefined,
    userId: number,
  ): Promise<string | null> {
    const id = skillId?.trim();
    if (!id) return null;

    const skill = await this.skillRepository.findOne({
      where: [
        { id, userId, status: SkillStatus.ACTIVE },
        { id, isGlobal: true, status: SkillStatus.ACTIVE },
      ],
    });
    if (!skill) {
      this.logger.warn(
        `忽略无效或未激活的 skillId=${id} userId=${userId}（聊天仍继续，不注入技能上下文）`,
      );
      return null;
    }
    return this.formatSkillAsSystemPrompt(skill);
  }

  /**
   * 聊天用技能上下文（推荐入口）。
   * - 传入 skillId：仅注入该技能（须已激活），与旧版一致。
   * - 不传 skillId：已激活技能数较少时合并全部；较多时（见 SKILL_VECTOR_MIN_ACTIVE）用与知识库相同的向量链路（Chroma + MiniMax embedding）按 userMessage 匹配 Top-K 再注入。
   */
  async buildSystemPromptForChat(
    userId: number,
    skillId?: string,
    userMessage?: string,
  ): Promise<string | null> {
    const id = skillId?.trim();
    if (id) {
      return this.buildSystemPromptForActiveSkill(id, userId);
    }
    return this.buildSystemPromptForAllActiveSkills(userId, userMessage);
  }

  private async buildSystemPromptForAllActiveSkills(
    userId: number,
    userMessage?: string,
  ): Promise<string | null> {
    const skills = await this.skillRepository.find({
      where: [
        { userId, status: SkillStatus.ACTIVE },
        { isGlobal: true, status: SkillStatus.ACTIVE },
      ],
      order: { createdAt: 'DESC' },
    });
    if (skills.length === 0) {
      return null;
    }
    const unique = [...new Map(skills.map((s) => [s.id, s])).values()];
    if (unique.length === 1) {
      return this.formatSkillAsSystemPrompt(unique[0]);
    }

    const minForVector = Math.max(
      2,
      parseInt(process.env.SKILL_VECTOR_MIN_ACTIVE || '4', 10) || 4,
    );
    const topK = Math.max(
      1,
      parseInt(process.env.SKILL_VECTOR_TOP_K || '4', 10) || 4,
    );

    if (
      unique.length >= minForVector &&
      userMessage &&
      userMessage.trim().length > 0
    ) {
      try {
        const candidateIds = unique.map((s) => s.id);
        const matchedIds = await this.skillVectorService.searchSkillIds(
          userId,
          userMessage.trim(),
          candidateIds,
          topK,
        );
        const picked = matchedIds
          .map((id) => unique.find((s) => s.id === id))
          .filter((s): s is Skill => Boolean(s));
        if (picked.length > 0) {
          return this.formatMatchedSkillsFullPrompt(picked);
        }
      } catch (e) {
        this.logger.warn(
          `技能向量匹配失败，回退为合并全部已激活技能: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    return this.formatMultipleSkillsAsSystemPrompt(unique);
  }

  /** 向量命中多条时：每条使用完整单技能提示（含工作流与博客规则），块间分隔。 */
  private formatMatchedSkillsFullPrompt(skills: Skill[]): string {
    if (skills.length === 0) {
      return '';
    }
    if (skills.length === 1) {
      return this.formatSkillAsSystemPrompt(skills[0]);
    }
    const parts = skills.map((s) => this.formatSkillAsSystemPrompt(s));
    return [
      '以下技能由向量检索按与「当前用户消息」的相关性从已激活列表中选出；请优先按这些技能的约束协作。其它已激活但未列出的技能本轮未注入上下文。',
      '',
      parts.join('\n\n━━━━━━━━━━━━━━━━\n\n'),
    ].join('\n');
  }

  private formatSkillAsSystemPrompt(skill: Skill): string {
    const wf = skill.workflow;
    const lines: string[] = [
      `当前会话启用的用户技能：「${skill.name}」`,
      skill.description ? `技能说明：${skill.description}` : '',
      `建议关注的工具/能力标签：${(skill.tools || []).join(', ') || '无'}`,
    ];
    if (wf?.nodes?.length) {
      lines.push(
        '工作流节点参考（按顺序协助用户，按需引导而非机械逐步输出）：',
      );
      for (const n of wf.nodes) {
        if (n.type === 'prompt' && n.prompt) {
          lines.push(`- [${n.id}] ${n.prompt}`);
        } else if (n.type === 'tool' && n.tool) {
          lines.push(
            `- [${n.id}] 工具: ${n.tool.name} 参数: ${JSON.stringify(n.tool.params || {})}`,
          );
        } else if (n.type === 'end' && n.end?.message) {
          lines.push(`- [${n.id}] 结束语参考: ${n.end.message}`);
        } else if (n.type === 'condition' && n.condition) {
          lines.push(
            `- [${n.id}] 条件分支: ${n.condition.expression} → true:${n.condition.trueNodeId} false:${n.condition.falseNodeId}`,
          );
        }
      }
    }
    if (this.isBlogPublishSkill(skill)) {
      this.appendBlogPublishRules(lines);
    } else {
      lines.push(
        '请根据以上技能说明与用户输入自然协作；不要声称已执行尚未通过工具调用完成的步骤。',
      );
    }
    return lines.filter(Boolean).join('\n');
  }

  private formatMultipleSkillsAsSystemPrompt(skills: Skill[]): string {
    const lines: string[] = [
      '用户已在技能库中「激活」了下列技能（可同时具备）。请根据当前用户问题的意图，自行选用其中最相关的技能约束与工作流；不要机械执行与用户问题无关的步骤，也不要把多个无关技能强行串成一条固定流水线。',
      '',
    ];
    let anyBlog = false;
    for (const sk of skills) {
      lines.push(`### 「${sk.name}」`);
      if (sk.description) {
        lines.push(sk.description);
      }
      lines.push(`工具/能力标签：${(sk.tools || []).join(', ') || '无'}`);
      lines.push('');
      if (this.isBlogPublishSkill(sk)) {
        anyBlog = true;
      }
    }
    if (anyBlog) {
      this.appendBlogPublishRules(lines);
    } else {
      lines.push(
        '请根据以上技能说明与用户输入自然协作；不要声称已执行尚未通过工具调用完成的步骤。',
      );
    }
    return lines.filter(Boolean).join('\n');
  }

  private appendBlogPublishRules(lines: string[]): void {
    lines.push(
      '【本站博客技能强制规则】本对话已对接「已登录用户在本站创建博客」的产品能力：你负责生成/润色 Markdown 与元信息，并在适当时机在回复末尾附带 ```abner-blog-publish 合法 JSON 代码块（字段与工作流一致）；用户将在该条助手消息下方通过「发布到博客」按钮二次确认后，由前端携带 JWT 调用本站 POST /api/blogs 完成创建。',
      '严禁使用与本产品不符的推脱话术，例如：「无法直接发布文章」「没有连接任何 CMS/内容管理系统」「不知道要发布到掘金/知乎/公众号/个人博客等哪个平台」「只能给建议不能发布」等。用户目标就是本站博客，不要引导到外站发布才能完成。',
      '若用户只给方向或素材不足，可简短追问或合理假设后成稿；不要以「缺平台信息」为由拒绝输出正文与 JSON 块。',
      '除 JSON 内 isPublished 含义外，不要声称你已替用户执行了发帖 HTTP 请求；不必在正文复述发帖操作说明。',
      '一键发布接口只提交 JSON 内的 content 字段：该字段必须是完整正文，不得用「<!-- … -->」或「完整 Markdown 已在上方」类占位替代。',
      '人类可读 Markdown 中不要单独用一行「标签：…」罗列标签（仅用 JSON 的 tags）；不要在正文末尾写「请点击发布到博客」「已准备好发布数据」等产品说明（聊天页已有发布卡片与按钮）。',
      '其他非博客类工具调用：仍不要声称已执行未实际发生的 MCP 调用。',
    );
  }

  /** 市场博客技能或工作流中含一键发布约定的自定义技能 */
  private isBlogPublishSkill(skill: Skill): boolean {
    const marketplaceIds = new Set([
      'blog-publish-assistant',
      'blog-direction-writer',
    ]);
    if (skill.marketplaceId && marketplaceIds.has(skill.marketplaceId)) {
      return true;
    }
    try {
      return JSON.stringify(skill.workflow ?? {}).includes(
        'abner-blog-publish',
      );
    } catch {
      return false;
    }
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
