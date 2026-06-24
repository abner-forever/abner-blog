import type { BlockProperties } from "grapesjs";

/**
 * Studio SDK 组件块配置
 * 与官方 SDK 的 blocks.default 格式兼容
 */
export const blocks: BlockProperties[] = [
  // ==================== 内容组件 ====================
  {
    id: "heading",
    label: "标题",
    content: '<h1 data-schema-type="text" style="margin:10px 0;">标题文本</h1>',
    category: { id: "content", label: "内容组件", open: true },
  },
  {
    id: "text",
    label: "文本",
    content: '<p data-schema-type="text" style="margin:10px 0;">段落文本内容</p>',
    category: "内容组件",
  },
  {
    id: "image",
    label: "图片",
    content:
      '<img data-schema-type="image" src="https://placehold.co/600x400" alt="图片描述" loading="lazy" style="max-width:100%;height:auto;display:block;" />',
    category: "内容组件",
  },
  {
    id: "button",
    label: "按钮",
    content:
      '<a data-schema-type="button" href="#" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;background:#2f81f7;color:#fff;border-radius:4px;text-decoration:none;font-size:14px;cursor:pointer;"><span>●</span><span>按钮</span></a>',
    category: "内容组件",
  },
  {
    id: "divider",
    label: "分割线",
    content:
      '<hr data-schema-type="divider" style="border:none;border-top:1px solid #e8e8e8;margin:20px 0;" />',
    category: "内容组件",
  },
  {
    id: "spacer",
    label: "间距",
    content: '<div data-schema-type="spacer" style="height:40px;"></div>',
    category: "内容组件",
  },
  {
    id: "video",
    label: "视频",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="video" style="padding:56.25% 0 0 0;position:relative;border-radius:8px;overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy" title="视频播放器"></iframe></div>',
    category: "内容组件",
  },
  {
    id: "video-bilibili",
    label: "B站视频",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="bilibili-video" style="padding:56.25% 0 0 0;position:relative;border-radius:8px;overflow:hidden;background:#000;"><iframe src="//player.bilibili.com/player.html?bvid=BV1GJ411x7cQ&page=1" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy" title="B站视频"></iframe></div>',
    category: "内容组件",
  },
  {
    id: "video-tencent",
    label: "腾讯视频",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="8 5 19 12 8 19 8 5" fill="currentColor"/><rect x="4" y="5" width="3" height="14" rx="1" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="tencent-video" style="padding:56.25% 0 0 0;position:relative;border-radius:8px;overflow:hidden;background:#000;"><iframe src="https://v.qq.com/txp/iframe/player.html?vid=xxxxx" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy" title="腾讯视频"></iframe></div>',
    category: "内容组件",
  },
  {
    id: "card",
    label: "卡片",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<div data-schema-type="card" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.06);"><img src="https://placehold.co/400x200" alt="卡片图片" style="width:100%;display:block;"/><div style="padding:16px;"><h3 style="margin:0 0 8px;font-size:18px;">卡片标题</h3><p style="margin:0;color:#666;line-height:1.6;">卡片描述内容</p></div></div>',
    category: "内容组件",
  },
  {
    id: "accordion",
    label: "手风琴",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
    content:
      '<div data-schema-type="accordion" style="border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><details style="border-bottom:1px solid #e8e8e8;"><summary style="padding:12px 16px;cursor:pointer;background:#fafafa;font-weight:500;list-style:none;">标题一</summary><div style="padding:12px 16px;background:#fff;">内容一</div></details><details><summary style="padding:12px 16px;cursor:pointer;background:#fafafa;font-weight:500;list-style:none;">标题二</summary><div style="padding:12px 16px;background:#fff;">内容二</div></details></div>',
    category: "内容组件",
  },
  {
    id: "tabs",
    label: "标签页",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="6" width="18" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<div data-schema-type="tabs" data-tabs style="border:1px solid #d9d9d9;border-radius:6px;overflow:hidden;"><div style="display:flex;gap:0;background:#fafafa;border-bottom:1px solid #d9d9d9;"><button data-tab="1" style="flex:1;padding:10px 16px;border:none;background:#fff;cursor:pointer;font-weight:500;border-bottom:2px solid #2f81f7;">标签1</button><button data-tab="2" style="flex:1;padding:10px 16px;border:none;background:transparent;cursor:pointer;color:#666;">标签2</button></div><div data-tab-content="1" style="padding:16px;">标签页一内容</div><div data-tab-content="2" style="padding:16px;display:none;">标签页二内容</div></div>',
    category: "内容组件",
  },
  {
    id: "carousel",
    label: "轮播图",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="carousel" data-carousel style="position:relative;overflow:hidden;border-radius:8px;"><div data-carousel-inner style="display:flex;transition:transform 0.3s ease;transform:translateX(0);"><img src="https://placehold.co/800x400/1890ff/fff?text=Slide+1" style="min-width:100%;display:block;" alt="轮播1"/><img src="https://placehold.co/800x400/52c41a/fff?text=Slide+2" style="min-width:100%;display:block;" alt="轮播2"/><img src="https://placehold.co/800x400/faad14/fff?text=Slide+3" style="min-width:100%;display:block;" alt="轮播3"/></div><div data-carousel-dots style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;"><span data-dot="0" style="width:10px;height:10px;border-radius:50%;background:#fff;cursor:pointer;opacity:0.5;"></span><span data-dot="1" style="width:10px;height:10px;border-radius:50%;background:#fff;cursor:pointer;opacity:0.5;"></span><span data-dot="2" style="width:10px;height:10px;border-radius:50%;background:#fff;cursor:pointer;opacity:1;"></span></div></div>',
    category: "内容组件",
  },
  {
    id: "map",
    label: "地图",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9" r="2" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="map" style="width:100%;height:300px;border-radius:8px;overflow:hidden;"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3059.5!2d116.4!3d39.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU0JzI0LjAiTiAxMTbCsDI0JzAwLjAiRQ!5e0!3m2!1szh-CN!2scn!4v1" style="width:100%;height:100%;border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>',
    category: "内容组件",
  },

  // ==================== 布局组件 ====================
  {
    id: "container",
    label: "容器",
    content: '<div data-schema-type="container" style="padding:20px;min-height:60px;"></div>',
    category: { id: "layout", label: "布局组件", open: true },
  },
  {
    id: "row",
    label: "行",
    content:
      '<div data-schema-type="row" style="display:flex;flex-wrap:wrap;min-height:40px;"></div>',
    category: "布局组件",
  },
  {
    id: "column",
    label: "列",
    content:
      '<div data-schema-type="column" style="flex:1;min-width:200px;padding:10px;min-height:40px;border:1px dashed #d9d9d9;"></div>',
    category: "布局组件",
  },
  {
    id: "section",
    label: "区块",
    content:
      '<section data-schema-type="section" style="padding:40px 20px;min-height:100px;"></section>',
    category: "布局组件",
  },

  // ==================== 表单组件 ====================
  {
    id: "form-container",
    label: "表单容器",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="8" x2="17" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="16" x2="12" y2="16" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<form data-schema-type="form" data-page-form="true" style="padding:24px;border:2px dashed #2f81f7;border-radius:8px;background:#fafafa;"><div style="margin-bottom:16px;font-size:14px;color:#888;">📋 将表单字段拖入此区域</div><div style="display:flex;flex-direction:column;gap:12px;"><button type="submit" style="align-self:flex-start;padding:10px 24px;background:#2f81f7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">提交</button></div></form>',
    category: { id: "form", label: "表单组件", open: true },
  },
  {
    id: "form-input",
    label: "输入框",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="8" width="18" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="6" y="15" font-size="6" fill="currentColor">ab</text></svg>',
    content:
      '<div data-schema-type="form-input" class="form-field" style="margin-bottom:4px;"><label style="display:block;margin-bottom:4px;font-size:14px;font-weight:500;color:#333;">姓名</label><input type="text" name="name" placeholder="请输入" style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:14px;box-sizing:border-box;"/></div>',
    category: "表单组件",
  },
  {
    id: "form-textarea",
    label: "多行文本",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="0.5"/><line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="0.5"/></svg>',
    content:
      '<div data-schema-type="form-textarea" class="form-field" style="margin-bottom:4px;"><label style="display:block;margin-bottom:4px;font-size:14px;font-weight:500;color:#333;">留言</label><textarea name="message" rows="4" placeholder="请输入" style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea></div>',
    category: "表单组件",
  },
  {
    id: "form-select",
    label: "下拉选择",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="8" width="18" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="16,11 12,15 8,11" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<div data-schema-type="form-select" class="form-field" style="margin-bottom:4px;"><label style="display:block;margin-bottom:4px;font-size:14px;font-weight:500;color:#333;">选择</label><select name="option" style="width:100%;padding:8px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:14px;box-sizing:border-box;background:#fff;"><option value="">请选择</option><option value="1">选项一</option><option value="2">选项二</option><option value="3">选项三</option></select></div>',
    category: "表单组件",
  },
  {
    id: "form-checkbox",
    label: "复选框",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="8,12 11,15 16,9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<div data-schema-type="form-checkbox" class="form-field" style="margin-bottom:4px;"><label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;"><input type="checkbox" name="agree" value="1" style="width:16px;height:16px;cursor:pointer;"/> 同意条款</label></div>',
    category: "表单组件",
  },
  {
    id: "form-submit",
    label: "提交按钮",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="9,12 11,14 15,10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<button data-schema-type="form-submit" type="submit" style="padding:10px 32px;background:#2f81f7;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500;">提交</button>',
    category: "表单组件",
  },

  // ==================== 导航组件 ====================
  {
    id: "nav-menu",
    label: "导航菜单",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<nav data-schema-type="nav-menu" style="position:sticky;top:0;background:#fff;padding:12px 24px;z-index:100;border-bottom:1px solid #e8e8e8;display:flex;gap:24px;flex-wrap:wrap;"><a href="#section1" style="color:#333;text-decoration:none;font-size:14px;padding:4px 0;border-bottom:2px solid transparent;transition:border-color 0.2s;">区块一</a><a href="#section2" style="color:#666;text-decoration:none;font-size:14px;padding:4px 0;">区块二</a><a href="#section3" style="color:#666;text-decoration:none;font-size:14px;padding:4px 0;">区块三</a></nav>',
    category: { id: "nav", label: "导航组件", open: true },
  },
  {
    id: "nav-link",
    label: "导航链接",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content:
      '<a data-schema-type="nav-link" href="#section" style="color:#333;text-decoration:none;font-size:14px;padding:4px 0;display:inline-block;">锚点链接</a>',
    category: "导航组件",
  },

  // ==================== 动态数据 ====================
  {
    id: "data-list",
    label: "数据列表",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1"/><line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="1"/><line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" stroke-width="1"/></svg>',
    content:
      '<div data-schema-type="data-list" data-datalist style="padding:20px;border:1px dashed #2f81f7;border-radius:8px;background:#f0f9ff;"><div style="font-size:14px;color:#2f81f7;margin-bottom:12px;font-weight:500;">📊 数据列表</div><div style="display:flex;flex-direction:column;gap:8px;"><div style="padding:12px;background:#fff;border-radius:6px;border:1px solid #e8e8e8;"><div style="font-weight:500;">标题</div><div style="font-size:13px;color:#666;margin-top:4px;">描述文本</div></div><div style="padding:12px;background:#fff;border-radius:6px;border:1px solid #e8e8e8;"><div style="font-weight:500;">标题</div><div style="font-size:13px;color:#666;margin-top:4px;">描述文本</div></div><div style="padding:12px;background:#fff;border-radius:6px;border:1px solid #e8e8e8;"><div style="font-weight:500;">标题</div><div style="font-size:13px;color:#666;margin-top:4px;">描述文本</div></div></div><div style="margin-top:12px;font-size:12px;color:#aaa;text-align:center;">此组件可作为数据展示模板</div></div>',
    category: { id: "data", label: "动态数据", open: true },
  },
  {
    id: "data-badge",
    label: "数据徽标",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">N</text></svg>',
    content:
      '<div data-schema-type="data-badge" style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:14px;"><span>关注者</span><span style="background:#2f81f7;color:#fff;border-radius:10px;padding:2px 8px;font-size:12px;font-weight:500;">1,234</span></div>',
    category: "动态数据",
  },

  // ==================== 高级 ====================
  {
    id: "html-embed",
    label: "自定义 HTML",
    content: '<div data-schema-type="html-embed" data-gjs-type="html-embed"></div>',
    category: { id: "advanced", label: "高级", open: true },
  },

  // ==================== 交互组件 ====================
  {
    id: "modal",
    label: "弹窗",
    media:
      '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="7" r="1" fill="currentColor"/></svg>',
    content:
      '<div data-schema-type="modal" data-modal-name="新弹窗" data-modal-title="弹窗标题" data-modal-width="520" data-modal-animation="fade" data-gjs-type="modal" style="width:520px;min-height:200px;background:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden;"><div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #f0f0f0;font-size:16px;font-weight:500;color:#333;"><span data-gjs-type="text" style="flex:1;">弹窗标题</span><span class="gjs-modal-close" style="cursor:pointer;font-size:18px;color:#999;padding:4px 8px;line-height:1;border-radius:4px;">✕</span></div><div data-schema-type="container" style="padding:24px;min-height:100px;"><p style="margin:0;color:#999;">弹窗内容区域</p></div><div style="display:flex;align-items:center;justify-content:flex-end;padding:12px 24px;border-top:1px solid #f0f0f0;gap:8px;font-size:12px;color:#ccc;">Footer 区域</div></div>',
    category: { id: "interactive", label: "交互组件", open: true },
  },
];
