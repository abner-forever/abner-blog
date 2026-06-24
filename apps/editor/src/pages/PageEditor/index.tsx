import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton, message, Modal, Form, Input, Select, Tooltip, Tag, Button } from "antd";
import { GlobalOutlined, RocketOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import type { Editor } from "grapesjs";
import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/dist/style.css";
import {
  pageApi,
  templateApi,
  reviewApi,
  uploadPageImage,
  type Page,
  type Template,
} from "@/services/api";
import { messages as i18nMessages, getEffectiveLocale } from "../../locales";
import type { RootState } from "@/store";
import { toggleTheme } from "@/store/themeSlice";
import { blocks } from "./blocks";
import { canvasAbsoluteMode } from "@grapesjs/studio-sdk-plugins";
import TranslationPanel from "./TranslationPanel";
import { buildPageSchemaJson } from "@/utils/schemaConverter";
import SchemaPreview from "./SchemaPreview";
import EventBindingTabContent from "./EventBindingTabContent";
import "./index.less";

type SaveStatus = "saved" | "saving" | "unsaved" | "auto-saving";

const PageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shouldPublish = searchParams.get("publish") === "true";

  const [loading, setLoading] = useState(true);
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [seoForm] = Form.useForm();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateForm] = Form.useForm();
  const [translationPanelOpen, setTranslationPanelOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const editorRef = useRef<Editor | null>(null);
  const pageDataRef = useRef<Page | null>(null);
  const isNewPageRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedComponentsRef = useRef<string>("");
  const saveStatusRef = useRef<SaveStatus>("saved");
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();

  // 弹窗序号计数器（每次新增弹窗自增，名称如"新弹窗1""新弹窗2"）
  const modalCounterRef = useRef(0);

  // Modal 双区域编辑状态
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const activeModalIdRef = useRef<string | null>(null);
  const [modalList, setModalList] = useState<Array<{ label: string; id: string }>>([]);

  // 用于防止 processModalComponent 中的 300ms 定时器在用户手动退出后重新进入弹窗编辑模式
  const userExitedModalEditingRef = useRef(false);

  // 同步 activeModalId 到 ref，供 onReady 中的事件监听器使用（避免闭包陈旧值）
  useEffect(() => {
    activeModalIdRef.current = activeModalId;
  }, [activeModalId]);

  /** 加载页面数据 */
  useEffect(() => {
    if (!id) return;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      message.error("无效的页面 ID");
      navigate("/");
      return;
    }

    pageApi
      .getById(numericId)
      .then((page) => {
        pageDataRef.current = page;
        setLoading(false);
      })
      .catch(() => {
        message.error("页面不存在");
        navigate("/");
      });
  }, [id, navigate]);

  /** 自动发布模式提示 */
  useEffect(() => {
    if (!loading && shouldPublish) {
      message.info("编辑器已就绪，完成编辑后点击发布按钮");
    }
  }, [loading, shouldPublish]);

  /** 发布页面 */
  const handlePublish = useCallback(
    async ({ editor }: { editor: Editor }) => {
      if (!id) return;

      Modal.confirm({
        title: "确认发布",
        content: `发布后，页面将通过 /page/${pageDataRef.current?.slug || "..."} 地址对外公开。确定发布？`,
        okText: "确认发布",
        cancelText: "取消",
        onOk: async () => {
          try {
            // 生成页面 Schema（含编辑器数据用于恢复）
            const schemaStr = buildPageSchemaJson(editor);

            // 将编辑器项目数据嵌入 schema 的 editorData 字段，与 onSave 保持一致
            let fullSchema = schemaStr;
            if (schemaStr) {
              try {
                const schemaObj = JSON.parse(schemaStr);
                schemaObj.editorData = editor.getProjectData();
                fullSchema = JSON.stringify(schemaObj);
              } catch {
                // schema 解析失败，仅保存原始数据
              }
            }

            await pageApi.publish(parseInt(id, 10), {
              schema: fullSchema,
              // 发布时带上封面，优先使用已设置的 cover，其次用 ogImage
              cover: pageDataRef.current?.cover || pageDataRef.current?.ogImage || undefined,
            });

            message.success("发布成功");
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "发布失败";
            message.error(msg);
          }
        },
      });
    },
    [id],
  );

  /** 打开 SEO 设置 */
  const handleOpenSEO = useCallback(() => {
    if (pageDataRef.current) {
      seoForm.setFieldsValue({
        title: pageDataRef.current.title,
        description: pageDataRef.current.description || "",
        keywords: pageDataRef.current.keywords || [],
        ogImage: pageDataRef.current.ogImage || "",
      });
    }
    setSeoModalOpen(true);
  }, [seoForm]);

  /** 保存 SEO 设置 */
  const handleSaveSEO = useCallback(async () => {
    try {
      const values = await seoForm.validateFields();
      if (!id) return;

      const dto: Record<string, unknown> = {
        title: values.title,
        description: values.description || undefined,
        keywords: values.keywords?.length ? values.keywords : undefined,
        ogImage: values.ogImage || undefined,
      };

      await pageApi.update(parseInt(id, 10), dto);
      message.success("SEO 设置已保存");
      setSeoModalOpen(false);
    } catch {
      // 表单校验失败，不关闭弹窗
    }
  }, [id, seoForm]);

  /** 打开保存为模板弹窗 */
  const _handleOpenSaveTemplate = useCallback(() => {
    templateForm.resetFields();
    if (pageDataRef.current) {
      templateForm.setFieldsValue({
        name: pageDataRef.current.title + " - 模板",
        category: "",
      });
    }
    setTemplateModalOpen(true);
  }, [templateForm]);

  /** 保存当前页面为模板 */
  const handleSaveTemplate = useCallback(async () => {
    try {
      const values = await templateForm.validateFields();
      setTemplateSaving(true);

      const editor = editorRef.current;
      if (!editor) {
        message.error("编辑器尚未初始化");
        return;
      }

      const projectData = editor.getProjectData();
      const componentsStr = JSON.stringify(projectData);

      await templateApi.create({
        name: values.name,
        category: values.category || "",
        description: values.description || undefined,
        components: componentsStr,
      });

      message.success("已保存为模板");
      setTemplateModalOpen(false);
      templateForm.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("保存模板失败");
    } finally {
      setTemplateSaving(false);
    }
  }, [templateForm]);

  /** 提交审核 */
  const handleSubmitReview = useCallback(async () => {
    if (!id) return;
    setReviewLoading(true);
    try {
      // 提交前先保存编辑器内容
      const editor = editorRef.current;
      if (editor) {
        await editor.store();
      }
      await reviewApi.submit(parseInt(id, 10));
      message.success("已提交审核");
      if (pageDataRef.current) {
        pageDataRef.current.reviewStatus = "reviewing";
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "提交审核失败，请先保存页面内容";
      message.error(msg);
    } finally {
      setReviewLoading(false);
    }
  }, [id]);

  /**
   * 刷新弹窗列表（从编辑器 modals-container 中提取）
   *
   * 注意：必须使用 getAttributes() 而非 getEl()?.getAttribute()，
   * 因为 GrapesJS Studio SDK 中 DOM 元素可能尚未就绪。
   */
  const refreshModalList = useCallback((editor: Editor) => {
    const wrapper = editor.getWrapper();
    if (!wrapper) { setModalList([]); return; }

    const list: Array<{ label: string; id: string }> = [];
    const container = findContainerByType(wrapper, 'modals-container');
    if (container) {
      const comps = tryGetComponents(container);
      if (comps) {
        comps.each((comp: unknown) => {
          const m = comp as { getType: () => string; getAttributes: () => Record<string, string>; getId: () => string };
          if (m.getType() === 'textnode') return;
          const compAttrs = m.getAttributes();
          const name = compAttrs['data-modal-name']
            || compAttrs['data-schema-label']
            || '未命名弹窗';
          list.push({ label: name, id: m.getId() });
        });
      }
    }
    setModalList(list);
  }, []);

  /** 辅助：在组件上设置 display */
  const trySetCompDisplay = (comp: unknown, value: string) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      if (value === '') {
        c.addStyle({ display: '' });
      } else if (typeof c.addStyle === 'function') {
        c.addStyle({ display: value });
      }
      // 也通过 DOM 确保效果
      if (typeof c.getEl === 'function') {
        const el = c.getEl();
        if (el) el.style.display = value;
      }
    } catch {
      // 忽略
    }
  };

  /** 辅助：在组件上设置多个样式（value 为空字符串或对象为空时清除） */
  const trySetCompStyle = (comp: unknown, styles: Record<string, string>) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      const has = Object.keys(styles).length > 0;
      if (has && typeof c.addStyle === 'function') {
        c.addStyle(styles);
      }
      // 通过 DOM 确保效果
      if (typeof c.getEl === 'function') {
        const el = c.getEl();
        if (el) {
          if (has) {
            Object.entries(styles).forEach(([k, v]) => {
              ((el.style as unknown) as Record<string, string>)[k] = v;
            });
          } else {
            el.style.position = '';
            el.style.alignItems = '';
            el.style.justifyContent = '';
            el.style.background = '';
            el.style.overflow = '';
            el.style.padding = '';
            el.style.top = '';
            el.style.left = '';
            el.style.right = '';
            el.style.bottom = '';
            el.style.zIndex = '';
          }
        }
      }
    } catch {
      // 忽略
    }
  };

  /**
   * 辅助：通过 CSS 类控制组件显隐（配合注入 iframe 的 gjs-visible/gjs-hidden CSS 规则）
   * 比 trySetCompDisplay 更可靠，因为 CSS 使用 !important
   *
   * 同时设置 inline style（display）作为兜底，确保即使 CSS class 规则未注入也能
   * 实现对组件的基本显隐控制。display 的值通过 addStyle（组件 model）和 getEl（DOM）
   * 两层写入，确保在 model 层面和渲染层面都生效。
   */
  const trySetCompVisible = (comp: unknown, visible: boolean) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addClass: (c: string) => void; removeClass: (c: string) => void; addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      const hasAddClass = typeof c.addClass === 'function';
      const hasRemoveClass = typeof c.removeClass === 'function';
      const hasAddStyle = typeof c.addStyle === 'function';
      const hasGetEl = typeof c.getEl === 'function';
      let el: HTMLElement | null = null;
      if (hasGetEl) {
        try { el = c.getEl(); } catch {}
      }

      if (visible) {
        // CSS class 层面：添加 gjs-visible，移除 gjs-hidden
        if (hasAddClass) c.addClass('gjs-visible');
        if (hasRemoveClass) c.removeClass('gjs-hidden');
        // 兜底：清除 inline display，允许 CSS class 控制显示
        if (hasAddStyle) c.addStyle({ display: '' });
      } else {
        // CSS class 层面：移除 gjs-visible，添加 gjs-hidden
        if (hasRemoveClass) c.removeClass('gjs-visible');
        if (hasAddClass) c.addClass('gjs-hidden');
        // 兜底：强制 inline display: none
        if (hasAddStyle) c.addStyle({ display: 'none' });
      }
      // 也直接操作 DOM 确保生效
      if (el) {
        el.classList.toggle('gjs-visible', visible);
        el.classList.toggle('gjs-hidden', !visible);
        el.style.display = visible ? '' : 'none';
      }
    } catch (e) {
      // 忽略异常，不影响主流程
    }
  };

  /**
   * 在 wrapper 中查找指定类型的容器组件（getType + data-gjs-type + data-schema-type 三重检测）
   */
  const findContainerByType = (wrapper: unknown, typeName: string): unknown | null => {
    if (!wrapper || typeof wrapper !== 'object') return null;
    try {
      const w = wrapper as { components: () => { each: (cb: (c: unknown) => void) => void } };
      let found: unknown | null = null;
      if (typeof w.components !== 'function') return null;
      w.components().each((child: unknown) => {
        if (found) return;
        const c = child as { getType: () => string; getAttributes?: () => Record<string, string> };
        if (typeof c.getType === 'function' && c.getType() === typeName) { found = child; return; }
        if (typeof c.getAttributes === 'function') {
          const attrs = c.getAttributes();
          if (attrs && (attrs['data-gjs-type'] === typeName || attrs['data-schema-type'] === typeName)) {
            found = child;
          }
        }
      });
      return found;
    } catch {
      return null;
    }
  };

  /** 辅助：获取组件的子组件迭代器 */
  const tryGetComponents = (comp: unknown): { each: (cb: (c: unknown) => void) => void } | null => {
    if (!comp || typeof comp !== 'object') return null;
    try {
      const c = comp as { components: () => { each: (cb: (c: unknown) => void) => void } };
      if (typeof c.components === 'function') {
        return c.components();
      }
    } catch {
      // 忽略
    }
    return null;
  };

  /**
   * 判断组件是否为弹窗（多种检测方式，兼容 Studio SDK 的 getType/getAttributes 行为差异）
   *
   * 检测顺序：
   * 1. comp.getType() === 'modal'（GrapesJS 原始机制）
   * 2. getAttributes()['data-gjs-type'] === 'modal'（SDK 保留 data-gjs-type 的情况）
   * 3. getAttributes()['data-schema-type'] === 'modal'（自定义 schema 类型标记）
   * 4. comp.toHtml() 包含 data-schema-type="modal" 或 data-gjs-type="modal"（兜底：根据 HTML 内容判断）
   */
  const isModalComponent = (comp: unknown): boolean => {
    if (!comp || typeof comp !== 'object') return false;
    try {
      const c = comp as { getType: () => string; getAttributes: () => Record<string, string>; getId: () => string; toHtml?: () => string };
      const compId = typeof c.getId === 'function' ? c.getId() : 'no-id';
      // 检查1：getType
      if (typeof c.getType === 'function') {
        const t = c.getType();
        if (t === 'modal') {
          console.log(`[isModal] ✅ getType=${t} id=${compId}`);
          return true;
        }
      }
      // 检查2：getAttributes
      if (typeof c.getAttributes === 'function') {
        const attrs = c.getAttributes();
        if (attrs) {
          const hasGjs = attrs['data-gjs-type'] === 'modal';
          const hasSchema = attrs['data-schema-type'] === 'modal';
          if (hasGjs || hasSchema) {
            console.log(`[isModal] ✅ attrs data-gjs-type=${attrs['data-gjs-type']} data-schema-type=${attrs['data-schema-type']} id=${compId}`);
            return true;
          }
        }
      }
      // 检查3：toHtml
      if (typeof c.toHtml === 'function') {
        const html = c.toHtml();
        if (html && (html.includes('data-schema-type="modal"') || html.includes('data-gjs-type="modal"'))) {
          console.log(`[isModal] ✅ toHtml 包含弹窗标记 id=${compId}`);
          return true;
        }
      }
      console.log(`[isModal] ❌ 全部检测失败 id=${compId} getType=${typeof c.getType === 'function' ? c.getType() : 'N/A'} attrs=${JSON.stringify(typeof c.getAttributes === 'function' ? c.getAttributes() : {})}`);
    } catch (e) {
      console.error(`[isModal] 异常:`, e);
    }
    return false;
  };

  /**
   * 辅助：设置 modals-container 的遮罩层样式
   *
   * 与 trySetCompVisible 不同，此函数通过 addStyle 直接设置 overlay 所需的
   * 全部 inline 样式（position:fixed/background/display:flex 等），
   * 不依赖注入到 iframe 的 CSS class 规则。
   *
   * 当 visible=true 时：
   *   同时设置 CSS class（gjs-visible/gjs-hidden）+ 全部 overlay inline 样式
   * 当 visible=false 时：
   *   仅设置 display:none（保留 overlay 样式但隐藏元素）
   */
  const setModalContainerOverlay = (comp: unknown, visible: boolean) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addClass: (c: string) => void; removeClass: (c: string) => void; addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      const OVERLAY_STYLES: Record<string, string> = {
        display: 'flex',
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        'z-index': '10000',
        background: 'rgba(0, 0, 0, 0.45)',
        overflow: 'auto',
        // padding 必须为 0，否则弹窗的包含块起点偏移，导致绝对定位拖拽坐标错位
        padding: '0',
        width: '100%',
        height: '100%',
        'box-sizing': 'border-box',
        'align-items': 'center',
        'justify-content': 'center',
      };

      // CSS class 层面（兜底：可能未注入到 iframe，但不冲突）
      if (typeof c.addClass === 'function') {
        if (visible) {
          c.addClass('gjs-visible');
          if (typeof c.removeClass === 'function') c.removeClass('gjs-hidden');
        } else {
          if (typeof c.removeClass === 'function') c.removeClass('gjs-visible');
          c.addClass('gjs-hidden');
        }
      }

      // inline style 层面（确保不依赖 iframe CSS 也能正确渲染遮罩）
      if (typeof c.addStyle === 'function') {
        if (visible) {
          c.addStyle(OVERLAY_STYLES);
        } else {
          c.addStyle({ display: 'none' });
        }
      }

      // DOM 直接操作层面（最可靠）
      if (typeof c.getEl === 'function') {
        const el = c.getEl();
        if (el) {
          el.classList.toggle('gjs-visible', visible);
          el.classList.toggle('gjs-hidden', !visible);
          if (visible) {
            Object.assign(el.style, OVERLAY_STYLES);
          } else {
            el.style.display = 'none';
          }
        }
      }
    } catch {
      // 忽略异常，不影响主流程
    }
  };

  /**
   * 辅助：为弹窗组件添加编辑模式定位样式
   *
   * 弹窗编辑模式下弹窗居中展示（与运行时行为一致）。
   * canvasAbsoluteMode 插件的坐标计算是视口空间（viewport-relative），
   * 但 addStyle() 的 left/top 是 CSS 包含块空间（containing-block-relative）。
   * 弹窗内部的绝对定位子元素以弹窗为包含块，弹窗居中时两个坐标系存在偏移。
   *
   * 解决方案（在 onReady 中实现）：
   * 监听 dmode:start/end 跟踪绝对定位拖拽生命周期，
   * 在 component:update 事件中将视口坐标转为弹窗相对坐标（减去弹窗视口偏移量），
   * 使得保存到 schema 的 left/top 值是弹窗相对坐标，与运行时渲染引擎一致。
   */
  const addModalEditPositionStyles = (comp: unknown) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      const MODAL_EDIT_STYLES: Record<string, string> = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        // 避免覆盖 max-height/overflow 等重要样式
        'z-index': '10001',
      };
      if (typeof c.addStyle === 'function') {
        c.addStyle(MODAL_EDIT_STYLES);
      }
      if (typeof c.getEl === 'function') {
        const el = c.getEl();
        if (el) {
          Object.assign(el.style, MODAL_EDIT_STYLES);
        }
      }
    } catch {
      // 忽略异常
    }
  };

  /**
   * 清除弹窗编辑模式的居中定位样式
   * 在退出弹窗编辑模式时调用，确保弹窗内容不会残留居中样式
   */
  const removeModalEditPositionStyles = (comp: unknown) => {
    if (!comp || typeof comp !== 'object') return;
    try {
      const c = comp as { addStyle: (s: Record<string, string>) => void; getEl: () => HTMLElement | null };
      const RESET_STYLES: Record<string, string> = {
        position: '',
        top: '',
        left: '',
        transform: '',
        'z-index': '',
      };
      if (typeof c.addStyle === 'function') {
        c.addStyle(RESET_STYLES);
      }
      if (typeof c.getEl === 'function') {
        const el = c.getEl();
        if (el) {
          el.style.position = '';
          el.style.top = '';
          el.style.left = '';
          el.style.transform = '';
          el.style.zIndex = '';
        }
      }
    } catch {
      // 忽略异常
    }
  };

  /**
   * 切换弹窗编辑模式
   * null = 编辑页面，string = 编辑指定弹窗
   *
   * modals-container 通过 setModalContainerOverlay 设置 inline 遮罩样式，
   * 个体弹窗通过 trySetCompVisible 控制显隐（CSS class + inline style 双兜底），
   * 并通过 addModalEditPositionStyles 将弹窗居中展示。
   *
   * 弹窗内绝对定位子元素的坐标转换（视口 → 弹窗相对）在 onReady 的
   * dmode:start/end + component:update 事件监听器中处理。
   */
  const toggleModalEditing = useCallback((modalId: string | null) => {
    const editor = editorRef.current;
    if (!editor) { return; }

    const wrapper = editor.getWrapper();
    if (!wrapper) { return; }

    const modalsContainer = findContainerByType(wrapper, 'modals-container');
    if (!modalsContainer) { return; }

    if (modalId) {
      // 用户主动进入弹窗编辑模式，重置退出标记
      userExitedModalEditingRef.current = false;

      // 进入弹窗编辑模式：设置遮罩层 inline 样式
      setModalContainerOverlay(modalsContainer, true);

      // 仅显示选中的弹窗，隐藏其他弹窗，并为目标弹窗添加绝对居中样式
      const modalComps = tryGetComponents(modalsContainer);
      if (modalComps) {
        modalComps.each((comp: unknown) => {
          const m = comp as { getId: () => string; getType: () => string };
          if (m.getType() === 'textnode') return;
          const compId = m.getId();
          const isTarget = compId === modalId;
          trySetCompVisible(comp, isTarget);
          if (isTarget) {
            addModalEditPositionStyles(comp);
          }
        });
      }
    } else {
      // 退出弹窗编辑模式：记录用户退出标记，防止自动恢复定时器重新进入
      userExitedModalEditingRef.current = true;

      // 先逐一隐藏所有弹窗组件并清除居中定位样式，确保不因 CSS 级联问题残留可见元素
      const modalComps = tryGetComponents(modalsContainer);
      if (modalComps) {
        modalComps.each((comp: unknown) => {
          const m = comp as { getId: () => string; getType: () => string };
          if (m.getType() === 'textnode') return;
          trySetCompVisible(comp, false);
          removeModalEditPositionStyles(comp);
        });
      }

      // 然后隐藏 modals-container
      setModalContainerOverlay(modalsContainer, false);
    }

    setActiveModalId(modalId);
  }, []);

  if (loading) {
    return (
      <div className="page-editor__loading">
        <div style={{ padding: 24, width: "100%" }}>
          <Skeleton active paragraph={{ rows: 1 }} />
          <div style={{ height: 16 }} />
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  /** 审核状态配置 */
  const reviewStatusConfig: Record<
    string,
    { color: string; text: string }
  > = {
    draft: { color: "#d9d9d9", text: "未提交" },
    reviewing: { color: "#faad14", text: "审核中" },
    approved: { color: "#52c41a", text: "已通过" },
    rejected: { color: "#ff4d4f", text: "已驳回" },
  };

  const currentReviewStatus =
    pageDataRef.current?.reviewStatus || "draft";
  const reviewCfg = reviewStatusConfig[currentReviewStatus];

  /** 保存状态对应的颜色和文案 */
  const saveStatusConfig: Record<SaveStatus, { color: string; text: string }> = {
    saved: { color: "#52c41a", text: "已保存" },
    saving: { color: "#1890ff", text: "保存中..." },
    "auto-saving": { color: "#faad14", text: "自动保存..." },
    unsaved: { color: "#ff4d4f", text: "未保存的更改" },
  };

  /** 语言标识 */
  const localeAbbr: Record<string, string> = {
    "zh-CN": "中",
    en: "EN",
  };

  return (
    <div className="page-editor">
      {/* 顶部操作栏（状态指示 + 发布） */}
      <div className="page-editor__topbar">
        <div className="page-editor__topbar-left">
          <Button type="text" onClick={() => navigate("/")} className="page-editor__back-btn">
            ← 返回
          </Button>
        </div>
        {/* Modal 编辑切换工具栏（下拉框，弹窗多时不铺平） */}
        {modalList.length > 0 && (
          <div className="page-editor__topbar-center">
            <div className="page-editor__modal-toolbar">
              <AppstoreOutlined style={{ fontSize: 13, marginRight: 6 }} />
              <Select
                size="small"
                value={activeModalId || 'page'}
                style={{ width: 200 }}
                onChange={(val) => {
                  toggleModalEditing(val === 'page' ? null : val);
                }}
                options={[
                  { label: '📄 页面', value: 'page' },
                  ...modalList.map(m => ({ label: m.label, value: m.id })),
                ]}
              />
            </div>
          </div>
        )}
        <div className="page-editor__topbar-right">
          <Tooltip title={saveStatusConfig[saveStatus].text}>
            <Tag
              color={saveStatusConfig[saveStatus].color}
              className="page-editor__save-tag"
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: saveStatusConfig[saveStatus].color,
                  marginRight: 4,
                }}
              />
              {saveStatusConfig[saveStatus].text}
            </Tag>
          </Tooltip>
          {/* 审核状态 */}
          <Tag
            color={reviewCfg.color}
            className="page-editor__save-tag"
          >
            {reviewCfg.text}
          </Tag>
          {/* 语言标识 */}
          {pageDataRef.current && (
            <Tag color="blue" className="page-editor__save-tag">
              <GlobalOutlined style={{ marginRight: 2 }} />
              {localeAbbr[pageDataRef.current.locale] ||
                pageDataRef.current.locale}
            </Tag>
          )}
          {/* 提交审核（仅草稿/已驳回状态） */}
          {(currentReviewStatus === "draft" ||
            currentReviewStatus === "rejected") && (
            <Button
              loading={reviewLoading}
              onClick={handleSubmitReview}
            >
              提交审核
            </Button>
          )}
          <div className="page-editor__topbar-divider" />
          <Button
            onClick={async () => {
              if (!editorRef.current) {
                message.error("编辑器尚未就绪");
                return;
              }
              setSaveStatus("saving");
              try {
                await editorRef.current.store();
                message.success("保存成功");
              } catch {
                message.error("保存失败");
              }
            }}
          >
            保存
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              if (!editorRef.current) {
                message.error("编辑器尚未就绪");
                return;
              }
              handlePublish({ editor: editorRef.current });
            }}
          >
            发布
          </Button>
          <SchemaPreview editorRef={editorRef} />
        </div>
      </div>
      <div className="page-editor__editor-wrapper">
        <StudioEditor
        options={{
          licenseKey: "LOCAL_LICENSE_KEY",
          /** 主题跟随 Redux 状态（light/dark 可切换） */
          theme: themeMode,
          /** 自定义主题色，与 Ant Design 主色 #1890ff 保持一致 */
          customTheme: {
            default: {
              colors: {
                primary: {
                  background1: "#1890ff",
                  background2: themeMode === "dark" ? "#003a8c" : "#e6f7ff",
                  background3: themeMode === "dark" ? "#002766" : "#f0f5ff",
                  backgroundHover: themeMode === "dark" ? "#40a9ff" : "#096dd9",
                  text: "#ffffff",
                },
              },
            },
          },
          project: {
            type: "web",
          },
          /** 语言包配置（中英文，默认跟随系统语言） */
          i18n: {
            locales: i18nMessages,
          },
          /** 设置 GrapesJS 核心语言 */
          gjsOptions: {
            i18n: {
              locale: getEffectiveLocale(),
              detectLocale: false,
            },
          },
          /** 图片上传：使用项目已有的 API */
          assets: {
            onUpload: async ({ files }) => {
              const file = files[0];
              if (!file) return [];
              try {
                const result = await uploadPageImage(file);
                return [{ src: result.url }];
              } catch {
                message.error("图片上传失败");
                return [];
              }
            },
          },
          /** 自托管持久化 */
          storage: {
            type: "self",
            onLoad: async () => {
              const page = pageDataRef.current;
              // 从 schema 中恢复编辑器项目数据
              if (page?.schema) {
                try {
                  const schema = JSON.parse(page.schema);
                  if (schema?.editorData) {
                    // 如果 schema 包含 editorData，用于恢复编辑器状态
                    lastSavedComponentsRef.current = page.schema;
                    return { project: schema.editorData };
                  }
                } catch {
                  // schema 解析失败，使用空白画布
                }
              }
              // 新建页面，标记为可显示模板选择器
              isNewPageRef.current = true;
              return {
                project: {
                  pages: [
                    {
                      name: page?.title || "Page",
                      component: "<h1>Empty page</h1>",
                    },
                  ],
                },
              };
            },
            onSave: async ({ project }) => {
              if (!id) return;

              // 生成页面 Schema（含编辑器数据用于恢复）
              const editor = editorRef.current;
              const schemaStr = editor ? buildPageSchemaJson(editor) : undefined;

              // 将编辑器项目数据嵌入 schema 的 editorData 字段
              let fullSchema = schemaStr;
              if (schemaStr) {
                try {
                  const schemaObj = JSON.parse(schemaStr);
                  schemaObj.editorData = project;
                  fullSchema = JSON.stringify(schemaObj);
                } catch {
                  // schema 解析失败，仅保存 editor 数据
                }
              }

              await pageApi.update(parseInt(id, 10), {
                ...(fullSchema ? { schema: fullSchema } : {}),
              });
              lastSavedComponentsRef.current = JSON.stringify(project);
              saveStatusRef.current = "saved";
              setSaveStatus("saved");
            },
          },
          /** 组件块 */
          blocks: {
            default: blocks,
          },
          /** 模板：从服务器 API 获取，带本地 fallback */
          templates: {
            onLoad: async () => {
              try {
                const templates = await templateApi.list();
                if (templates && templates.length > 0) {
                  return templates.map((tpl: Template) => {
                    let data: unknown;
                    try {
                      data = JSON.parse(tpl.components);
                    } catch {
                      data = {
                        pages: [
                          {
                            name: "页面",
                            component: "<h1>模板加载失败</h1>",
                          },
                        ],
                      };
                    }
                    return {
                      id: `template-${tpl.id}`,
                      name: tpl.name,
                      data,
                      description: tpl.description,
                    };
                  });
                }
              } catch {
                // API 不可用时使用空白 fallback
              }
              // Fallback：默认空白模板
              return [
                {
                  id: "blank",
                  name: "空白页面",
                  data: {
                    pages: [
                      {
                        name: "首页",
                        component:
                          '<div style="padding:40px"><h1>从这里开始编辑</h1></div>',
                      },
                    ],
                  },
                },
              ];
            },
          },
          /** 组件配置 */
          components: {
            /** 翻译画布右键菜单 */
            contextMenu: ({ items }) => {
              const labelMap: Record<string, string> = {
                selectParent: "选择父级",
                duplicate: "复制",
                symbolCreate: "创建符号",
                symbolDetach: "分离实例",
                symbolOverride: "允许覆盖",
                symbolOverrideClear: "取消覆盖",
                delete: "删除",
              };
              return items.map((item) => ({
                ...item,
                label: labelMap[item.id] || item.label,
              }));
            },
          },
          /** 禁用不必要的设置菜单项 */
          settingsMenu: {
            saveProject: false,
            theme: false,
          },
          /** 通过官方插件启用条件性绝对定位拖拽 */
          //
          // 坐标系统说明：
          //
          // canvasAbsoluteMode 插件使用 getElBoxRect() 获取元素的视口空间坐标
          // （相对于 canvas iframe 视口），然后通过 addStyle() 设置 left/top。
          // 对于页面级内容（body 作为包含块，起点在视口原点），视口坐标 = CSS 坐标，
          // 两者一致，拖拽行为正确。
          //
          // 对于弹窗内部子元素：弹窗居中展示（top:50%;left:50%;transform...），
          // 弹窗自身是子元素的包含块。弹窗不在视口原点，因此插件的视口坐标 ≠ CSS 坐标，
          // 拖拽时元素位置偏离鼠标。
          //
          // 解决方案（在 onReady 中实现）：
          // 在 dmode:start/end 跟踪拖拽生命周期，通过 component:update 事件监听器
          // 将插件产生的视口坐标实时转为弹窗相对坐标（减去弹窗的视口偏移量）。
          // 保存到 schema 的 left/top 是弹窗相对坐标，与运行时渲染引擎坐标一致。
          //
          plugins: [
            canvasAbsoluteMode.init({
              globalAbsolute: false,
              enableAbsolute: ({ component }: { component: { getEl: () => HTMLElement | null } }) => {
                const cmpEl = component.getEl();
                if (!cmpEl || getComputedStyle(cmpEl).position !== "absolute") {
                  return false;
                }
                // ⚠️ 不要在 enableAbsolute 中对父元素设置 position: relative，
                // 以免引入额外的包含块偏移。页面级内容有 wrapper 统一做定位锚点，
                // 弹窗级内容由坐标转换监听器处理。
                return true;
              },
              snapping: { x: 10, y: 10 },
            }),
          ],
          /** 编辑器就绪后：自动保存 + 新建页面模板选择器 */
          onReady: (editor: Editor) => {
            editorRef.current = editor;

            // ========== 确保 wrapper（body）有 position: relative ==========
            // 作为页面内容绝对定位子元素的包含块，且起点在视口原点 (0,0)，
            // 使得插件产生的视口坐标与 CSS 包含块坐标一致。弹窗内部子元素的
            // 坐标转换由专门的 dmode/component:update 监听器处理。
            try {
              const wrapper = editor.getWrapper();
              if (wrapper && typeof (wrapper as unknown as { getStyle: () => Record<string, string> }).getStyle === 'function') {
                const w = wrapper as unknown as {
                  getStyle: () => Record<string, string>;
                  addStyle: (s: Record<string, string>) => void;
                };
                const ws = w.getStyle();
                const wp = ws?.position;
                if (!wp || wp === '' || wp === 'static') {
                  w.addStyle({ position: 'relative' });
                }
              }
            } catch { /* 忽略 */ }

            // ========== 注册自定义组件类型（消除 "not found" 警告） ==========
            const domComps = editor.DomComponents;
            if (domComps && !domComps.getType('page-content')) {
              domComps.addType('page-content', {
                model: { defaults: { draggable: false, droppable: true, highlightable: false } },
              });
            }
            if (domComps && !domComps.getType('modals-container')) {
              domComps.addType('modals-container', {
                model: { defaults: { draggable: false, droppable: true, highlightable: false } },
              });
            }
            if (domComps && !domComps.getType('modal')) {
              domComps.addType('modal', {
                model: {
                  defaults: {
                    draggable: true,
                    droppable: true,
                    traits: [
                      {
                        type: 'text',
                        name: 'data-modal-name',
                        label: '弹窗名称',
                        placeholder: '弹窗名称（显示在切换下拉框和左侧面板）',
                      },
                      {
                        type: 'text',
                        name: 'data-modal-title',
                        label: '弹窗标题',
                        placeholder: '弹窗运行时显示在弹窗顶部的标题文字',
                      },
                      {
                        type: 'number',
                        name: 'data-modal-width',
                        label: '弹窗宽度',
                        placeholder: '默认 520',
                        min: 300,
                        max: 1200,
                      },
                      {
                        type: 'select',
                        name: 'data-modal-animation',
                        label: '弹窗动画',
                        options: [
                          { value: 'fade', name: '淡入淡出' },
                          { value: 'zoom', name: '缩放' },
                          { value: 'slide', name: '滑入' },
                        ],
                      },
                    ],
                  },
                  /**
                   * 重写 getName() 使左侧面板和图层显示自定义弹窗名称
                   * 每次面板更新时会重新调用，与 data-modal-name 属性同步
                   */
                  getName() {
                    const attrs = this.getAttributes();
                    return attrs['data-modal-name'] || '弹窗';
                  },
                },
              });
            }
            if (domComps && !domComps.getType('html-embed')) {
              domComps.addType('html-embed', {
                model: { defaults: { droppable: false } },
              });
            }

            // ========== 注入弹窗编辑 CSS 到画布 iframe ==========
            // GrapesJS 画布在 iframe 中，index.less 的 CSS 规则不会传递到 iframe 内部
            // Studio SDK 没有 addCss() 方法，需要通过 Canvas API 或直接操作 iframe DOM 注入
            const injectModalCss = () => {
              const css = `
                .gjs-hidden { display: none !important; }
                .gjs-visible { display: block !important; }
                [data-gjs-type="modals-container"] { display: none; }
                [data-gjs-type="modals-container"].gjs-visible {
                  display: flex !important;
                  align-items: center;
                  justify-content: center;
                  position: fixed;
                  top: 0; left: 0; right: 0; bottom: 0;
                  z-index: 10000;
                  background: rgba(0, 0, 0, 0.45);
                  overflow: auto;
                  /* padding 必须为 0，使包含块起点在视口原点，确保绝对定位拖拽坐标正确 */
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  box-sizing: border-box;
                }
                /* 弹窗编辑模式下 gjs-visible 覆盖 gjs-hidden */
                [data-gjs-type="modals-container"].gjs-visible.gjs-hidden {
                  display: flex !important;
                }
                [data-schema-type="modal"].gjs-hidden {
                  display: none !important;
                }
                [data-schema-type="modal"]:not(.gjs-hidden) {
                  background: var(--bg-color, #fff);
                  border-radius: 8px;
                  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
                  min-width: 320px;
                  max-width: 90%;
                  max-height: 80%;
                  overflow: auto;
                }
                /* gjs-visible 覆盖 gjs-hidden，确保可见类优先级高于隐藏类 */
                [data-schema-type="modal"].gjs-visible {
                  display: block !important;
                }
              `;
              // 方法1：通过 Canvas API 获取 iframe
              try {
                const editorAny = editor as unknown as { Canvas?: { getFrameEl?: () => HTMLIFrameElement | null } };
                const frameEl = editorAny.Canvas?.getFrameEl?.();
                if (frameEl?.contentDocument?.head) {
                  const style = frameEl.contentDocument.createElement('style');
                  style.textContent = css;
                  style.setAttribute('data-injected', 'modal-editor-css');
                  frameEl.contentDocument.head.appendChild(style);
                  return;
                }
              } catch {
                // 忽略，尝试 DOM 方案
              }
              // 方法2：直接通过 DOM 查找画布 iframe
              const tryInject = () => {
                const frame = document.querySelector('iframe.gjs-frame') as HTMLIFrameElement | null;
                if (frame?.contentDocument?.head) {
                  const style = frame.contentDocument.createElement('style');
                  style.textContent = css;
                  style.setAttribute('data-injected', 'modal-editor-css');
                  frame.contentDocument.head.appendChild(style);
                  return true;
                }
                return false;
              };
              if (!tryInject()) {
                // 延迟重试，等待 iframe 创建完成
                const timer = window.setInterval(() => {
                  if (tryInject()) {
                    clearInterval(timer);
                  }
                }, 200);
                // 10秒后停止重试
                window.setTimeout(() => clearInterval(timer), 10000);
              }
            };
            injectModalCss();

            // ========== Modal 双区域结构构建 ==========
            // 将现有组件分为 page-content 和 modals-container 两个区域
            const buildDualRegion = () => {
              try {
                const wrapper = editor.getWrapper();
                if (!wrapper) return;

                // 已存在或重建 page-content
                let pageContent = findContainerByType(wrapper, 'page-content');
                if (!pageContent) {
                  pageContent = wrapper.append('<div data-gjs-type="page-content"></div>')[0];
                }

                // 确保 page-content 有 position: relative，作为绝对定位子元素的定位锚点
                // 否则绝对定位元素的 top/left 以 iframe 视口为参照，与拖拽坐标计算不一致
                try {
                  const pc = pageContent as unknown as {
                    getStyle: () => Record<string, string>;
                    addStyle: (s: Record<string, string>) => void;
                  };
                  if (typeof pc.getStyle === 'function' && typeof pc.addStyle === 'function') {
                    const pcStyle = pc.getStyle();
                    const pcPos = pcStyle?.position;
                    if (!pcPos || pcPos === '' || pcPos === 'static') {
                      pc.addStyle({ position: 'relative' });
                    }
                  }
                } catch { /* 忽略 */ }

                // 已存在或重建 modals-container（通过 addStyle 控制显隐，避免 HTML inline style 冲突）
                let modalsContainer = findContainerByType(wrapper, 'modals-container');
                if (!modalsContainer) {
                  modalsContainer = wrapper.append('<div data-gjs-type="modals-container"></div>')[0];
                }

                // 确保 modals-container 默认隐藏（inline display:none 兜底）
                setModalContainerOverlay(modalsContainer, false);

                // --- 方案A：处理 wrapper 层级的孤儿组件 ---
                const orphans: unknown[] = [];
                wrapper.components().each((comp: unknown) => {
                  const c = comp as { getType: () => string };
                  if (c.getType() === 'textnode') return;
                  if (c === pageContent || c === modalsContainer) return;
                  const parent = (c as unknown as { parent: () => { getType: () => string } | null }).parent();
                  const pType = parent?.getType() || '';
                  if (pType === 'page-content' || pType === 'modals-container') return;
                  orphans.push(comp);
                });
                orphans.forEach((comp) => {
                  try {
                    if (isModalComponent(comp)) {
                      (modalsContainer as unknown as { append: (c: unknown) => void }).append(comp);
                    } else {
                      (pageContent as unknown as { append: (c: unknown) => void }).append(comp);
                    }
                  } catch {
                    // 忽略移动失败
                  }
                });

                // --- 方案B：扫描 page-content 内部误放入的弹窗组件 ---
                // （拖拽 block 后组件落在 page-content 内，而非 wrapper 层级，需额外扫描）
                const misplacedModals: unknown[] = [];
                if (pageContent && typeof (pageContent as unknown as { components: () => { each: (cb: (c: unknown) => void) => void } }).components === 'function') {
                  try {
                    (pageContent as unknown as { components: () => { each: (cb: (c: unknown) => void) => void } }).components().each((comp: unknown) => {
                      if (isModalComponent(comp)) {
                        misplacedModals.push(comp);
                      }
                    });
                  } catch { /* 忽略 */ }
                }
                let hasMovedModal = false;
                misplacedModals.forEach((comp) => {
                  try {
                    (modalsContainer as unknown as { append: (c: unknown) => void }).append(comp);
                    hasMovedModal = true;
                  } catch { /* 忽略 */ }
                });

                // --- 方案C：扫描 modals-container 内部误放入的非弹窗组件 ---
                const misplacedNonModals: unknown[] = [];
                if (modalsContainer && typeof (modalsContainer as unknown as { components: () => { each: (cb: (c: unknown) => void) => void } }).components === 'function') {
                  try {
                    (modalsContainer as unknown as { components: () => { each: (cb: (c: unknown) => void) => void } }).components().each((comp: unknown) => {
                      const c2 = comp as { getType: () => string };
                      if (!isModalComponent(comp) && c2.getType() !== 'textnode') {
                        misplacedNonModals.push(comp);
                      }
                    });
                  } catch { /* 忽略 */ }
                }
                misplacedNonModals.forEach((comp) => {
                  try {
                    (pageContent as unknown as { append: (c: unknown) => void }).append(comp);
                  } catch { /* 忽略 */ }
                });

                refreshModalList(editor);
              } catch (e) {
                console.error('buildDualRegion 失败:', e);
              }
            };

            // 延迟构建双区域（等编辑器完全加载）
            setTimeout(buildDualRegion, 100);

            // ========== Modal 事件处理 ==========
            // 标记位：跳过因 append 内部 remove+add 触发的二次 component:add
            const movingModals = new WeakSet<object>();

            /**
             * 核心处理逻辑：将弹窗组件移到 modals-container 并切换到编辑模式
             * 被 component:add（同步/延迟）和 block:drag:stop 共同调用
             */
            const processModalComponent = (comp: { getId: () => string; getType: () => string; getAttributes: () => Record<string, string>; parent: () => { getType: () => string; getAttributes?: () => Record<string, string> } | null }) => {
              // 跳过因 append 触发的二次事件
              if (movingModals.has(comp as unknown as object)) {
                movingModals.delete(comp as unknown as object);
                return;
              }

              const wrapper = editor.getWrapper();
              if (!wrapper) return;

              // 为新拖入的弹窗生成唯一名称（序号递增）
              modalCounterRef.current += 1;
              const newModalName = `新弹窗${modalCounterRef.current}`;
              if (typeof (comp as unknown as { addAttributes: (a: Record<string, string>) => void }).addAttributes === 'function') {
                try {
                  (comp as unknown as { addAttributes: (a: Record<string, string>) => void }).addAttributes({ 'data-modal-name': newModalName });
                } catch { /* 忽略 */ }
              }

              // 使用 findContainerByType 查找（getType + data-gjs-type + data-schema-type 三重检测）
              const modalsContainer = findContainerByType(wrapper, 'modals-container');

              if (modalsContainer) {
                // 检查父级是否已经是 modals-container
                const parent = comp.parent();
                const pType = parent?.getType() || '';
                const pAttrs = parent ? (parent.getAttributes?.() || {}) : {};
                if (pType === 'modals-container' || pAttrs['data-gjs-type'] === 'modals-container' || pAttrs['data-schema-type'] === 'modals-container') {
                  refreshModalList(editor);
                  return;
                }
                // 标记组件，防止 append 内部 remove→add 触发递归
                movingModals.add(comp as unknown as object);
                (modalsContainer as unknown as { append: (c: unknown) => void }).append(comp);
                // 确保新拖入的弹窗在 modals-container 中初始可见且居中
                trySetCompVisible(comp, true);
                addModalEditPositionStyles(comp);
                // 延迟切换弹窗编辑模式（等 DOM 渲染就绪，样式才能生效）
                // 注意：如果用户在此之前已经手动退出弹窗编辑模式，则不进入
                const toggleId = comp.getId();
                if (toggleId) {
                  setTimeout(() => {
                    if (userExitedModalEditingRef.current) {
                      return;
                    }
                    toggleModalEditing(toggleId);
                  }, 300);
                }
                refreshModalList(editor);
              } else {
                // modals-container 不存在，先重建
                buildDualRegion();
                const newContainer = findContainerByType(wrapper, 'modals-container');
                if (newContainer) {
                  movingModals.add(comp as unknown as object);
                  (newContainer as unknown as { append: (c: unknown) => void }).append(comp);
                  // 确保新拖入的弹窗可见且居中
                  trySetCompVisible(comp, true);
                  addModalEditPositionStyles(comp);
                  // 延迟切换弹窗编辑模式（等 DOM 渲染就绪）
                  // 注意：如果用户在此之前已经手动退出弹窗编辑模式，则不进入
                  const toggleId = comp.getId();
                  console.log(`[processModal] (no container) scheduling toggleModalEditing for id=${toggleId} in 300ms`);
                  if (toggleId) {
                    setTimeout(() => {
                      console.log(`[processModal] (no container) 300ms elapsed, calling toggleModalEditing(${toggleId})`);
                      if (userExitedModalEditingRef.current) {
                        return;
                      }
                      toggleModalEditing(toggleId);
                    }, 300);
                  }
                }
                refreshModalList(editor);
              }
            };

            // 监听新增组件（拖入 modal block 时自动移到 modals-container）
            editor.on('component:add', (comp: { getId: () => string; getType: () => string; getAttributes: () => Record<string, string> }) => {
              try {
                const compId = typeof comp.getId === 'function' ? comp.getId() : '?';
                const compType = typeof comp.getType === 'function' ? comp.getType() : '?';
                const compAttrs = typeof comp.getAttributes === 'function' ? comp.getAttributes() : {};
                console.log(`[DEBUG] component:add id=${compId} type=${compType} attrs=${JSON.stringify(compAttrs)}`);

                // 第一路：同步检测（getType/getAttributes/toHtml 正常工作时走这路）
                if (isModalComponent(comp)) {
                  processModalComponent(comp as Parameters<typeof processModalComponent>[0]);
                  return;
                }
                // 第二路：延迟检测（Studio SDK 在 component:add 时可能尚未完成组件初始化）
                // 仅对非 textnode 的组件做延迟检测，减少无谓的定时器
                if (typeof comp.getType === 'function' && comp.getType() !== 'textnode') {
                  setTimeout(() => {
                    try {
                      if (isModalComponent(comp)) {
                        processModalComponent(comp as Parameters<typeof processModalComponent>[0]);
                      }
                    } catch (e) {
                      console.error('deferred modal check:', e);
                    }
                  }, 50);
                }
              } catch (e) {
                console.error('component:add handler error:', e);
              }
            });

            // 第三路：block:drag:stop 延迟扫描 modals-container（备选方案）
            // Studio SDK 可能不触发此事件，保留作为 fallback
            // 注意：此 handler 的延迟（500ms）在 processModalComponent 的 toggle 延迟（300ms）之后，
            // 而 buildDualRegion() 会隐藏 modals-container，必须在后面重新应用遮罩样式
            editor.on('block:drag:stop', () => {
              setTimeout(() => {
                try {
                  buildDualRegion();
                  const wrapper2 = editor.getWrapper();
                  if (!wrapper2) return;
                  const container2 = findContainerByType(wrapper2, 'modals-container');
                  if (!container2) return;
                  const comps2 = tryGetComponents(container2);
                  if (!comps2) return;
                  let newModalId2: string | null = null;
                  comps2.each((c: unknown) => {
                    const m = c as { getId: () => string; getType: () => string };
                    if (m.getType() === 'textnode') return;
                    newModalId2 = m.getId();
                  });
                  // buildDualRegion 通过 setModalContainerOverlay(..., false) 隐藏了
                  // modals-container。如果当前已处于弹窗编辑模式，需重新应用遮罩样式。
                  if (activeModalIdRef.current) {
                    setModalContainerOverlay(container2, true);
                  }
                  // 如果用户已手动退出弹窗编辑模式，不再自动恢复
                  if (newModalId2 && newModalId2 !== activeModalIdRef.current && !userExitedModalEditingRef.current) {
                    toggleModalEditing(newModalId2);
                  }
                } catch (e) {
                  console.error('block:drag:stop sweep:', e);
                }
              }, 500);
            });

            // 监听弹窗删除：刷新列表 + 若当前编辑的弹窗被删则退出编辑模式
            editor.on('component:remove', (comp: { getId: () => string; getType: () => string; getAttributes: () => Record<string, string> }) => {
              try {
                if (!isModalComponent(comp)) return;
                refreshModalList(editor);
                if (comp.getId() === activeModalIdRef.current) {
                  toggleModalEditing(null);
                }
              } catch {
                // 忽略
              }
            });

            // 记录初始 components 用于变更检测
            try {
              const initData = editor.getProjectData();
              lastSavedComponentsRef.current = JSON.stringify(initData);
            } catch {
              // 忽略
            }

            /** 变更时标记为未保存并启动 30s 防抖自动保存 */
            const markUnsaved = () => {
              if (saveStatusRef.current === "saving") return;

              saveStatusRef.current = "unsaved";
              setSaveStatus("unsaved");

              if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
              }
              autoSaveTimerRef.current = setTimeout(async () => {
                // 差异检测：比对当前数据与上次保存的数据
                try {
                  const currentData = editor.getProjectData();
                  const currentStr = JSON.stringify(currentData);
                  if (currentStr === lastSavedComponentsRef.current) {
                    saveStatusRef.current = "saved";
                    setSaveStatus("saved");
                    return; // 无变更，不触发保存
                  }
                } catch {
                  // 比对失败仍尝试保存
                }

                saveStatusRef.current = "auto-saving";
                setSaveStatus("auto-saving");
                try {
                  await editor.store();
                  lastSavedComponentsRef.current = JSON.stringify(
                    editor.getProjectData(),
                  );
                  saveStatusRef.current = "saved";
                  setSaveStatus("saved");
                } catch {
                  saveStatusRef.current = "unsaved";
                  setSaveStatus("unsaved");
                }
              }, 30000);
            };

            // 监听组件变更事件
            editor.on("component:update", markUnsaved);
            editor.on("component:add", markUnsaved);
            editor.on("component:remove", markUnsaved);
            editor.on("style:update", markUnsaved);
            editor.on("block:drag:stop", markUnsaved);

            // ========== 弹窗内绝对定位坐标转换（视口 → 弹窗相对） ==========
            //
            // canvasAbsoluteMode 插件使用 getElBoxRect()（视口空间）计算拖拽位置，
            // 然后通过 addStyle() 将 left/top 设置为 CSS 值。对于弹窗内部的绝对定位
            // 子元素，其包含块是弹窗自身（弹窗有 position:absolute），而弹窗居中展示
            // 时不位于视口原点，导致插件产生的视口坐标与 CSS 包含块坐标系不一致。
            //
            // 关键问题：
            // 1. 拖拽中用 addStyle({partial:true}) → component:update 不触发
            // 2. 弹窗有 transform:translate(-50%,-50%) → getBoundingClientRect
            //    返回 post-transform 位置 ≠ 包含块原点（pre-transform 位置）
            //
            // 解决：
            // - 拖拽中：用 requestAnimationFrame 循环直接操作 DOM inline style
            // - 松手时：component:update 通过模型 addStyle 完成最终保存
            // - 包含块原点计算：用 offsetLeft/offsetTop（pre-transform 位置）
            //   而非 getBoundingClientRect（post-transform 位置）
            // ------------------------------------------------------------------
            let isAbsoluteDragging = false;
            let modalRafId: number | null = null;

            // 辅助函数：向上查找弹窗父组件
            const findModalParent = (comp: unknown): unknown | null => {
              try {
                let current = (comp as { parent?: () => unknown }).parent?.();
                while (current) {
                  const c = current as { getType?: () => string };
                  if (typeof c.getType === 'function' && c.getType() === 'modal') {
                    return current;
                  }
                  current = (current as { parent?: () => unknown }).parent?.();
                }
              } catch {
                // 忽略
              }
              return null;
            };

            // 辅助函数：计算弹窗包含块原点在视口空间中的位置
            //
            // 弹窗有 transform:translate(-50%,-50%) 时，getBoundingClientRect()
            // 返回的是 post-transform 位置（视觉居中位置），但 CSS left/top
            // 是相对于 pre-transform 位置（布局位置）。offsetLeft/offsetTop
            // 返回 pre-transform 位置，加上 offsetParent 的视口偏移即为原点。
            const getContainingBlockOrigin = (
              modalEl: HTMLElement,
            ): { left: number; top: number } => {
              const offsetParent = modalEl.offsetParent as HTMLElement | null;
              const parentLeft = offsetParent
                ? offsetParent.getBoundingClientRect().left
                : 0;
              const parentTop = offsetParent
                ? offsetParent.getBoundingClientRect().top
                : 0;
              return {
                left: parentLeft + modalEl.offsetLeft,
                top: parentTop + modalEl.offsetTop,
              };
            };

            // 直接在 DOM 上转换 inline style（不通过模型，用于拖拽过程中的实时转换）
            const convertDOMCoords = (componentEl: HTMLElement, modalEl: HTMLElement) => {
              const left = componentEl.style.left;
              const top = componentEl.style.top;
              if (!left && !top) return;
              const origin = getContainingBlockOrigin(modalEl);
              if (left) {
                componentEl.style.left = `${parseFloat(left) - origin.left}px`;
              }
              if (top) {
                componentEl.style.top = `${parseFloat(top) - origin.top}px`;
              }
            };

            // 通过模型 addStyle 转换坐标（用于最终保存的 component:update）
            const adjustModalChildCoord = (component: unknown) => {
              try {
                const c = component as {
                  getStyle?: () => Record<string, string>;
                  addStyle?: (s: Record<string, string>, opts?: { partial?: boolean }) => void;
                  getEl?: () => HTMLElement | null;
                };
                if (typeof c.getStyle !== 'function') return;

                const style = c.getStyle();
                if (!style || style.position !== 'absolute') return;
                if (style.left === undefined && style.top === undefined) return;

                const modal = findModalParent(component);
                if (!modal) return;

                const modalComp = modal as { getEl?: () => HTMLElement | null };
                if (typeof modalComp.getEl !== 'function') return;
                const modalEl = modalComp.getEl();
                if (!modalEl) return;

                const origin = getContainingBlockOrigin(modalEl);
                // 弹窗在视口原点，无需转换
                if (origin.left < 1 && origin.top < 1) return;

                // 避免递归（我们的 addStyle 会再次触发 component:update）
                if ((component as Record<string, unknown>).__adjustingCoords) return;
                (component as Record<string, unknown>).__adjustingCoords = true;

                const newStyle: Record<string, string> = {};
                if (style.left !== undefined) {
                  newStyle.left = `${parseFloat(style.left) - origin.left}px`;
                }
                if (style.top !== undefined) {
                  newStyle.top = `${parseFloat(style.top) - origin.top}px`;
                }

                if (typeof c.addStyle === 'function') {
                  try {
                    c.addStyle(newStyle, { partial: true });
                  } catch {
                    // 忽略 addStyle 异常
                  }
                }

                // 直接也在 DOM 上同步，防止下一次 dmode:move 读错
                if (typeof c.getEl === 'function') {
                  const el = c.getEl();
                  if (el) {
                    el.style.left = newStyle.left ?? el.style.left;
                    el.style.top = newStyle.top ?? el.style.top;
                  }
                }

                delete (component as Record<string, unknown>).__adjustingCoords;
              } catch {
                // 忽略
              }
            };

            // ---------- 拖拽生命周期管理 ----------
            //
            // 策略：插件用 addStyle({partial:true}) 更新模型 style 和 DOM style，
            // 但 partial addStyle 不触发 component:update。我们用 rAF 循环在每帧
            // 渲染前直接修正 DOM style。
            //
            // 插件内部 __lastSnappedPosition 始终为视口坐标（不受我们的 DOM 修改影响），
            // 所以下一帧插件继续在视口空间计算，而我们再把结果转为弹窗相对坐标。
            editor.on('dmode:start', () => {
              isAbsoluteDragging = true;

              // 启动 rAF 循环，在每帧渲染前将 DOM inline style 转为弹窗相对坐标
              const startConvertLoop = () => {
                if (!isAbsoluteDragging) return;
                // 获取当前拖拽的组件
                const sel = editor.getSelected();
                if (sel) {
                  const modal = findModalParent(sel);
                  if (modal) {
                    const modalEl = (modal as { getEl?: () => HTMLElement | null }).getEl?.();
                    const el = (sel as { getEl?: () => HTMLElement | null }).getEl?.();
                    if (modalEl && el) {
                      convertDOMCoords(el, modalEl);
                    }
                  }
                }
                modalRafId = requestAnimationFrame(startConvertLoop);
              };
              modalRafId = requestAnimationFrame(startConvertLoop);
            });

            // dmode:end 时插件可能还有一次 final addStyle（pe 函数），保留
            // isAbsoluteDragging 直到下次 rAF 将 final 位置也转换完。
            editor.on('dmode:end', () => {
              // 等一次 rAF 确保 final addStyle 后的 DOM 也被转换，然后停止循环
              const finalize = () => {
                const sel = editor.getSelected();
                if (sel) {
                  const modal = findModalParent(sel);
                  if (modal) {
                    const modalEl = (modal as { getEl?: () => HTMLElement | null }).getEl?.();
                    const el = (sel as { getEl?: () => HTMLElement | null }).getEl?.();
                    if (modalEl && el) {
                      convertDOMCoords(el, modalEl);
                    }
                  }
                }
                isAbsoluteDragging = false;
                if (modalRafId !== null) {
                  cancelAnimationFrame(modalRafId);
                  modalRafId = null;
                }
              };
              requestAnimationFrame(finalize);
            });

            // component:update 用于松手时插件非 partial addStyle 后的最终保存
            editor.on('component:update', (component: unknown) => {
              if (!isAbsoluteDragging) return;
              adjustModalChildCoord(component);
            });

            // 翻译顶部工具栏设备类型名称（SDK 使用 getName() 而非 i18n）
            const locale = getEffectiveLocale();
            const deviceNames: Record<string, string> = {
              desktop: "桌面端",
              tablet: "平板",
              mobile: "手机竖屏",
              mobilePortrait: "移动端竖屏",
              mobileLandscape: "移动端横屏",
            };
            if (locale === "zh-CN") {
              const devices = editor.Devices.getDevices();
              devices.forEach((device) => {
                const id = device.get("id") as string;
                if (deviceNames[id]) {
                  device.set("name", deviceNames[id]);
                }
              });
            }
            // 覆盖 SDK 硬编码的左侧边栏按钮提示（根据当前语言使用对应翻译）
            const sidebarTooltips: Record<string, string> = {
              Blocks: getEffectiveLocale() === "zh-CN" ? "组件" : "Blocks",
              "Pages & Layers":
                getEffectiveLocale() === "zh-CN"
                  ? "页面和图层"
                  : "Pages & Layers",
              "Page Settings":
                getEffectiveLocale() === "zh-CN" ? "页面设置" : "Page Settings",
              "Custom Component":
                getEffectiveLocale() === "zh-CN"
                  ? "自定义组件"
                  : "Custom Component",
            };
            const tooltipObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                  if (node instanceof HTMLElement && node.textContent) {
                    const text = node.textContent.trim();
                    const replacement = sidebarTooltips[text];
                    if (replacement) {
                      node.textContent = replacement;
                    }
                  }
                }
              }
            });
            // 等编辑器完全加载后，开始监控 body 中的 tooltip 变更
            setTimeout(() => {
              tooltipObserver.observe(document.body, {
                childList: true,
                subtree: true,
              });
            }, 1000);

            if (isNewPageRef.current) {
              isNewPageRef.current = false;
              // 延迟一会等编辑器完全渲染后再弹出，避免 UI 闪烁
              setTimeout(() => {
                editor.runCommand("studio:layoutToggle", {
                  id: "templates-panel",
                  header: false,
                  placer: {
                    type: "dialog",
                    title: "选择一个模板开始",
                    size: "l",
                  },
                  layout: {
                    type: "panelTemplates",
                    content: { itemsPerRow: 2 },
                    onSelect: ({
                      loadTemplate,
                      template,
                    }: {
                      loadTemplate: (t: unknown) => void;
                      template: unknown;
                    }) => {
                      loadTemplate(template);
                      editor.runCommand("studio:layoutRemove", {
                        id: "templates-panel",
                      });
                    },
                  },
                });
              }, 300);
            }
          },
          /** 自定义布局：工具栏加返回/模板/主题/SEO/发布按钮 */
          layout: {
            default: {
              type: "row",
              style: { height: "100%" },
              children: [
                { type: "sidebarLeft" },
                {
                  type: "canvasSidebarTop",
                  sidebarTop: {
                    leftContainer: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      buttons: ({ items }: any) => items,
                    },
                    rightContainer: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      buttons: ({ items }: any) => [
                        {
                          id: "templates",
                          icon: "viewGridPlus",
                          tooltip: "从模板创建页面",
                          onClick: ({ editor }: { editor: Editor }) => {
                            editor.runCommand("studio:layoutToggle", {
                              id: "templates-panel",
                              header: false,
                              placer: {
                                type: "dialog",
                                title: "选择一个模板",
                                size: "l",
                              },
                              layout: {
                                type: "panelTemplates",
                                content: { itemsPerRow: 2 },
                                onSelect: ({
                                  loadTemplate,
                                  template,
                                }: {
                                  loadTemplate: (t: unknown) => void;
                                  template: unknown;
                                }) => {
                                  loadTemplate(template);
                                  editor.runCommand("studio:layoutRemove", {
                                    id: "templates-panel",
                                  });
                                },
                              },
                            });
                          },
                        },
                        {
                          id: "seo",
                          icon: "cog",
                          tooltip: "SEO 页面设置",
                          onClick: () => handleOpenSEO(),
                        },
                        {
                          id: "versions",
                          icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
                          tooltip: "版本历史",
                          onClick: () => navigate(`/versions/${id}`),
                        },
                        {
                          id: "themeToggle",
                          icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${
                            themeMode === "dark"
                              ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'
                              : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
                          }</svg>`,
                          tooltip:
                            themeMode === "dark"
                              ? "切换亮色主题"
                              : "切换暗色主题",
                          onClick: () => dispatch(toggleTheme()),
                        },
                        {
                          id: "locale",
                          icon: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
                          tooltip: "多语言管理",
                          onClick: () => setTranslationPanelOpen(true),
                        },
                        ...items,
                      ],
                    },
                  },
                },
                {
                  type: "sidebarRight",
                  children: {
                    type: "tabs",
                    value: "styles",
                    tabs: [
                      {
                        id: "styles",
                        label: "样式",
                        children: [
                          { type: "panelSelectors" },
                          { type: "panelStyles" },
                        ],
                      },
                      {
                        id: "props",
                        label: "属性",
                        children: { type: "panelProperties" },
                      },
                      {
                        id: "events",
                        label: "事件",
                        children: {
                          type: "custom",
                          component: EventBindingTabContent,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        }}
      />

      {/* SEO 设置弹窗 */}
      <Modal
        title="SEO 设置"
        open={seoModalOpen}
        onOk={handleSaveSEO}
        onCancel={() => setSeoModalOpen(false)}
        okText="保存"
        cancelText="取消"
        getContainer={document.body}
      >
        <Form form={seoForm} layout="vertical">
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: "请输入页面标题" }]}
          >
            <Input placeholder="页面标题，将显示在浏览器标签和搜索结果中" />
          </Form.Item>
          <Form.Item name="description" label="SEO 描述">
            <Input.TextArea
              rows={3}
              placeholder="搜索摘要，选填"
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item name="keywords" label="SEO 关键词">
            <Select
              mode="tags"
              placeholder="输入关键词后按回车添加"
              open={false}
            />
          </Form.Item>
          <Form.Item name="ogImage" label="社交分享图片 (OG Image)">
            <Input placeholder="图片 URL 或粘贴上传后复制链接" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 多语言管理面板 */}
      <TranslationPanel
        open={translationPanelOpen}
        pageId={id ? parseInt(id, 10) : 0}
        currentLocale={pageDataRef.current?.locale || "zh-CN"}
        onClose={() => setTranslationPanelOpen(false)}
      />

      {/* 保存为模板弹窗 */}
      <Modal
        title="保存为模板"
        open={templateModalOpen}
        onOk={handleSaveTemplate}
        onCancel={() => { setTemplateModalOpen(false); templateForm.resetFields(); }}
        confirmLoading={templateSaving}
        okText="保存模板"
        cancelText="取消"
        getContainer={document.body}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: "请输入模板名称" }]}
          >
            <Input placeholder="例如：营销落地页模板" />
          </Form.Item>
          <Form.Item name="category" label="模板分类">
            <Select placeholder="选择分类（选填）" allowClear>
              <Select.Option value="营销">营销</Select.Option>
              <Select.Option value="企业">企业</Select.Option>
              <Select.Option value="产品">产品</Select.Option>
              <Select.Option value="个人">个人</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="模板描述">
            <Input.TextArea rows={3} placeholder="简短描述此模板的用途（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      </div>
    </div>
  );
};

export default PageEditor;
