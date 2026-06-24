/**
 * SchemaPreview — Schema 预览与编辑面板
 *
 * 位于编辑器底部，支持两种模式：
 * 1. 渲染模式：使用 packages/page-schema 的渲染引擎实时预览
 * 2. JSON 编辑模式：可查看和编辑原始 Schema JSON，修改后可同步回编辑器画布
 *
 * 数据流：
 * 编辑器变化 → editor.getProjectData()
 *   → schemaConverter
 *   → PageSchema JSON
 *   → RendererProvider + PageRenderer（渲染预览）
 *
 * JSON 编辑模式：
 * 编辑 JSON → 点击应用 → 重建 GrapesJS 画布
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Drawer, Segmented, Space, Tooltip, Badge, message } from 'antd';
import {
  EyeOutlined,
  CodeOutlined,
  CloseOutlined,
  ExpandOutlined,
  CompressOutlined,
  CheckOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { Editor } from 'grapesjs';
import {
  RendererProvider,
  PageRenderer,
  ModalProvider,
  ModalPortals,
  styleInjector,
} from '@abner-blog/page-schema';
import type { PageSchema, ModalApi } from '@abner-blog/page-schema';
import { buildPageSchema } from '@/utils/schemaConverter';

interface SchemaPreviewProps {
  editorRef: React.MutableRefObject<Editor | null>;
}

type PreviewTab = 'render' | 'json';

const SchemaPreview: React.FC<SchemaPreviewProps> = ({ editorRef }) => {
  const [open, setOpen] = useState(false);
  const [schema, setSchema] = useState<PageSchema | null>(null);
  const [tab, setTab] = useState<PreviewTab>('render');
  const [fullscreen, setFullscreen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schemaRef = useRef<PageSchema | null>(null);
  const savedJsonRef = useRef<string>('');

  /** 更新 Schema：从编辑器实时转换 */
  const updateSchema = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const newSchema = buildPageSchema(editor);
      schemaRef.current = newSchema;
      setSchema({ ...newSchema });
      const jsonStr = JSON.stringify(
        { root: newSchema.root, css: newSchema.css, meta: newSchema.meta },
        null,
        2,
      );
      setJsonText(jsonStr);
      savedJsonRef.current = jsonStr;
    } catch {
      // 编辑器尚未就绪时忽略
    }
  }, [editorRef]);

  /** 当切换到 JSON 标签时同步更新 JSON 文本 */
  useEffect(() => {
    if (tab === 'json' && !dirty && schema) {
      const jsonStr = JSON.stringify(
        { root: schema.root, css: schema.css, meta: schema.meta },
        null,
        2,
      );
      setJsonText(jsonStr);
      savedJsonRef.current = jsonStr;
    }
  }, [tab, schema, dirty]);

  /** 打开预览面板时立即刷新一次 */
  const handleOpen = useCallback(() => {
    setOpen(true);
    setTimeout(() => updateSchema(), 50);
  }, [updateSchema]);

  /** 关闭预览面板 */
  const handleClose = useCallback(() => {
    setOpen(false);
    setDirty(false);
    setJsonError(null);
  }, []);

  /** 监听编辑器变化 → 防抖更新 Schema */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !open) return;

    const onUpdate = () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        // 仅在渲染模式下自动更新
        if (tab === 'render') {
          updateSchema();
        }
      }, 300);
    };

    editor.on('component:update', onUpdate);
    editor.on('component:add', onUpdate);
    editor.on('component:remove', onUpdate);
    editor.on('style:update', onUpdate);
    editor.on('block:drag:stop', onUpdate);

    return () => {
      editor.off('component:update', onUpdate);
      editor.off('component:add', onUpdate);
      editor.off('component:remove', onUpdate);
      editor.off('style:update', onUpdate);
      editor.off('block:drag:stop', onUpdate);

      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [editorRef, open, updateSchema, tab]);

  /** JSON 文本变化处理 */
  const handleJsonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setJsonText(value);
      setDirty(value !== savedJsonRef.current);

      // 实时验证 JSON 格式
      if (value.trim()) {
        try {
          JSON.parse(value);
          setJsonError(null);
        } catch (err) {
          setJsonError(err instanceof Error ? err.message : 'JSON 格式错误');
        }
      } else {
        setJsonError('JSON 内容不能为空');
      }
    },
    [],
  );

  /** 格式化 JSON */
  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      savedJsonRef.current = formatted;
      setJsonError(null);
      setDirty(false);
      message.success('JSON 已格式化');
    } catch (err) {
      message.error('无法格式化：JSON 格式错误');
    }
  }, [jsonText]);

  /** 压缩 JSON */
  const handleCompress = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const compressed = JSON.stringify(parsed);
      setJsonText(compressed);
      savedJsonRef.current = compressed;
      setJsonError(null);
      setDirty(false);
      message.success('JSON 已压缩');
    } catch (err) {
      message.error('无法压缩：JSON 格式错误');
    }
  }, [jsonText]);

  /** 应用 JSON 修改到编辑器画布 */
  const handleApply = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      message.error('编辑器尚未初始化');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.root || !parsed.root.type) {
        message.error('JSON 缺少 root 节点');
        return;
      }

      // 将修改后的 schema 写回 GrapesJS
      // 通过重新加载编辑器内容来实现
      const schemaStr = JSON.stringify(parsed);
      editor.store();
      // 使用页面数据更新机制
      const projectData = editor.getProjectData();
      if (projectData) {
        // 标记 editorData 以触发画布更新
        projectData.editorSchemaUpdate = schemaStr;
        editor.loadProjectData(projectData);
        message.success('Schema 已应用');
      }

      savedJsonRef.current = jsonText;
      setDirty(false);
      setSchema(parsed);
    } catch (err) {
      message.error('应用失败：' + (err instanceof Error ? err.message : '未知错误'));
    }
  }, [editorRef, jsonText]);

  /** 撤销修改（恢复到原始 Schema） */
  const handleRevert = useCallback(() => {
    setJsonText(savedJsonRef.current);
    setDirty(false);
    setJsonError(null);
    message.info('已撤销修改');
  }, []);

  /** 标签切换时重置 dirty 状态 */
  const handleTabChange = useCallback(
    (value: string | number) => {
      const newTab = value as PreviewTab;
      if (newTab === 'json') {
        // 切换到 JSON 模式时刷新文本
        if (schema) {
          const jsonStr = JSON.stringify(
            { root: schema.root, css: schema.css, meta: schema.meta },
            null,
            2,
          );
          setJsonText(jsonStr);
          savedJsonRef.current = jsonStr;
          setDirty(false);
        }
      }
      setTab(newTab);
    },
    [schema],
  );

  return (
    <>
      {/* 触发按钮 */}
      <Tooltip title="Schema 预览与编辑">
        <Button
          type={open ? 'primary' : 'default'}
          icon={<CodeOutlined />}
          onClick={handleOpen}
          size="small"
        >
          Schema
        </Button>
      </Tooltip>

      {/* 预览面板抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>📄 Schema</span>
            <Segmented
              size="small"
              options={[
                { label: '渲染', value: 'render' },
                { label: 'JSON 编辑', value: 'json' },
              ]}
              value={tab}
              onChange={handleTabChange}
            />
            {schema?.root && (
              <Badge
                count={countNodes(schema.root)}
                style={{ backgroundColor: '#2f81f7' }}
                showZero
                overflowCount={999}
                title="节点数"
              />
            )}
            {dirty && (
              <Badge count="未保存" style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </div>
        }
        open={open}
        onClose={handleClose}
        placement="bottom"
        size="default"
        styles={{
          body: {
            height: fullscreen ? '85vh' : '45vh',
            padding: 0,
            overflow: 'hidden',
            background: tab === 'render' ? '#f9f9f9' : '#1e1e1e',
          },
        }}
        extra={
          <Space>
            {tab === 'json' && (
              <>
                <Tooltip title="格式化">
                  <Button
                    size="small"
                    icon={<span style={{ fontSize: 14, fontWeight: 'bold' }}>{}⟶ </span>}
                    onClick={handleFormat}
                  />
                </Tooltip>
                <Tooltip title="压缩">
                  <Button
                    size="small"
                    icon={<CompressOutlined />}
                    onClick={handleCompress}
                  />
                </Tooltip>
                <Tooltip title="撤销">
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={handleRevert}
                    disabled={!dirty}
                  />
                </Tooltip>
                <Tooltip title="应用修改">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleApply}
                    disabled={!dirty || !!jsonError}
                  >
                    应用
                  </Button>
                </Tooltip>
              </>
            )}
            <Tooltip title={fullscreen ? '缩小' : '放大'}>
              <Button
                type="text"
                icon={fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setFullscreen(!fullscreen)}
              />
            </Tooltip>
            <Tooltip title="关闭">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
              />
            </Tooltip>
          </Space>
        }
      >
        {tab === 'render' ? (
          // 渲染模式：使用 PageRenderer 实时渲染
          schema ? (
            <div
              style={{
                height: '100%',
                overflow: 'auto',
                padding: 16,
              }}
            >
              <div
                style={{
                  maxWidth: 800,
                  margin: '0 auto',
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <ModalProvider schema={schema}>
                  {(_modalApi: ModalApi) => (
                    <RendererProvider
                      schema={schema}
                      extraMiddlewares={[styleInjector]}
                    >
                      <PageRenderer
                        schema={schema}
                        error={!schema?.root ? '页面内容为空' : null}
                      />
                      <ModalPortals />
                    </RendererProvider>
                  )}
                </ModalProvider>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#999',
                fontSize: 14,
              }}
            >
              暂无 Schema 数据
            </div>
          )
        ) : (
          // JSON 编辑模式
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* JSON 编辑区域 */}
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              spellCheck={false}
              style={{
                flex: 1,
                width: '100%',
                padding: '12px 16px',
                background: '#1e1e1e',
                color: '#d4d4d4',
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                border: 'none',
                outline: 'none',
                resize: 'none',
                tabSize: 2,
              }}
              placeholder="// 在此编辑 Schema JSON..."
            />

            {/* JSON 错误提示栏 */}
            {jsonError && (
              <div
                style={{
                  padding: '6px 16px',
                  background: '#2d1b1b',
                  color: '#ff6b6b',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  borderTop: '1px solid #3d2b2b',
                }}
              >
                ❌ {jsonError}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
};

/** 递归统计 SchemaNode 树中的节点数 */
function countNodes(node: { children?: Array<unknown> } | null): number {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child as { children?: Array<unknown> });
    }
  }
  return count;
}

export default SchemaPreview;
