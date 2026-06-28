import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PageGeneratorConfig, type LLMProvider } from './entities/page-generator-config.entity';
import { AiGenerationTask } from './entities/ai-generation-task.entity';
import { CreateConfigDto, ConfigResponseDto } from './dto/create-config.dto';
import { GeneratePageDto, RefinePageDto } from './dto/generate-page.dto';
import { getLLMProvider } from './llm/llm-provider.factory';
import type { LLMMessage } from './llm/llm-provider.interface';
import { buildSystemPrompt, COMPONENT_METADATA } from './prompts/system-prompt';
import { PagesService } from '../pages/pages.service';

type SSEEventCallback = (event: string, data: Record<string, unknown>) => void;

@Injectable()
export class PageGeneratorService {
  private readonly logger = new Logger(PageGeneratorService.name);
  private readonly activeStreams = new Map<string, AbortController>();

  constructor(
    @InjectRepository(PageGeneratorConfig)
    private readonly configRepo: Repository<PageGeneratorConfig>,
    @InjectRepository(AiGenerationTask)
    private readonly taskRepo: Repository<AiGenerationTask>,
    private readonly pagesService: PagesService,
  ) {}

  /* ==================== Config Management ==================== */

  async getConfig(userId: number): Promise<ConfigResponseDto | null> {
    const config = await this.configRepo.findOne({ where: { userId } });
    if (!config) return null;

    return {
      id: config.id,
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      hasApiKey: !!config.apiKey,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  async saveConfig(userId: number, dto: CreateConfigDto): Promise<ConfigResponseDto> {
    let config = await this.configRepo.findOne({ where: { userId } });

    if (config) {
      config.provider = dto.provider as LLMProvider;
      config.apiKey = dto.apiKey;
      if (dto.baseUrl !== undefined) config.baseUrl = dto.baseUrl;
      if (dto.model !== undefined) config.model = dto.model;
    } else {
      config = this.configRepo.create({
        userId,
        provider: dto.provider as LLMProvider,
        apiKey: dto.apiKey,
        baseUrl: dto.baseUrl || '',
        model: dto.model || '',
      });
    }

    await this.configRepo.save(config);

    return {
      id: config.id,
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      hasApiKey: !!config.apiKey,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  async deleteConfig(userId: number): Promise<void> {
    const result = await this.configRepo.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException('Configuration not found');
    }
  }

  /* ==================== Page Generation (SSE Stream) ==================== */

  /**
   * Generate a page with SSE streaming.
   * @param userId - Current user ID
   * @param dto - Generation request
   * @param onEvent - SSE event callback
   * @returns The task session ID
   */
  async generatePage(
    userId: number,
    dto: GeneratePageDto,
    onEvent: SSEEventCallback,
  ): Promise<string> {
    const config = await this.configRepo.findOne({ where: { userId } });
    if (!config || !config.apiKey) {
      throw new BadRequestException(
        '请先配置 LLM API 密钥。在 AI 生成页面中点击"配置 API"进行设置。',
      );
    }

    const sessionId = dto.sessionId || uuidv4();

    // Create or update task
    let task = await this.taskRepo.findOne({
      where: { sessionId, userId },
    });

    if (task) {
      task.status = 'generating';
      task.prompt = dto.prompt;
      task.style = dto.style || task.style;
    } else {
      task = this.taskRepo.create({
        userId,
        sessionId,
        prompt: dto.prompt,
        style: dto.style || 'modern',
        status: 'generating',
      });
    }
    await this.taskRepo.save(task);

    // Start generation in background
    this.runGeneration(userId, sessionId, dto, config, onEvent).catch((err) => {
      this.logger.error(`Generation failed for session ${sessionId}:`, err);
    });

    return sessionId;
  }

  private async runGeneration(
    userId: number,
    sessionId: string,
    dto: GeneratePageDto,
    config: PageGeneratorConfig,
    onEvent: SSEEventCallback,
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeStreams.set(sessionId, abortController);

    try {
      const provider = getLLMProvider(config.provider);
      const componentMeta = this.buildComponentMetaString();
      const systemPrompt = buildSystemPrompt(componentMeta);

      const styleHint = dto.style
        ? `\n请使用 "${dto.style}" 风格主题。`
        : '';

      const userPrompt = `请为一个页面生成结构，用户需求如下：

"${dto.prompt}"
${styleHint}

请先规划页面使用的区域组合，然后为每个区域生成完整的 SchemaNode 子树。
确保所有区域组合能构成一个完整的页面。`;

      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      // Phase 1: Plan + generate full schema via LLM
      let fullResult = '';
      await provider.stream(
        messages,
        {
          apiKey: config.apiKey,
          baseUrl: config.baseUrl || undefined,
          model: config.model || undefined,
        },
        (chunk) => {
          fullResult += chunk;
        },
        () => {
          // Done - parse and emit region events
          this.processGenerationResult(
            userId,
            sessionId,
            fullResult,
            dto,
            onEvent,
          );
        },
        (error) => {
          this.logger.error('LLM stream error:', error);
          onEvent('error', {
            message: `AI 生成失败：${error.message}`,
            retryable: true,
          });
          this.updateTaskStatus(sessionId, 'failed', error.message);
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error('Generation error:', err);
      onEvent('error', { message, retryable: true });
      this.updateTaskStatus(sessionId, 'failed', message);
    } finally {
      this.activeStreams.delete(sessionId);
    }
  }

  private processGenerationResult(
    userId: number,
    sessionId: string,
    result: string,
    dto: GeneratePageDto,
    onEvent: SSEEventCallback,
  ): void {
    try {
      // Extract JSON from the result (handle possible markdown fences)
      const jsonStr = this.extractJson(result);
      const parsed = JSON.parse(jsonStr);

      const regions = parsed.regions || [];
      const regionInfo: Array<{
        regionId: string;
        regionType: string;
        name: string;
        status: string;
      }> = [];

      let allSuccess = true;

      for (const region of regions) {
        const regionId = region.regionId || `region_${Math.random().toString(36).slice(2, 8)}`;
        const regionType = region.regionType || 'content';
        const name = region.name || '内容区域';

        // Emit region_start
        onEvent('region_start', { regionId, regionType, name });

        // Store region info
        regionInfo.push({
          regionId,
          regionType,
          name,
          status: 'completed',
        });

        // Emit region_end with full schema
        if (region.schema) {
          onEvent('region_end', {
            regionId,
            schema: region.schema,
          });
        } else {
          onEvent('region_end', {
            regionId,
            schema: { id: `region_${regionId}`, type: 'section', props: {}, children: [] },
          });
        }
      }

      // If no regions parsed, create a single content region with the result
      if (regions.length === 0) {
        const fallbackRegionId = `region_fallback`;
        onEvent('region_start', {
          regionId: fallbackRegionId,
          regionType: 'content',
          name: '内容区域',
        });
        onEvent('region_end', {
          regionId: fallbackRegionId,
          schema: {
            id: fallbackRegionId,
            type: 'section',
            props: { style: { padding: '40px 20px' } },
            children: [
              {
                id: 'gen_text_1',
                type: 'text',
                props: { as: 'h1', content: parsed.pageTitle || dto.prompt, style: { textAlign: 'center' } },
              },
            ],
          },
        });
        regionInfo.push({
          regionId: fallbackRegionId,
          regionType: 'content',
          name: '内容区域',
          status: 'completed',
        });
      }

      // Build the complete page schema
      const rootChildren = regions
        .filter((r: { schema?: Record<string, unknown> }) => r.schema)
        .map((r: { schema: Record<string, unknown> }) => r.schema);

      const pageSchema = {
        root: {
          id: 'root',
          type: 'container',
          props: {},
          children: rootChildren.length > 0 ? rootChildren : undefined,
        },
        css: parsed.globalCss || undefined,
        meta: {
          title: parsed.pageTitle || dto.prompt,
          description: dto.prompt,
        },
      };

      // Emit complete event
      onEvent('complete', {
        pageSchema,
        regions: regionInfo,
        sessionId,
      });

      // Update task
      this.updateTask(sessionId, {
        status: allSuccess ? 'completed' : 'partial',
        schema: pageSchema as unknown as Record<string, unknown>,
        regions: regionInfo,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析生成结果失败';
      this.logger.error('Parse error:', err);
      onEvent('error', { message, retryable: true });
      this.updateTaskStatus(sessionId, 'failed', message);
    }
  }

  /* ==================== Iterative Refinement ==================== */

  async refinePage(
    userId: number,
    dto: RefinePageDto,
    onEvent: SSEEventCallback,
  ): Promise<void> {
    const config = await this.configRepo.findOne({ where: { userId } });
    if (!config || !config.apiKey) {
      throw new BadRequestException('请先配置 LLM API 密钥');
    }

    const task = await this.taskRepo.findOne({
      where: { sessionId: dto.sessionId, userId },
    });
    if (!task) {
      throw new NotFoundException('Generation task not found');
    }

    const provider = getLLMProvider(config.provider);
    const componentMeta = this.buildComponentMetaString();
    const systemPrompt = buildSystemPrompt(componentMeta);

    const currentSchema = task.schema
      ? JSON.stringify(task.schema, null, 2)
      : '暂无已有页面结构';

    const userPrompt = `当前页面结构如下：
${currentSchema}

用户希望进行修改，需求是：
"${dto.message}"

请输出修改后的完整页面结构（含所有区域）。`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let fullResult = '';
    try {
      await provider.stream(
        messages,
        {
          apiKey: config.apiKey,
          baseUrl: config.baseUrl || undefined,
          model: config.model || undefined,
        },
        (chunk) => {
          fullResult += chunk;
        },
      () => {
          // Process refinement result
          try {
            const jsonStr = this.extractJson(fullResult);
            const parsed = JSON.parse(jsonStr);

            // Re-emit all regions with updated content
            const regions = parsed.regions || [];
            for (const region of regions) {
              const regionId = region.regionId || `region_refined_${Math.random().toString(36).slice(2, 8)}`;
              const regionType = region.regionType || 'content';
              const name = region.name || '内容区域';

              onEvent('region_start', { regionId, regionType, name });

              if (region.schema) {
                // Emit individual components for streaming effect
                if (region.schema.children) {
                  for (const child of region.schema.children) {
                    onEvent('region_component', {
                      regionId,
                      componentType: child.type,
                      props: child.props,
                    });
                  }
                }
                onEvent('region_end', { regionId, schema: region.schema });
              } else {
                onEvent('region_end', {
                  regionId,
                  schema: { id: regionId, type: 'section', props: {} },
                });
              }
            }

            // Build updated schema
            const rootChildren = regions
              .filter((r: { schema?: Record<string, unknown> }) => r.schema)
              .map((r: { schema: Record<string, unknown> }) => r.schema);

            const updatedSchema = {
              root: {
                id: 'root',
                type: 'container',
                props: {},
                children: rootChildren.length > 0 ? rootChildren : undefined,
              },
              css: parsed.globalCss || task.schema?.css || undefined,
              meta: task.schema?.meta || { title: '' },
            };

            onEvent('complete', {
              pageSchema: updatedSchema,
              regions: regions.map((r: { regionId?: string; regionType?: string; name?: string }) => ({
                regionId: r.regionId || '',
                regionType: r.regionType || 'content',
                name: r.name || '',
                status: 'completed',
              })),
              sessionId: dto.sessionId,
            });

            // Update task
            this.updateTask(dto.sessionId, {
              status: 'completed',
              schema: updatedSchema as unknown as Record<string, unknown>,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : '解析修改结果失败';
            onEvent('error', { message, retryable: true });
          }
        },
        (error) => {
          onEvent('error', {
            message: `AI 修改失败：${error.message}`,
            retryable: true,
          });
        },
      );
    } catch (err) {
      onEvent('error', {
        message: err instanceof Error ? err.message : '修改失败',
        retryable: true,
      });
    }
  }

  /* ==================== Load into Editor ==================== */

  async loadIntoEditor(
    userId: number,
    sessionId: string,
    title: string,
  ): Promise<{ pageId: number; slug: string }> {
    const task = await this.taskRepo.findOne({
      where: { sessionId, userId },
    });
    if (!task || !task.schema) {
      throw new NotFoundException('Generation task not found or empty');
    }

    // Generate a unique slug
    const slug = `ai-${title
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'ai-page'}-${Date.now().toString(36)}`;

    // Create page via PagesService
    const page = await this.pagesService.create({
      title,
      slug,
      description: task.prompt,
    });

    // Save schema with editorData for GrapesJS
    const schemaStr = JSON.stringify({
      ...task.schema,
      editorData: {
        pages: [
          {
            name: title,
            component: this.buildEditorHtml(task.schema),
          },
        ],
      },
    });

    await this.pagesService.update(page.id, { schema: schemaStr } as Parameters<typeof this.pagesService.update>[1]);

    // Update task with page ID
    task.pageId = page.id;
    await this.taskRepo.save(task);

    return { pageId: page.id, slug };
  }

  private buildEditorHtml(schema: Record<string, unknown>): string {
    // Build a minimal HTML structure for editor initialization
    const root = (schema as { root?: Record<string, unknown> }).root || schema;
    const children = root.children as Array<Record<string, unknown>> | undefined;

    if (!children || children.length === 0) {
      return '<div data-gjs-type="page-content"><h1 style="text-align:center;padding:40px">AI 生成的页面</h1></div>';
    }

    const htmlChildren = children.map((child) => this.nodeToHtml(child)).join('\n');

    return `<div data-gjs-type="page-content">${htmlChildren}</div>
<div data-gjs-type="modals-container" style="display:none"></div>`;
  }

  private nodeToHtml(node: Record<string, unknown>): string {
    const type = node.type as string;
    const props = node.props as Record<string, unknown> || {};
    const children = node.children as Array<Record<string, unknown>> | undefined;

    // Map component type to HTML tag
    const tagMap: Record<string, string> = {
      container: 'div',
      section: 'section',
      row: 'div',
      column: 'div',
      text: 'p',
      image: 'img',
      button: 'button',
      divider: 'hr',
      spacer: 'div',
      'nav-menu': 'nav',
      'nav-link': 'a',
      card: 'div',
      form: 'form',
    };

    const tag = tagMap[type] || 'div';
    const dataAttr = `data-schema-type="${type}"`;
    const styleAttr = props.style
      ? ` style="${this.styleObjToStr(props.style as Record<string, string>)}"`
      : '';

    // Handle special types
    if (type === 'spacer') {
      const height = (props.height as number) || 40;
      return `<div data-schema-type="spacer" style="height:${height}px"></div>`;
    }

    if (type === 'divider') {
      const color = (props.color as string) || '#e8e8e8';
      const lineStyle = (props.style as string) || 'solid';
      const height = (props.height as number) || 1;
      return `<hr data-schema-type="divider" style="border:none;border-top:${height}px ${lineStyle} ${color};margin:16px 0" />`;
    }

    if (type === 'image') {
      const src = (props.src as string) || '';
      const alt = (props.alt as string) || '';
      return `<img data-schema-type="image" src="${src}" alt="${alt}"${styleAttr} />`;
    }

    if (type === 'text') {
      const as = (props.as as string) || 'p';
      const content = (props.content as string) || '';
      return `<${as} data-schema-type="text"${styleAttr}>${content}</${as}>`;
    }

    if (type === 'button') {
      const text = (props.text as string) || '按钮';
      const variant = (props.variant as string) || 'primary';
      return `<button data-schema-type="button" data-variant="${variant}"${styleAttr}>${text}</button>`;
    }

    // Container types - render children recursively
    if (children && children.length > 0) {
      const innerHtml = children.map((c) => this.nodeToHtml(c)).join('\n');
      return `<${tag} ${dataAttr}${styleAttr}>\n${innerHtml}\n</${tag}>`;
    }

    return `<${tag} ${dataAttr}${styleAttr}></${tag}>`;
  }

  private styleObjToStr(style: Record<string, string>): string {
    return Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}:${value}`;
      })
      .join(';');
  }

  /* ==================== Task Management ==================== */

  async getTask(sessionId: string, userId: number): Promise<AiGenerationTask | null> {
    return this.taskRepo.findOne({ where: { sessionId, userId } });
  }

  async getTaskHistory(userId: number): Promise<AiGenerationTask[]> {
    return this.taskRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async cancelGeneration(sessionId: string, userId: number): Promise<void> {
    const abortController = this.activeStreams.get(sessionId);
    if (abortController) {
      abortController.abort();
      this.activeStreams.delete(sessionId);
    }
    await this.updateTaskStatus(sessionId, 'failed', '已取消');
  }

  /* ==================== Private Helpers ==================== */

  private buildComponentMetaString(): string {
    return Object.entries(COMPONENT_METADATA)
      .map(
        ([type, meta]: [string, { displayName: string; visualDescription: string; commonProps: string[]; styleHints: string; typicalChildren: string[] }]) =>
          `- ${type}（${meta.displayName}）：${meta.visualDescription}\n  Props：${meta.commonProps.join(', ')}\n  样式提示：${meta.styleHints}\n  典型子组件：${meta.typicalChildren.join(', ') || '无'}`,
      )
      .join('\n\n');
  }

  private extractJson(text: string): string {
    // Remove markdown code fences if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return jsonMatch[1].trim();

    // Try to find JSON object directly
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return braceMatch[0];

    return text;
  }

  private async updateTask(
    sessionId: string,
    updates: Partial<AiGenerationTask>,
  ): Promise<void> {
    try {
      await this.taskRepo.update({ sessionId }, updates);
    } catch (err) {
      this.logger.error(`Failed to update task ${sessionId}:`, err);
    }
  }

  private async updateTaskStatus(
    sessionId: string,
    status: AiGenerationTask['status'],
    error?: string,
  ): Promise<void> {
    await this.updateTask(sessionId, { status, error } as Partial<AiGenerationTask>);
  }
}
