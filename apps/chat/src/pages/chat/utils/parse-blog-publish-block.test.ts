import { describe, it, expect } from 'vitest';
import type { CreateBlogDto } from '@services/generated/model';
import {
  extractBalancedJsonObject,
  looksLikePlaceholderBlogJsonContent,
  mergeBlogPublishDraftWithStrippedBody,
  parseAbnerBlogPublishDraft,
  stripAbnerBlogPublishBlock,
  stripBlogPublishDisplayNoise,
} from './parse-blog-publish-block';

describe('parse-blog-publish-block', () => {
  it('mergeBlogPublishDraftWithStrippedBody replaces HTML-comment placeholder content', () => {
    const stripped = '# Title\n\n' + 'x'.repeat(80);
    const draft: CreateBlogDto = {
      title: 'T',
      summary: '摘要摘要',
      content: '<!-- 完整 Markdown 已在上方正文给出 -->',
    };
    const merged = mergeBlogPublishDraftWithStrippedBody(draft, stripped);
    expect(merged.content).toBe(stripped);
  });

  it('mergeBlogPublishDraftWithStrippedBody keeps real JSON content when not placeholder', () => {
    const stripped = '# Only intro\n\n' + 'y'.repeat(80);
    const realBody = '# Full\n\n' + 'z'.repeat(120);
    const draft: CreateBlogDto = {
      title: 'T',
      summary: 'Su',
      content: realBody,
    };
    expect(mergeBlogPublishDraftWithStrippedBody(draft, stripped).content).toBe(realBody);
  });

  it('looksLikePlaceholderBlogJsonContent is false for long article with small HTML comment', () => {
    const body = '<!-- v2 -->\n\n# Hi\n\n' + 'p'.repeat(500);
    expect(looksLikePlaceholderBlogJsonContent(body)).toBe(false);
  });

  it('stripBlogPublishDisplayNoise removes trailing tag line and publish-button hint', () => {
    const body =
      '# 正文\n\n段落。\n\n标签：工具推荐 开发效率 CLI\n\n已准备好发布数据，请点击消息下方的「发布到博客」按钮确认发布。如需调整标题、内容或标签，告诉我即可。\n';
    expect(stripBlogPublishDisplayNoise(body)).toBe('# 正文\n\n段落。');
  });

  it('stripAbnerBlogPublishBlock applies display noise strip after removing fence', () => {
    const inner = {
      title: 'T',
      summary: '摘要摘要',
      content: '# Body\n\n' + 'c'.repeat(20),
      tags: ['x'],
      isPublished: false,
    };
    const json = JSON.stringify(inner);
    const text = `# Hi\n\n标签：a b\n\n已准备好发布数据，请点击「发布到博客」。\n\n\`\`\`abner-blog-publish\n${json}\n\`\`\`\n`;
    const stripped = stripAbnerBlogPublishBlock(text);
    expect(stripped).toBe('# Hi');
    expect(parseAbnerBlogPublishDraft(text)?.title).toBe('T');
  });

  it('extractBalancedJsonObject handles nested braces in strings', () => {
    const raw = '{"a":"{}"}';
    const out = extractBalancedJsonObject(raw, 0);
    expect(out).toBe(raw);
  });

  it('parses abner fence when content has markdown code fences (valid JSON)', () => {
    const inner = {
      title: 'T',
      summary: 'Su',
      content: '# Hello\n\n```javascript\nconst x = 1;\n```\n\nend',
      tags: ['a'],
      isPublished: false,
    };
    const json = JSON.stringify(inner);
    const text = `intro\n\`\`\`abner-blog-publish\n${json}\n\`\`\`\nfooter`;
    const d = parseAbnerBlogPublishDraft(text);
    expect(d?.title).toBe('T');
    expect(d?.content).toContain('```javascript');
    const stripped = stripAbnerBlogPublishBlock(text);
    expect(stripped).not.toContain('abner-blog-publish');
    expect(stripped).toContain('intro');
    expect(stripped).toContain('footer');
  });

  it('parses line-start fence with no language (renders as text in MarkdownRenderer)', () => {
    const inner = {
      title: 'T2',
      summary: 'Su',
      content: '# Hello\n\nmore than ten',
      tags: [],
      isPublished: false,
    };
    const json = JSON.stringify(inner);
    const text = `说明如下：\n\`\`\`\n${json}\n\`\`\`\n谢谢`;
    const d = parseAbnerBlogPublishDraft(text);
    expect(d?.title).toBe('T2');
    const stripped = stripAbnerBlogPublishBlock(text);
    expect(stripped).not.toContain('"title"');
    expect(stripped).toContain('说明');
    expect(stripped).toContain('谢谢');
  });

  it('parses ```abner fence and maps abstract to summary (no summary key)', () => {
    const inner = {
      title: 'T4',
      abstract: '摘要至少两字',
      content: '12345678901234567890',
      tags: ['x'],
      isPublished: false,
    };
    const json = JSON.stringify(inner);
    const text = `说明\n\`\`\`abner\n${json}\n\`\`\`\n结尾`;
    const d = parseAbnerBlogPublishDraft(text);
    expect(d?.title).toBe('T4');
    expect(d?.summary).toBe('摘要至少两字');
    expect(d?.content).toContain('1234567890');
    const stripped = stripAbnerBlogPublishBlock(text);
    expect(stripped).not.toContain('"abstract"');
    expect(stripped).toContain('说明');
    expect(stripped).toContain('结尾');
  });

  it('parses line-start unfenced JSON as last resort', () => {
    const inner = {
      title: 'T3',
      summary: 'Su',
      content: '1234567890',
      tags: [],
      isPublished: false,
    };
    const json = JSON.stringify(inner, null, 2);
    const text = `请看\n${json}\n以上`;
    const d = parseAbnerBlogPublishDraft(text);
    expect(d?.title).toBe('T3');
    const stripped = stripAbnerBlogPublishBlock(text);
    expect(stripped).not.toContain('"title"');
    expect(stripped).toContain('请看');
    expect(stripped).toContain('以上');
  });
});
