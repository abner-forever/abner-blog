/**
 * System prompt for AI page generation.
 *
 * Guides the LLM to output a valid PageSchema JSON according to the
 * @abner-blog/page-schema SchemaNode format, with region-based structure.
 *
 * The prompt includes:
 * 1. Schema format specification
 * 2. Available component types with visual descriptions
 * 3. Predefined region types the AI can choose from
 * 4. Style guidelines (theme token usage + custom CSS)
 */

export const COMPONENT_METADATA = {
  container: {
    displayName: '容器',
    visualDescription: '自由布局容器，用于包裹和排列其他组件，支持 display:flex 布局',
    commonProps: ['style', 'className'],
    styleHints: '可设置 display:flex 实现弹性布局，或使用 block 流式布局。背景色、内边距、圆角常用。',
    typicalChildren: ['text', 'button', 'image', 'row', 'column', 'card'],
  },
  section: {
    displayName: '区块',
    visualDescription: '语义化区块容器，用于划分页面不同内容区域',
    commonProps: ['style', 'className'],
    styleHints: '通常有上下内边距（padding），用于分隔不同内容区域。可设置背景色。',
    typicalChildren: ['container', 'text', 'row', 'column', 'image'],
  },
  row: {
    displayName: '行',
    visualDescription: '水平排列容器，子组件在一行内并排显示，自动换行',
    commonProps: ['style'],
    styleHints: '默认 display:flex + flex-wrap:wrap，子组件水平排列。通过 justify-content 控制对齐。',
    typicalChildren: ['column', 'card', 'text', 'image'],
  },
  column: {
    displayName: '列',
    visualDescription: '垂直排列容器，子组件从上到下纵向排列',
    commonProps: ['style'],
    styleHints: 'flex 列容器，子组件在垂直方向排列。常用于 row 的子组件。',
    typicalChildren: ['text', 'image', 'button', 'card'],
  },
  text: {
    displayName: '文本',
    visualDescription: '渲染文字内容，支持 h1-h6 标题和 p/span 段落等多种 HTML 标签',
    commonProps: ['content', 'as', 'style'],
    styleHints: 'as 属性控制渲染标签：h1-h6 为标题（字号递减）、p 为段落、span 为内联文本。颜色和字号常用。',
    typicalChildren: [],
  },
  image: {
    displayName: '图片',
    visualDescription: '展示图片，支持懒加载和 object-fit 控制图片适应方式',
    commonProps: ['src', 'alt', 'lazy', 'objectFit', 'style'],
    styleHints: 'objectFit 可选 cover(裁剪填充)/contain(完整显示)/fill(拉伸)。展示产品图、头像、插图等。',
    typicalChildren: [],
  },
  button: {
    displayName: '按钮',
    visualDescription: '可点击的操作按钮，支持 primary/default/text/link 四种风格',
    commonProps: ['text', 'variant', 'style'],
    styleHints: 'variant 控制风格：primary 主色填充、default 白色边框、text 纯文字、link 链接样式。圆角、宽高可自定义。',
    typicalChildren: [],
  },
  divider: {
    displayName: '分割线',
    visualDescription: '水平分割线，用于分隔不同内容区块，支持实线/虚线/点线',
    commonProps: ['color', 'height', 'style'],
    styleHints: 'style 可选 solid(实线)/dashed(虚线)/dotted(点线)。颜色默认 #e8e8e8。',
    typicalChildren: [],
  },
  spacer: {
    displayName: '间距',
    visualDescription: '空白占位，用于在组件之间添加垂直间距',
    commonProps: ['height'],
    styleHints: '高度可自定义，默认 40px。纯粹的空白间隔组件，不渲染任何内容。',
    typicalChildren: [],
  },
  video: {
    displayName: '视频',
    visualDescription: 'HTML5 视频播放器，支持 mp4 等格式，带播放控件',
    commonProps: ['src', 'poster', 'controls', 'autoplay'],
    styleHints: 'controls 默认 true。autoplay 需 muted 配合。展示宣传视频或教程。',
    typicalChildren: [],
  },
  'bilibili-video': {
    displayName: 'B站视频',
    visualDescription: '嵌入 Bilibili 视频播放器，通过 BV 号或 AV 号引用',
    commonProps: ['bvid', 'aid', 'page'],
    styleHints: '嵌入 iframe 播放器，需提供 bvid。展示 B 站视频内容。',
    typicalChildren: [],
  },
  'tencent-video': {
    displayName: '腾讯视频',
    visualDescription: '嵌入腾讯视频播放器，通过 vid 引用',
    commonProps: ['vid'],
    styleHints: '嵌入 iframe 播放器，需提供 vid。展示腾讯视频内容。',
    typicalChildren: [],
  },
  card: {
    displayName: '卡片',
    visualDescription: '图文卡片组件，展示图片、标题、描述和链接，带阴影和圆角',
    commonProps: ['imageSrc', 'title', 'description', 'href', 'style'],
    styleHints: '白色背景 + 圆角 + 阴影，典型的展示型卡片。可点击跳转。常用于特性介绍、文章卡片。',
    typicalChildren: [],
  },
  accordion: {
    displayName: '手风琴',
    visualDescription: '可折叠的内容面板，点击标题展开/收起内容',
    commonProps: ['items', 'style'],
    styleHints: 'items 数组定义面板列表，每条有 title。默认全部收起。FAQ、产品详情常见。',
    typicalChildren: [],
  },
  tabs: {
    displayName: '标签页',
    visualDescription: '标签切换组件，点击不同标签切换显示对应内容',
    commonProps: ['tabLabels', 'activeIndex', 'style'],
    styleHints: 'tabLabels 定义标签文字列表。activeIndex 控制默认激活标签。适合分类展示内容。',
    typicalChildren: ['container', 'text', 'image'],
  },
  carousel: {
    displayName: '轮播图',
    visualDescription: '图片轮播组件，自动循环播放多张图片，带指示器和切换按钮',
    commonProps: ['slides', 'interval', 'autoplay', 'indicators', 'style'],
    styleHints: 'slides 为图片 URL 数组。autoplay 默认开启，interval 控制切换间隔。首屏 Banner 常用。',
    typicalChildren: [],
  },
  map: {
    displayName: '地图',
    visualDescription: '嵌入地图（如高德/百度地图 iframe），展示位置信息',
    commonProps: ['src', 'width', 'height', 'style'],
    styleHints: '通过 iframe src 嵌入地图。width 默认 100%，height 默认 300px。联系页地址展示常用。',
    typicalChildren: [],
  },
  'nav-menu': {
    displayName: '导航菜单',
    visualDescription: '顶部导航栏，支持固定定位和菜单项链接，常用于页面头部',
    commonProps: ['sticky', 'items', 'style'],
    styleHints: 'sticky 控制是否固定顶部。items 定义导航链接列表。背景色和文字颜色需协调。',
    typicalChildren: ['nav-link'],
  },
  'nav-link': {
    displayName: '导航链接',
    visualDescription: '文本链接，用于导航菜单中的单个链接项',
    commonProps: ['text', 'href', 'target', 'style'],
    styleHints: 'href 为链接地址，target 控制打开方式。文字颜色、悬浮效果可自定义。',
    typicalChildren: [],
  },
  'html-embed': {
    displayName: '自定义 HTML',
    visualDescription: '嵌入自定义 HTML 代码，支持任意 HTML 内容',
    commonProps: ['html', 'style'],
    styleHints: 'html 属性直接渲染到页面。适合嵌入第三方代码（统计、客服、插件）。',
    typicalChildren: [],
  },
  modal: {
    displayName: '弹窗',
    visualDescription: '模态弹窗，运行时点击触发按钮弹出。支持配置标题、宽度、动画、关闭方式',
    commonProps: ['name', 'title', 'width', 'closable', 'animation', 'style'],
    styleHints: 'name 为编辑区标识，title 为弹窗标题。width 默认 520。animation 可选 fade/zoom/slide。弹窗内部可放任意内容。',
    typicalChildren: ['text', 'button', 'image', 'form'],
  },
  form: {
    displayName: '表单',
    visualDescription: '表单容器，用于收集用户输入数据，支持提交到 API',
    commonProps: ['api', 'method', 'submitLabel', 'style'],
    styleHints: 'api 为提交端点。内部可放置 form-input、form-textarea、form-select、form-checkbox、form-submit 等表单组件。',
    typicalChildren: ['form-input', 'form-textarea', 'form-select', 'form-checkbox', 'form-submit'],
  },
  'form-input': {
    displayName: '输入框',
    visualDescription: '单行文本输入框，支持 text/email/tel/number/password 等类型',
    commonProps: ['label', 'name', 'placeholder', 'required', 'type', 'style'],
    styleHints: 'label 显示在输入框上方，placeholder 为占位提示，type 控制输入类型。name 对应提交字段名。',
    typicalChildren: [],
  },
  'form-textarea': {
    displayName: '多行文本',
    visualDescription: '多行文本输入区域，适合收集长文本内容',
    commonProps: ['label', 'name', 'placeholder', 'required', 'rows', 'style'],
    styleHints: 'rows 控制显示行数，默认 4 行。placeholder 为占位提示。适合留言、备注等长文本。',
    typicalChildren: [],
  },
  'form-select': {
    displayName: '下拉选择',
    visualDescription: '下拉选择器，用户从预定义选项中选择一项',
    commonProps: ['label', 'name', 'options', 'required', 'style'],
    styleHints: 'options 为 {label, value} 数组，定义可选值。适合单选场景如分类选择。',
    typicalChildren: [],
  },
  'form-checkbox': {
    displayName: '复选框',
    visualDescription: '复选框，用于同意条款或多选场景',
    commonProps: ['label', 'name', 'required', 'style'],
    styleHints: 'label 显示在复选框右侧。通常用于同意协议、记住登录等场景。',
    typicalChildren: [],
  },
  'form-submit': {
    displayName: '提交按钮',
    visualDescription: '表单提交按钮，点击触发表单验证和提交',
    commonProps: ['text', 'style'],
    styleHints: 'text 自定义按钮文字，默认"提交"。放置于表单内部，自动触发表单提交行为。',
    typicalChildren: [],
  },
  'data-list': {
    displayName: '数据列表',
    visualDescription: '数据驱动的列表展示，支持静态数据或 API 数据源',
    commonProps: ['items', 'api', 'pageSize', 'fieldMapping', 'style'],
    styleHints: 'items 为静态数据数组，api 为数据端点 URL。展示动态数据列表时使用。',
    typicalChildren: [],
  },
  'data-badge': {
    displayName: '数据徽标',
    visualDescription: '数字徽标组件，显示计数或状态，支持 API 拉取数据',
    commonProps: ['count', 'api', 'text', 'maxCount', 'style'],
    styleHints: 'count 为静态数字，api 为数据端点。text 为附加文字。maxCount 控制最大显示值（默认 999）。',
    typicalChildren: [],
  },
};

