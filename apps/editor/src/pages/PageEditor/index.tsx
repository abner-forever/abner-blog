import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton, message, Modal, Form, Input, Select, Tooltip, Tag, Button } from "antd";
import { GlobalOutlined, RocketOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { toPng } from "html-to-image";
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

  /** 截取页面封面并上传 */
  const captureCover = useCallback(
    async (html: string): Promise<string | null> => {
      // 使用 iframe 在完整文档上下文中渲染页面，确保 CSS 选择器（body、html）和视口单位正确生效
      const iframe = document.createElement("iframe");
      Object.assign(iframe.style, {
        position: "fixed",
        top: "-9999px",
        left: "0",
        width: "1280px",
        height: "720px",
        border: "none",
      });
      document.body.appendChild(iframe);

      try {
        const doc = iframe.contentDocument;
        if (!doc) throw new Error("iframe 文档不可访问");

        doc.open();
        doc.write(html);
        doc.close();

        // 调试：检查 HTML 结构和 iframe 渲染状态
        console.log("[captureCover] iframe readyState:", doc.readyState);
        console.log("[captureCover] body child count:", doc.body?.childNodes.length);
        console.log("[captureCover] body HTML preview:", doc.body?.innerHTML.slice(0, 500));

        // 等待 iframe 内容解析完成（DOMContentLoaded 在 doc.write() 后仍会触发）
        await new Promise<void>((resolve) => {
          if (
            doc.readyState === "complete" ||
            doc.readyState === "interactive"
          ) {
            resolve();
          } else {
            doc.addEventListener(
              "DOMContentLoaded",
              () => resolve(),
              { once: true },
            );
            setTimeout(resolve, 5000); // 安全超时
          }
        });

        // 额外等待资源加载（图片被转 data URL 后不需要，字体等足够加载）
        await new Promise((r) => setTimeout(r, 500));

        // 将外部图片转为 data URL 避免 canvas 跨域污染
        const images = doc.querySelectorAll("img");
        const imagePromises = Array.from(images).map(async (img) => {
          if (img.src.startsWith("data:")) return;
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(img.src, {
              mode: "cors",
              credentials: "omit",
              signal: controller.signal,
            });
            clearTimeout(timeout);
            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch {
            // 转换失败则保留原 src（可能空白但不会污染整个 canvas）
          }
        });
        await Promise.allSettled(imagePromises);

        // 等待渲染稳定（字体、布局等）
        await new Promise((r) => setTimeout(r, 1000));

        // 截取 iframe 中的 body 内容
        if (!doc.body) {
          console.warn("[captureCover] iframe body 为空");
          throw new Error("iframe body 不可用");
        }

        console.log("[captureCover] 开始截图，body 高度:", doc.body.scrollHeight);

        const dataUrl = await toPng(doc.body, {
          width: 1280,
          height: 720,
          backgroundColor: "#fff",
          filter: (node) => {
            if (
              node.tagName === "SCRIPT" ||
              node.tagName === "NOSCRIPT"
            )
              return false;
            return true;
          },
        });

        console.log("[captureCover] toPng 成功, dataUrl 长度:", dataUrl.length);

        // 调试：检查截图是否真的有内容（取左上角像素颜色）
        const debugImg = new Image();
        debugImg.src = dataUrl;
        await new Promise<void>((resolve) => {
          debugImg.onload = () => {
            const testCanvas = document.createElement("canvas");
            testCanvas.width = 10;
            testCanvas.height = 10;
            const ctx = testCanvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(debugImg, 0, 0, 10, 10);
              const pixel = ctx.getImageData(4, 4, 1, 1).data;
              console.log(
                "[captureCover] 截图中心像素 RGBA:",
                pixel[0], pixel[1], pixel[2], pixel[3],
              );
            }
            resolve();
          };
          debugImg.onerror = () => {
            console.warn("[captureCover] 无法加载截图做像素检测");
            resolve();
          };
        });

        // 上传截图
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "cover.png", { type: "image/png" });
        const result = await uploadPageImage(file);
        return result.url;
      } catch (err) {
        console.warn("封面截取失败:", err);
        return null;
      } finally {
        document.body.removeChild(iframe);
      }
    },
    [],
  );

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
            const projectData = editor.getProjectData();
            const files = (await editor.runCommand("studio:projectFiles", {
              styles: "inline",
            })) as Array<{ mimeType: string; content: string }>;
            const htmlFile = files.find(
              (f) => f.mimeType === "text/html",
            );

            // 确保输出 HTML 包含 viewport meta（移动端响应式适配）
            let htmlContent = htmlFile?.content || "";
            if (htmlContent && !htmlContent.includes('name="viewport"')) {
              htmlContent = htmlContent.replace(
                /<head>/i,
                '<head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
              );
            }

            // 自动截取封面
            const coverUrl = await captureCover(htmlContent);

            await pageApi.publish(parseInt(id, 10), {
              html: htmlContent,
              css: "",
              components: JSON.stringify(projectData),
              ...(coverUrl ? { cover: coverUrl } : {}),
            });

            if (coverUrl) {
              message.success("发布成功（封面已自动生成）");
            } else {
              message.success("发布成功");
            }
          } catch {
            message.error("发布失败");
          }
        },
      });
    },
    [id, captureCover],
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
              if (page?.components) {
                try {
                  const json = JSON.parse(page.components);
                  if (json?.pages) {
                    // 记录初始组件数据用于变更检测
                    lastSavedComponentsRef.current = page.components;
                    return { project: json };
                  }
                } catch {
                  // 旧格式，回退到 HTML
                }
              }
              // 新建页面，标记为可显示模板选择器
              isNewPageRef.current = true;
              return {
                project: {
                  pages: [
                    {
                      name: page?.title || "Page",
                      component:
                        page?.html || "<h1>Empty page</h1>",
                    },
                  ],
                },
              };
            },
            onSave: async ({ project }) => {
              if (!id) return;
              await pageApi.update(parseInt(id, 10), {
                components: JSON.stringify(project),
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
          plugins: [
            canvasAbsoluteMode.init({
              globalAbsolute: false,
              enableAbsolute: ({ component }: { component: { getEl: () => HTMLElement | null } }) => {
                const cmpEl = component.getEl();
                if (
                  !cmpEl ||
                  getComputedStyle(cmpEl).position !== "absolute"
                ) {
                  return false;
                }
                // 自动确保父元素有 position: relative 作为定位锚点
                // 否则绝对定位元素以视口为参考，拖拽坐标会乱
                try {
                  const parent = component.parent();
                  if (parent) {
                    const parentStyle = parent.getStyle
                      ? parent.getStyle()
                      : {};
                    const parentPos = parentStyle.position;
                    const hasPosition =
                      parentPos &&
                      parentPos !== "" &&
                      parentPos !== "static";
                    if (!hasPosition) {
                      parent.addStyle({ position: "relative" });
                    }
                  }
                } catch {
                  // 忽略父元素处理异常
                }
                return true;
              },
              snapping: { x: 10, y: 10 },
            }),
          ],
          /** 编辑器就绪后：自动保存 + 新建页面模板选择器 */
          onReady: (editor: Editor) => {
            editorRef.current = editor;

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
                      buttons: ({ items }: any) => [
                        {
                          id: "back",
                          icon: "chevronLeft",
                          tooltip: "返回页面列表",
                          onClick: () => navigate("/"),
                        },
                        ...items,
                      ],
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
                { type: "sidebarRight" },
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
