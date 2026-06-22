/**
 * GrapesJS Studio SDK 英文语言包（仅提供自定义覆盖项）
 * 基础英文由 SDK 内置 (NV) + GrapesJS 核心英文提供，此处补充自定义覆盖。
 */
const en: Record<string, unknown> = {
  /** ========== GrapesJS 核心翻译修正 ========== */
  domComponents: {
    names: {
      wrapper: "Body",
      section: "Section",
      heading: "Heading",
      divider: "Divider",
      imageBox: "Image Box",
      linkBox: "Link Box",
    },
  },

  selectorManager: {
    states: {
      hover: "Hover",
      active: "Clicked",
      "nth-of-type(2n)": "Even/Odd",
    },
  },

  deviceManager: {
    devices: {
      mobileLandscape: "Mobile Landscape",
      mobilePortrait: "Mobile Portrait",
    },
    allDevices: "All devices",
  },

  /** ========== Studio SDK 右侧面板 ========== */
  styleManager: {
    panelLabel: "Styles",
    empty: "Select an element to edit styles",
    notFound: "No styles available",
    layout: {
      flexChild: "Flex Child",
      display: {
        tips: {
          block: "Block element takes full width and starts on a new line",
          inline: "Inline element flows with text without line breaks",
          "inline-block": "Inline-block behaves like inline but respects width/height",
          flex: "Flex displays children in a flexible row or column",
          none: "Element is hidden from layout",
        },
      },
      direction: {
        title: {
          row: "Horizontal",
          "row-reverse": "Horizontal reverse",
          column: "Vertical",
          "column-reverse": "Vertical reverse",
        },
      },
      justify: {
        title: {
          start: "Start",
          center: "Center",
          end: "End",
          spaceBetween: "Space between",
          spaceAround: "Space around",
          spaceEvenly: "Space evenly",
        },
      },
      align: {
        title: {
          stretch: "Stretch",
          start: "Start",
          center: "Center",
          end: "End",
        },
      },
      alignContent: {
        title: {
          start: "Start",
          center: "Center",
          end: "End",
          spaceBetween: "Space between",
          spaceAround: "Space around",
          stretch: "Stretch",
        },
      },
      alignSelf: {
        title: {
          auto: "Auto",
          start: "Start",
          center: "Center",
          end: "End",
          stretch: "Stretch",
        },
      },
      flex: {
        title: {
          auto: "Auto",
          fillContainer: "Fill container",
          hugContents: "Hug contents",
        },
      },
    },
    effects: {
      boxShadow: {
        xOffset: "X Offset",
        yOffset: "Y Offset",
        blur: "Blur",
        spread: "Spread",
        color: "Color",
      },
      textShadow: {
        xOffset: "X Offset",
        yOffset: "Y Offset",
        blur: "Blur",
        color: "Color",
      },
      filter: { type: "Type", value: "Value" },
      backdropFilter: { type: "Type", value: "Value" },
      transition: {
        type: "Type",
        easing: "Easing",
        duration: "Duration",
        delay: "Delay",
      },
      transform: { type: "Type", value: "Value" },
      childrenTransform: "Children transform",
    },
    background: {
      sizeMode: { custom: "Custom", preset: "Preset" },
    },
    position: {
      tips: {
        static: "Default positioning",
        relative: "Positioned relative to its normal position",
        absolute: "Positioned relative to the nearest positioned ancestor",
        fixed: "Fixed relative to the viewport (doesn't move on scroll)",
        sticky: "Sticks to a position when scrolled to a certain point",
      },
      presets: {
        title: "Presets",
        options: {
          topLeft: "Top Left",
          topRight: "Top Right",
          bottomLeft: "Bottom Left",
          bottomRight: "Bottom Right",
          left: "Left",
          right: "Right",
          bottom: "Bottom",
          top: "Top",
          full: "Full Screen",
        },
      },
    },
    options: {
      __background_type: { image: "Image", gradient: "Gradient", color: "Color" },
      display: { block: "Block", inline: "Inline", "inline-block": "Inline Block", flex: "Flex", none: "None" },
      overflow: { visible: "Visible", hidden: "Hidden", scroll: "Scroll", auto: "Auto" },
      "flex-wrap": { nowrap: "No wrap", wrap: "Wrap", "wrap-reverse": "Wrap reverse" },
    },
  },

  traitManager: {
    traits: {
      labels: {
        loading: "Lazy load",
        target: "Open in new tab",
        showList: "Show element list",
        customAttributes: "Custom attributes",
      },
    },
  },

  /** ========== Studio SDK 左侧面板 ========== */
  pageManager: {
    settings: {
      title: "Page settings",
      fields: {
        slug: {
          description: "URL path identifier for the page",
        },
        title: {
          description: "Browser tab title and search result title",
        },
        description: {
          description: "Search summary description",
        },
        keywords: {
          description: "Page keywords",
        },
        socialTitle: {
          description: "Social media share title",
        },
        socialImage: {
          description: "Social media share image URL",
        },
        socialDescription: {
          description: "Social media share description",
        },
        customCodeHead: {
          description: "Insert before </head>",
        },
        customCodeBody: {
          description: "Insert before </body>",
        },
      },
    },
  },

  /** ========== 顶部工具栏按钮提示 ========== */
  actions: {
    componentOutline: { title: "Component outline" },
    preview: { title: "Preview" },
    fullscreen: { title: "Fullscreen" },
    showCode: {
      title: "Code",
      exportButton: "Export as ZIP",
    },
    undo: { title: "Undo" },
    redo: { title: "Redo" },
    save: { title: "Save project" },
    store: { title: "Save content" },
    open: { title: "Open project" },
    editCode: {
      title: "Edit code",
      noChanges: "No changes to update",
      button: "Update",
    },
    importCode: {
      title: "Import code",
      parseError: "Parse error",
      content: "Paste your HTML/CSS here and click import",
      button: "Import",
    },
    clearCanvas: {
      title: "Clear page",
      content: "Are you sure you want to clear the page?",
    },
    about: { title: "About" },
    embed: { title: "Embed Studio" },
    newProject: { title: "Load project" },
    installApp: {
      title: "Install app",
      installed: "App installed",
    },
  },

  /** ========== 块管理器 ========== */
  blockManager: {
    types: {
      regular: "Regular",
      symbols: "Symbols",
    },
    symbols: {
      notFound: "No symbols found",
      instancesProject: "Instances in project",
      delete: "Delete symbol",
      deleteConfirm: "Are you sure you want to delete the symbol? All instances in the project will be detached.",
    },
  },

  /** ========== 数据源 ========== */
  dataSources: {
    confirm: "Confirm",
    clearDataValue: "Clear data value",
    connectDataValue: "Connect data value",
    variable: "Variable",
    defaultValue: "Default value",
    variablePath: "Variable path",
    selectVariablePath: "Select variable path",
    openPathExplorer: "Open path explorer",
    closePathExplorer: "Close path explorer",
    toggleResolvedPath: "Toggle resolved path",
    items: "{length} items",
    properties: "{length} properties",
    editVariable: "Edit variable",
    editCondition: "Edit condition",
    editCollection: "Edit collection",
    condition: "Condition",
    conditionTrue: "When true",
    conditionFalse: "When false",
    conditionAnd: "And",
    conditionOr: "Or",
    conditionElse: "Else",
    addCondition: "Add condition",
    deleteCondition: "Delete condition",
    operator: "Operator",
    leftValue: "Left value",
    rightValue: "Right value",
    ifTrue: "Value if true",
    ifFalse: "Value if false",
    valueTrue: "True",
    valueFalse: "False",
    collection: "Collection",
    collectionItem: "Collection item",
    collectionId: "Collection ID",
    collectionStartIndex: "Start index",
    collectionEndIndex: "End index",
    collectionUpToEndIndex: "All",
    collections: {
      __rootData: "Page data",
    },
    variableTypes: {
      currentItem: "Current item",
      prevItem: "Previous item",
      nextItem: "Next item",
    },
    operators: {
      "=": "= (equals)",
      "!=": "!= (not equals)",
      ">": "> (greater than)",
      ">=": ">= (greater or equal)",
      "<": "< (less than)",
      "<=": "<= (less or equal)",
      contains: "Contains",
      startsWith: "Starts with",
      endsWith: "Ends with",
      matchesRegex: "Matches regex",
      equalsIgnoreCase: "Equals (ignore case)",
      trimEquals: "Trim equals",
      and: "And",
      or: "Or",
      xor: "Xor",
      equals: "Equals",
      isDefined: "Is defined",
      isNull: "Is null",
      isUndefined: "Is undefined",
      isTruthy: "Is truthy",
      isFalsy: "Is falsy",
      isDefaultValue: "Is default value",
      isArray: "Is array",
      isObject: "Is object",
      isString: "Is string",
      isNumber: "Is number",
      isBoolean: "Is boolean",
    },
  },

  /** ========== 弹窗 ========== */
  modals: {
    styleCatalog: {
      title: "Style catalog",
      noStyles: "No styles found",
    },
    openProject: {
      title: "Open project",
    },
  },

  /** ========== 插件管理器 ========== */
  pluginManager: {
    allPlugins: "All plugins",
    updateStudio: "Please restart Studio to apply plugin updates",
  },
};

export default en;