export const REGION_DEFINITIONS = [
  {
    regionType: 'header',
    name: '顶部导航',
    description: '页面顶部导航栏，包含品牌 Logo 和导航链接',
    recommendedComponents: ['nav-menu', 'nav-link', 'container', 'image(Logo)'],
  },
  {
    regionType: 'hero',
    name: '主视觉',
    description: '页面首屏大图/Banner 区域，吸引用户注意力的核心区域',
    recommendedComponents: ['container', 'text(h1)', 'text(p)', 'button', 'image'],
  },
  {
    regionType: 'features',
    name: '特性展示',
    description: '产品/服务特性列表，以网格或列表形式展示多个特性点',
    recommendedComponents: ['row', 'column', 'card', 'text', 'image'],
  },
  {
    regionType: 'carousel',
    name: '轮播展示',
    description: '图片/内容轮播区域，自动切换展示多张图片',
    recommendedComponents: ['carousel', 'container'],
  },
  {
    regionType: 'content',
    name: '内容区',
    description: '通用内容展示区域，展示文章、介绍等自由内容',
    recommendedComponents: ['container', 'text', 'image', 'divider', 'spacer'],
  },
  {
    regionType: 'cta',
    name: '行动号召',
    description: '引导用户操作的区域，通常包含醒目的按钮',
    recommendedComponents: ['container', 'text', 'button'],
  },
  {
    regionType: 'testimonials',
    name: '客户评价',
    description: '客户评价/案例展示，以卡片或轮播形式展示用户反馈',
    recommendedComponents: ['card', 'row', 'column', 'carousel'],
  },
  {
    regionType: 'pricing',
    name: '价格表',
    description: '产品定价方案展示，并排展示多个价格档次',
    recommendedComponents: ['card', 'row', 'column', 'button', 'text'],
  },
  {
    regionType: 'gallery',
    name: '图库展示',
    description: '图片/作品展示，网格布局排列多张图片',
    recommendedComponents: ['image', 'row', 'column', 'container'],
  },
  {
    regionType: 'form',
    name: '表单',
    description: '联系/注册表单区域，收集用户提交的信息',
    recommendedComponents: ['form', 'form-input', 'form-textarea', 'form-select', 'form-checkbox', 'form-submit'],
  },
  {
    regionType: 'footer',
    name: '底部',
    description: '页面底部信息区域，包含版权信息、友情链接等',
    recommendedComponents: ['container', 'text', 'nav-link', 'divider'],
  },
];

