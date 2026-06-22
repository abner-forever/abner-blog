/**
 * GrapesJS Studio SDK 简体中文语言包
 * 基于 grapesjs/locale/zh 并补充 Studio SDK 专属翻译
 */
import zhCNCore from "grapesjs/locale/zh";

const zhCN: Record<string, unknown> = {
  /** ========== GrapesJS 核心中文翻译 ========== */
  ...zhCNCore,

  /** ========== 修复 GrapesJS 中文包里未翻译的值 ========== */

  domComponents: {
    ...(zhCNCore?.domComponents || {}),
    names: {
      ...(zhCNCore?.domComponents?.names || {}),
      wrapper: "页面主体",
      section: "区块",
      gridRow: "行",
      gridColumn: "列",
      heading: "标题",
      divider: "分割线",
      imageBox: "图片框",
      linkBox: "链接框",
    },
  },

  selectorManager: {
    ...(zhCNCore?.selectorManager || {}),
    label: "选择器",
    selected: "已选择",
    emptyState: "- 状态 -",
    states: {
      hover: "悬停",
      active: "点击",
      "nth-of-type(2n)": "偶数/奇数",
    },
    noSelecton: "您没有选择任何元素。",
    selectFromCanvas: "从画布中选择一个元素。",
    selectFromList: "从样式目录中选择任何样式。",
    selectCustom: "添加您的自定义样式选择器。",
    selection: "选择",
    selector: "选择器",
    addNewSelector: "添加新选择器",
    removeSelector: "移除选择器",
    target: "目标",
    device: "设备",
    state: "状态",
    deleteStyle: "删除样式",
    showCSS: "显示 CSS 代码",
    searchStyle: "搜索样式",
    applyOnSelector: "在选择器上应用样式更改",
    noSelectors: "未应用选择器",
    applyOnComponents: "在组件上应用样式更改",
    noComponents: "未选择组件",
    currentSelection: "显示样式的当前选择",
  },

  deviceManager: {
    ...(zhCNCore?.deviceManager || {}),
    devices: {
      ...(zhCNCore?.deviceManager?.devices || {}),
      desktop: "桌面端",
      tablet: "平板",
      mobile: "手机竖屏",
      mobileLandscape: "移动端横屏",
      mobilePortrait: "移动端竖屏",
    },
    allDevices: "所有设备",
  },

  /** ========== Studio SDK 右侧面板标签 ========== */

  styleManager: {
    ...(zhCNCore?.styleManager || {}),
    panelLabel: "样式",
    empty: "选择一个元素以编辑样式",
    notFound: "没有可用样式",
    /** ===== 样式分类（Sector）标签 ===== */
    sectors: {
      /** Studio SDK 默认 sectors */
      "gs-layout": "布局",
      "gs-size": "尺寸",
      "gs-space": "间距",
      "gs-position": "定位",
      "gs-typography": "排版",
      "gs-background": "背景",
      "gs-borders": "边框",
      "gs-effects": "效果",
      /** GrapesJS 核心兼容 sectors */
      general: "通用",
      layout: "布局",
      dimension: "尺寸",
      typography: "排版",
      background: "背景",
      border: "边框",
      effects: "效果",
      extra: "其他",
      flex: "弹性布局",
      grid: "栅格布局",
      position: "定位",
      spacing: "间距",
      transform: "变换",
      animation: "动画",
      decoration: "装饰",
      table: "表格",
      list: "列表",
      svg: "SVG",
    },
    layout: {
      flexChild: "Flex 子项",
      display: {
        tips: {
          block: "块级元素在正常流中前后都产生换行",
          inline: "内联元素不产生换行，通常文本默认使用内联",
          "inline-block": "内联块类似于内联，但可设置宽高属性",
          flex: "Flex 表现为块级元素，在垂直/水平轴上排列子元素",
          none: "元素从布局中隐藏",
        },
      },
      direction: {
        title: {
          row: "水平",
          "row-reverse": "水平反向",
          column: "垂直",
          "column-reverse": "垂直反向",
        },
      },
      justify: {
        title: {
          start: "起点对齐",
          center: "居中对齐",
          end: "终点对齐",
          spaceBetween: "两端对齐",
          spaceAround: "环绕对齐",
          spaceEvenly: "均匀分布",
        },
      },
      align: {
        title: {
          stretch: "拉伸",
          start: "起点对齐",
          center: "居中对齐",
          end: "终点对齐",
        },
      },
      alignContent: {
        title: {
          start: "起点对齐",
          center: "居中对齐",
          end: "终点对齐",
          spaceBetween: "两端对齐",
          spaceAround: "环绕对齐",
          stretch: "拉伸",
        },
      },
      alignSelf: {
        title: {
          auto: "自动",
          start: "起点对齐",
          center: "居中对齐",
          end: "终点对齐",
          stretch: "拉伸",
        },
      },
      flex: {
        title: {
          auto: "自动",
          fillContainer: "填充容器",
          hugContents: "适应内容",
        },
      },
    },
    effects: {
      boxShadow: {
        xOffset: "X 偏移",
        yOffset: "Y 偏移",
        blur: "模糊",
        spread: "扩散",
        color: "颜色",
      },
      textShadow: {
        xOffset: "X 偏移",
        yOffset: "Y 偏移",
        blur: "模糊",
        color: "颜色",
      },
      filter: {
        type: "类型",
        value: "数值",
      },
      backdropFilter: {
        type: "类型",
        value: "数值",
      },
      transition: {
        type: "类型",
        easing: "缓动",
        duration: "持续",
        delay: "延迟",
      },
      transform: {
        type: "类型",
        value: "数值",
      },
      childrenTransform: "子元素变换",
    },
    background: {
      sizeMode: {
        custom: "自定义",
        preset: "预设",
      },
    },
    position: {
      tips: {
        static: "默认定位",
        relative: "类似于 Static，但可相对于自身移动",
        absolute: "绝对定位，相对于最近的非 static 父元素",
        fixed: "固定定位（页面滚动时也不移动），相对于浏览器视口",
        sticky: "粘性定位，在页面滚动到指定距离前保持原位",
      },
      presets: {
        title: "预设",
        options: {
          topLeft: "左上",
          topRight: "右上",
          bottomLeft: "左下",
          bottomRight: "右下",
          left: "左",
          right: "右",
          bottom: "下",
          top: "上",
          full: "全屏",
        },
      },
    },
    properties: {
      /** ===== 尺寸 ===== */
      width: "宽度",
      height: "高度",
      "min-width": "最小宽度",
      "min-height": "最小高度",
      "max-width": "最大宽度",
      "max-height": "最大高度",
      /** ===== 间距 ===== */
      margin: "外边距",
      "margin-top": "上",
      "margin-right": "右",
      "margin-bottom": "下",
      "margin-left": "左",
      padding: "内边距",
      "padding-top": "上",
      "padding-right": "右",
      "padding-bottom": "下",
      "padding-left": "左",
      /** ===== 边框 ===== */
      border: "边框",
      "border-width": "边框宽度",
      "border-style": "边框样式",
      "border-color": "边框颜色",
      "border-radius": "圆角",
      "border-top-left-radius": "左上",
      "border-top-right-radius": "右上",
      "border-bottom-right-radius": "右下",
      "border-bottom-left-radius": "左下",
      "border-top-width": "上",
      "border-right-width": "右",
      "border-bottom-width": "下",
      "border-left-width": "左",
      "border-top-style": "上",
      "border-right-style": "右",
      "border-bottom-style": "下",
      "border-left-style": "左",
      "border-top-color": "上",
      "border-right-color": "右",
      "border-bottom-color": "下",
      "border-left-color": "左",
      "border-collapse": "边框合并",
      outline: "轮廓",
      "outline-width": "轮廓宽度",
      "outline-style": "轮廓样式",
      "outline-color": "轮廓颜色",
      "outline-offset": "轮廓偏移",
      /** ===== 背景 ===== */
      "background-color": "背景色",
      "background-image": "背景图",
      "background": "背景",
      "background-position": "位置",
      "background-position-x": "左",
      "background-position-y": "上",
      "background-size": "尺寸",
      "background-size-options": "尺寸",
      "background-size-x": "左",
      "background-size-y": "上",
      "background-repeat": "重复",
      "background-attachment": "附件",
      "background-origin": "原点",
      "background-clip": "裁切",
      /** ===== 排版 ===== */
      color: "文字颜色",
      "line-height": "行高",
      "font-family": "字体",
      "font-size": "字号",
      "font-weight": "字重",
      "font-style": "字体样式",
      "font-variant": "字体变体",
      "letter-spacing": "字间距",
      "word-spacing": "词间距",
      "text-align": "水平对齐",
      "vertical-align": "垂直对齐",
      "text-decoration": "修饰",
      "text-transform": "转换",
      "text-shadow": "文字阴影",
      "text-overflow": "文字溢出",
      "text-indent": "首行缩进",
      "white-space": "空白处理",
      "word-break": "断词方式",
      "word-wrap": "换行规则",
      "overflow-wrap": "溢出换行",
      /** ===== ===== */
      display: "显示模式",
      position: "定位方式",
      top: "上",
      right: "右",
      bottom: "下",
      left: "左",
      float: "浮动",
      clear: "清除浮动",
      "z-index": "层级",
      opacity: "不透明度",
      visibility: "可见性",
      cursor: "鼠标指针",
      "pointer-events": "指针事件",
      "box-sizing": "盒模型",
      resize: "调整大小",
      "object-fit": "对象适应",
      "object-position": "对象位置",
      "clip-path": "裁剪路径",
      isolation: "隔离",
      "mix-blend-mode": "混合模式",
      /** ===== Flex 弹性布局 ===== */
      flex: "弹性",
      "flex-grow": "放大比例",
      "flex-shrink": "缩小比例",
      "flex-basis": "基准值",
      "flex-direction": "排列方向",
      "flex-wrap": "换行方式",
      order: "排序",
      "align-items": "对齐",
      "align-content": "多行对齐",
      "align-self": "自身对齐",
      "justify-content": "主轴对齐",
      "justify-items": "项目对齐",
      "justify-self": "自身对齐",
      "place-items": "项目对齐",
      "place-content": "内容对齐",
      "place-self": "自身对齐",
      gap: "间距",
      "row-gap": "行间距",
      "column-gap": "列间距",
      /** ===== Grid 栅格布局 ===== */
      "grid-template-columns": "列定义",
      "grid-template-rows": "行定义",
      "grid-template-areas": "区域定义",
      "grid-column": "列位置",
      "grid-row": "行位置",
      "grid-area": "区域",
      "grid-auto-flow": "自动排列",
      "grid-auto-columns": "自动列宽",
      "grid-auto-rows": "自动行高",
      "grid-column-gap": "列间距",
      "grid-row-gap": "行间距",
      /** ===== 变换 ===== */
      transform: "变换",
      "transform-origin": "变换原点",
      "transform-style": "变换类型",
      perspective: "透视距离",
      "perspective-origin": "透视原点",
      "perspective-origin-x": "左",
      "perspective-origin-y": "上",
      "transform-origin-x": "左",
      "transform-origin-y": "上",
      "backface-visibility": "背面可见",
      /** ===== 动画 ===== */
      animation: "动画",
      "animation-name": "动画名称",
      "animation-duration": "动画时长",
      "animation-timing-function": "缓动函数",
      "animation-delay": "动画延迟",
      "animation-iteration-count": "播放次数",
      "animation-direction": "动画方向",
      "animation-fill-mode": "填充模式",
      "animation-play-state": "播放状态",
      /** ===== 过渡 ===== */
      transition: "过渡",
      "transition-property": "过渡属性",
      "transition-duration": "过渡时长",
      "transition-timing-function": "缓动函数",
      "transition-delay": "过渡延迟",
      /** ===== 溢出 ===== */
      overflow: "溢出",
      "overflow-x": "水平溢出",
      "overflow-y": "垂直溢出",
      /** ===== 多列 ===== */
      columns: "多列",
      "column-count": "列数",
      "column-width": "列宽",
      "column-rule": "列分割线",
      "column-rule-width": "分割线宽度",
      "column-rule-style": "分割线样式",
      "column-rule-color": "分割线颜色",
      "column-span": "跨列",
      "column-fill": "填充方式",
      /** ===== 表格 ===== */
      "table-layout": "表格布局",
      "caption-side": "标题位置",
      "empty-cells": "空单元格",
      /** ===== 列表 ===== */
      "list-style": "列表样式",
      "list-style-type": "列表符号",
      "list-style-image": "列表图片",
      "list-style-position": "列表位置",
      /** ===== 其他 ===== */
      direction: "方向",
      "writing-mode": "书写模式",
      "unicode-bidi": "双向文本",
      "user-select": "用户选择",
      "scroll-behavior": "滚动行为",
      "will-change": "将要改变",
      "filter": "滤镜",
    },
    options: {
      "__background-type": {
        image: "图片",
        gradient: "渐变",
        color: "颜色",
      },
      display: {
        block: "块级",
        inline: "内联",
        "inline-block": "内联块",
        flex: "弹性",
        none: "无",
      },
      overflow: {
        visible: "可见",
        hidden: "隐藏",
        scroll: "滚动",
        auto: "自动",
      },
      "flex-wrap": {
        nowrap: "不换行",
        wrap: "换行",
        "wrap-reverse": "反向换行",
      },
    },
  },

  traitManager: {
    ...(zhCNCore?.traitManager || {}),
    panelLabel: "属性",
    notFound: "没有可用属性",
    traits: {
      labels: {
        loading: "延迟加载",
        target: "在新标签页中打开",
        showList: "显示元素列表",
        customAttributes: "自定义属性",
      },
    },
  },

  /** ========== Studio SDK 左侧面板 ========== */

  pages: "页面",
  layerManager: {
    layers: "图层",
  },

  pageManager: {
    pages: "页面",
    page: "页面",
    newPage: "新建页面",
    add: "添加页面",
    rename: "重命名",
    duplicate: "复制",
    copy: "副本",
    delete: "删除",
    deletePage: "删除页面",
    confirmDelete: "确定要删除此页面？",
    homePage: "首页",
    settings: {
      label: "设置",
      title: "页面设置",
      global: "全局设置",
      fields: {
        name: { label: "名称" },
        slug: {
          label: "URL 标识",
          description: "页面的 URL 路径标识",
        },
        favicon: {
          label: "Favicon",
          description: "浏览器标签图标",
        },
        title: {
          label: "页面标题",
          description: "浏览器标签标题和搜索结果标题",
        },
        description: {
          label: "描述",
          description: "搜索摘要描述",
        },
        keywords: {
          label: "关键词",
          description: "页面关键词",
        },
        socialTitle: {
          label: "社交标题",
          description: "社交媒体分享标题",
        },
        socialImage: {
          label: "社交图片",
          description: "社交媒体分享图片 URL",
        },
        socialDescription: {
          label: "社交描述",
          description: "社交媒体分享描述",
        },
        customCodeHead: {
          label: "自定义 Head 代码",
          description: "插入到 </head> 之前",
        },
        customCodeBody: {
          label: "自定义 Body 代码",
          description: "插入到 </body> 之前",
        },
      },
    },
  },

  globalStyleManager: {
    notFound: "暂无全局样式",
    globalStyles: "全局样式",
    fields: {},
    categories: {},
  },

  templates: {
    notFound: "暂无可用模板",
  },

  /** ========== Studio SDK 通用操作 ========== */

  add: "添加",
  delete: "删除",
  duplicate: "复制",
  rename: "重命名",
  remove: "移除",
  clear: "清除",
  select: "选择",
  selectList: "从列表中选择",
  search: "搜索",
  update: "更新",
  updated: "已更新！",
  confirm: "确认",
  cancel: "取消",
  enable: "启用",
  disable: "禁用",
  upload: "上传",
  close: "关闭",
  load: "加载",
  copy: "复制",
  save: "保存",
  error: "错误",
  current: "当前",
  toggleCss: "切换 CSS",
  selectTarget: "目标组件",
  noCode: "无可用代码",
  noItems: "未找到项目",
  confirmAction: "确认执行此操作？",
  eyeDropper: "取色器",
  noEyeDropper: "不支持取色器",
  unauthorized: "未授权的项目",
  notItemsFound: "未找到项目",

  /** ========== 顶部工具栏按钮提示 ========== */

  actions: {
    componentOutline: { title: "组件轮廓" },
    preview: { title: "预览" },
    fullscreen: { title: "全屏" },
    showCode: {
      title: "代码",
      exportButton: "导出为 ZIP",
    },
    undo: { title: "撤销" },
    redo: { title: "重做" },
    save: { title: "保存项目" },
    store: { title: "保存内容" },
    open: { title: "打开项目" },
    editCode: {
      title: "编辑代码",
      noChanges: "没有变化需要更新",
      button: "更新",
    },
    importCode: {
      title: "导入代码",
      parseError: "解析错误",
      content: "在此粘贴您的 HTML/CSS 并点击导入",
      button: "导入",
    },
    clearCanvas: {
      title: "清空页面",
      content: "确定要清空页面吗？",
    },
    about: { title: "关于" },
    embed: { title: "嵌入 Studio" },
    newProject: { title: "加载项目" },
    installApp: {
      title: "安装应用",
      installed: "应用已安装",
    },
  },

  /** ========== 弹窗 ========== */

  modals: {
    styleCatalog: {
      title: "样式目录",
      noStyles: "未找到样式",
    },
    openProject: {
      title: "打开项目",
    },
  },

  /** ========== 插件管理器 ========== */

  pluginManager: {
    plugins: "插件",
    all: "可用",
    installed: "已安装",
    install: "安装",
    uninstall: "卸载",
    allPlugins: "所有插件",
    updateStudio: "请重新启动 Studio 以应用插件更新",
  },

  /** ========== 项目管理器 ========== */

  projectManager: {
    existentProjects: "我的项目",
    templates: "模板",
    notAvailable: "没有可用项目",
    projectType: "平台类型",
    projectName: "项目名称",
    pages: "页面",
  },

  /** ========== 存储管理器 ========== */

  storageManager: {
    errorLoad: "加载项目失败",
    errorStore: "保存项目失败",
  },

  /** ========== 资源管理器 ========== */

  assetManager: {
    addUrl: "添加 URL",
    projectAssets: "此项目中的资源",
    userAssets: "所有项目中的资源",
    errorLoad: "加载资源失败",
    errorUpload: "上传失败",
    errorDelete: "删除失败",
    deleteConfirmQuestion: "删除资源？",
    deleteConfirmExplanation:
      "这将影响依赖此资源的现有和已发布项目（如果存在）。",
    assetTypes: {
      all: "全部",
      image: "图片",
    },
    noProvider: "项目资源",
  },

  /** ========== 字体管理器 ========== */

  fontManager: {
    addFontToProject: "将字体添加到项目",
    projectFonts: "项目字体",
    emptyProjectFonts: "此项目中没有字体。",
    selectFont: "选择字体",
  },

  /** ========== 块管理器（左侧组件面板） ========== */

  blockManager: {
    notFound: "未找到组件",
    blocks: "组件",
    add: "添加更多组件",
    search: "搜索...",
    labels: {
      section: "区块",
      column1: "单列",
      column2: "两列",
      column3: "三列",
      "column3-7": "二列 3/7",
      gridRow: "栅格行",
      heading: "标题",
      divider: "分割线",
      imageBox: "图片框",
      linkBox: "链接框",
    },
    categories: {},
    types: {
      regular: "常规",
      symbols: "符号",
    },
    symbols: {
      notFound: "未找到符号",
      instancesProject: "项目中的实例",
      delete: "删除符号",
      deleteConfirm:
        "确定要删除该符号吗？项目中的所有实例将被分离。",
    },
  },

  /** ========== 数据源 ========== */

  dataSources: {
    confirm: "确认",
    clearDataValue: "清除数据值",
    connectDataValue: "连接数据值",
    variable: "变量",
    defaultValue: "默认值",
    variablePath: "变量路径",
    selectVariablePath: "选择变量路径",
    openPathExplorer: "打开路径浏览器",
    closePathExplorer: "关闭路径浏览器",
    toggleResolvedPath: "切换解析路径",
    items: "{length} 项",
    properties: "{length} 个属性",
    editVariable: "编辑变量",
    editCondition: "编辑条件",
    editCollection: "编辑集合",
    condition: "条件",
    conditionTrue: "条件为真",
    conditionFalse: "条件为假",
    conditionAnd: "与",
    conditionOr: "或",
    conditionElse: "否则",
    addCondition: "添加条件",
    deleteCondition: "删除条件",
    operator: "运算符",
    leftValue: "左侧值",
    rightValue: "右侧值",
    ifTrue: "为真时值",
    ifFalse: "为假时值",
    valueTrue: "真",
    valueFalse: "假",
    collection: "集合",
    collectionItem: "集合项",
    collectionId: "集合 ID",
    collectionStartIndex: "起始索引",
    collectionEndIndex: "结束索引",
    collectionUpToEndIndex: "全部",
    collections: {
      __rootData: "页面数据",
    },
    variableTypes: {
      currentItem: "当前项",
      prevItem: "上一项",
      nextItem: "下一项",
    },
    operators: {
      "=": "= (等于)",
      "!=": "!= (不等于)",
      ">": "> (大于)",
      ">=": ">= (大于等于)",
      "<": "< (小于)",
      "<=": "<= (小于等于)",
      contains: "包含",
      startsWith: "以...开头",
      endsWith: "以...结尾",
      matchesRegex: "匹配正则",
      equalsIgnoreCase: "等于 (忽略大小写)",
      trimEquals: "修剪后等于",
      and: "与",
      or: "或",
      xor: "异或",
      equals: "等于",
      isDefined: "已定义",
      isNull: "为空",
      isUndefined: "未定义",
      isTruthy: "为真",
      isFalsy: "为假",
      isDefaultValue: "为默认值",
      isArray: "为数组",
      isObject: "为对象",
      isString: "为字符串",
      isNumber: "为数字",
      isBoolean: "为布尔值",
    },
  },
};

export default zhCN;
