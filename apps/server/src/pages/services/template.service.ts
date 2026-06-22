import {
  Injectable,
  NotFoundException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockTemplate } from '../entities/block-template.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

/** 预置模板数据 */
const DEFAULT_TEMPLATES: Partial<BlockTemplate>[] = [
  {
    name: '营销落地页',
    category: '营销',
    sort: 1,
    description: '包含页头、特色网格和页脚的营销落地页模板',
    components: JSON.stringify({
      pages: [
        {
          name: '首页',
          component: [
            '<header style="background:#1890ff;color:#fff;padding:60px 20px;text-align:center">',
            '<h1 style="font-size:2.5rem;margin:0 0 16px">主标题</h1>',
            '<p style="font-size:1.2rem;opacity:0.9">副标题描述文字</p>',
            '</header>',
            '<section style="padding:40px 20px;max-width:1200px;margin:0 auto">',
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">',
            '<div style="padding:24px;border:1px solid #e8e8e8;border-radius:8px">',
            '<h3>特色一</h3><p>特色描述文字</p></div>',
            '<div style="padding:24px;border:1px solid #e8e8e8;border-radius:8px">',
            '<h3>特色二</h3><p>特色描述文字</p></div>',
            '<div style="padding:24px;border:1px solid #e8e8e8;border-radius:8px">',
            '<h3>特色三</h3><p>特色描述文字</p></div>',
            '</div></section>',
            '<footer style="background:#f5f5f5;padding:20px;text-align:center;color:#999">',
            '<p>© 2024 版权所有</p></footer>',
          ].join(''),
        },
      ],
    }),
  },
  {
    name: '关于我们',
    category: '企业',
    sort: 2,
    description: '展示品牌故事、使命和价值观的关于页面模板',
    components: JSON.stringify({
      pages: [
        {
          name: '关于我们',
          component: [
            '<section style="padding:60px 20px;max-width:800px;margin:0 auto">',
            '<h1 style="font-size:2rem;margin-bottom:20px">关于我们</h1>',
            '<p style="line-height:1.8;color:#555">这是一段关于公司和团队的介绍文字。在这里展示你的品牌故事、使命和价值观，让访问者更好地了解你。</p>',
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:40px">',
            '<div style="text-align:center;padding:20px">',
            '<div style="font-size:2rem;font-weight:bold;color:#1890ff">100+</div><div>服务客户</div></div>',
            '<div style="text-align:center;padding:20px">',
            '<div style="font-size:2rem;font-weight:bold;color:#1890ff">5年</div><div>行业经验</div></div>',
            '<div style="text-align:center;padding:20px">',
            '<div style="font-size:2rem;font-weight:bold;color:#1890ff">50+</div><div>团队成员</div></div>',
            '</div></section>',
          ].join(''),
        },
      ],
    }),
  },
  {
    name: '联系我们',
    category: '企业',
    sort: 3,
    description: '包含联系表单的页面模板',
    components: JSON.stringify({
      pages: [
        {
          name: '联系我们',
          component: [
            '<section style="padding:60px 20px;max-width:600px;margin:0 auto">',
            '<h1 style="font-size:2rem;margin-bottom:20px">联系我们</h1>',
            '<p style="color:#555;margin-bottom:30px">有任何问题或合作意向，请随时联系我们。</p>',
            '<div style="margin-bottom:16px">',
            '<label style="display:block;margin-bottom:4px;font-weight:500">姓名</label>',
            '<input style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:6px" placeholder="您的姓名" /></div>',
            '<div style="margin-bottom:16px">',
            '<label style="display:block;margin-bottom:4px;font-weight:500">邮箱</label>',
            '<input style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:6px" placeholder="your@email.com" /></div>',
            '<div style="margin-bottom:16px">',
            '<label style="display:block;margin-bottom:4px;font-weight:500">留言</label>',
            '<textarea style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:6px;min-height:100px" placeholder="请输入留言内容"></textarea></div>',
            '<button style="background:#1890ff;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer">提交</button>',
            '</section>',
          ].join(''),
        },
      ],
    }),
  },
  {
    name: '产品展示',
    category: '营销',
    sort: 4,
    description: '适合展示产品/服务列表的页面模板',
    components: JSON.stringify({
      pages: [
        {
          name: '产品展示',
          component: [
            '<section style="padding:60px 20px;background:#f8f9fa">',
            '<div style="max-width:1200px;margin:0 auto;text-align:center">',
            '<h1 style="font-size:2rem;margin-bottom:16px">产品与服务</h1>',
            '<p style="color:#666;margin-bottom:40px">了解我们的核心产品与服务</p>',
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px">',
            '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">',
            '<div style="height:180px;background:linear-gradient(135deg,#667eea,#764ba2)"></div>',
            '<div style="padding:20px"><h3>产品一</h3><p style="color:#666;line-height:1.6">产品描述文字</p></div></div>',
            '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">',
            '<div style="height:180px;background:linear-gradient(135deg,#f093fb,#f5576c)"></div>',
            '<div style="padding:20px"><h3>产品二</h3><p style="color:#666;line-height:1.6">产品描述文字</p></div></div>',
            '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">',
            '<div style="height:180px;background:linear-gradient(135deg,#4facfe,#00f2fe)"></div>',
            '<div style="padding:20px"><h3>产品三</h3><p style="color:#666;line-height:1.6">产品描述文字</p></div></div>',
            '</div></div></section>',
          ].join(''),
        },
      ],
    }),
  },
];

@Injectable()
export class TemplateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TemplateService.name);
  private seeded = false;

  constructor(
    @InjectRepository(BlockTemplate)
    private readonly templateRepository: Repository<BlockTemplate>,
  ) {}

  /** 应用启动时自动填充预置模板（仅在模板表为空时） */
  async onApplicationBootstrap() {
    const count = await this.templateRepository.count();
    if (count === 0) {
      this.logger.log('正在初始化预置模板数据...');
      for (const tpl of DEFAULT_TEMPLATES) {
        await this.templateRepository.save(this.templateRepository.create(tpl));
      }
      this.logger.log(`已初始化 ${DEFAULT_TEMPLATES.length} 个预置模板`);
    }
    this.seeded = true;
  }

  async findAll(category?: string): Promise<BlockTemplate[]> {
    const where = category ? { category } : {};
    return this.templateRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BlockTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`模板 #${id} 不存在`);
    }
    return template;
  }

  async create(dto: CreateTemplateDto): Promise<BlockTemplate> {
    const template = this.templateRepository.create({
      name: dto.name,
      category: dto.category || '',
      description: dto.description || undefined,
      thumbnail: dto.thumbnail || undefined,
      components: dto.components,
      html: dto.html || undefined,
      css: dto.css || undefined,
      sort: dto.sort ?? 0,
    });
    return this.templateRepository.save(template);
  }

  async update(id: number, dto: UpdateTemplateDto): Promise<BlockTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }
}