export const STYLE_THEMES = [
  {
    id: 'modern',
    name: '现代简约',
    description: '简洁清晰的设计风格，大量留白，突出内容',
    colorPrimary: '#1677ff',
    typography: '无衬线字体，标题粗体',
  },
  {
    id: 'professional',
    name: '商务专业',
    description: '沉稳专业的商务风格，蓝色为主色调',
    colorPrimary: '#1a365d',
    typography: '衬线/无衬线结合，正式排版',
  },
  {
    id: 'creative',
    name: '创意活力',
    description: '色彩丰富、有活力的创意风格，适合年轻品牌',
    colorPrimary: '#722ed1',
    typography: '大胆的字重和大小对比',
  },
  {
    id: 'minimal',
    name: '极简主义',
    description: '极简风格，黑白灰为主，强调功能和内容',
    colorPrimary: '#262626',
    typography: '纤细字体，极简排版',
  },
  {
    id: 'nature',
    name: '自然清新',
    description: '自然、环保风格，绿色调为主',
    colorPrimary: '#52c41a',
    typography: '圆润柔和，轻松自然',
  },
];

export function buildSystemPrompt(componentMeta: string): string {
  return `你是一个专业的低代码页面生成 AI。你的任务是根据用户描述，生成符合 PageSchema 规范的 JSON 页面结构。

## 输出格式

你必须输出一个 JSON 对象，包含以下结构：

\`\`\`json
{
  "regions": [
    {
      "regionId": "唯一区域ID",
      "regionType": "区域类型",
      "name": "区域名称",
      "schema": { ... SchemaNode 子树 }
    }
  ],
  "globalCss": "全局 CSS 字符串（可选）",
  "pageTitle": "页面标题"
}
\`\`\`

## SchemaNode 格式

每个 SchemaNode 必须包含：
- "id": 唯一标识符（使用 generateId_序号 格式）
- "type": 组件类型（见下方组件列表）
- "props": 组件属性对象
- "children": 子节点数组（可选，容器组件使用）

## 可用的组件类型

${componentMeta}

## 预定义页面区域

你可以从以下区域类型中选择合适的组合来构建页面：

${REGION_DEFINITIONS.map(
    (r) => `- ${r.regionType}（${r.name}）：${r.description}。推荐组件：${r.recommendedComponents.join('、')}`
  ).join('\n')}

## 可用风格主题

${STYLE_THEMES.map(
    (t) => `- ${t.id}（${t.name}）：${t.description}。主色：${t.colorPrimary}`
  ).join('\n')}

## 样式规范

1. 优先使用主题色 Token：colorPrimary 作为主色调
2. 通用样式（间距、圆角、阴影）使用合理的默认值
3. 特殊效果（如毛玻璃、渐变色）通过 props.style 内联样式实现
4. 配色协调，遵循选定的风格主题
5. 确保响应式布局（flex-wrap、百分比宽度）

## 约束

1. 只能在预定义区域类型中选择
2. 每个区域生成独立的 SchemaNode 子树
3. 区域顺序按页面阅读顺序排列
4. 组件 props 必须符合组件接口定义
5. 典型子组件关系需合理（form 内放表单控件，row 内放 column 等）
6. 请用中文回答，但 JSON 字段名保持英文

${'```'}
输出纯 JSON，不要包含其他说明文字。`;
}
