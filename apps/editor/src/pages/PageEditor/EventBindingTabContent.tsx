/**
 * EventBindingTabContent — 右侧属性面板「事件」标签页
 *
 * 作为 GrapesJS Studio SDK 右侧 sidebarRight 中的一个自定义 tab，
 * 在选中组件时显示事件绑定配置 UI。
 *
 * 与 EventBindingPanel（Modal 版）共享大部分 UI 组件，
 * 区别在于：
 * - 内联渲染，无 Modal 遮罩
 * - 自动保存（500ms 防抖），无需手动点击保存
 * - 为侧边栏窄宽度做了 UI 紧凑适配
 */

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import {
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { Editor, Component } from 'grapesjs';
import type {
  EventBinding,
  EventAction,
  EventActionType,
} from '@abner-blog/page-schema';
import { getModalList } from '@/utils/schemaConverter';

const { Text } = Typography;
const { TextArea } = Input;

/** 编辑器 Context（向深层嵌套的 ActionConfigFields 传递 editor） */
const EditorContext = createContext<Editor | null>(null);

/** 监听编辑器弹窗列表变化的 hook */
function useModalList(editor: Editor | null): Array<{ label: string; id: string }> {
  const [list, setList] = useState<Array<{ label: string; id: string }>>([]);

  const refresh = useCallback(() => {
    if (!editor) { setList([]); return; }
    setList(getModalList(editor));
  }, [editor]);

  useEffect(() => {
    refresh();
    if (!editor) return;
    const onChange = () => refresh();
    editor.on('component:add', onChange);
    editor.on('component:remove', onChange);
    editor.on('component:update', onChange);
    return () => {
      editor.off('component:add', onChange);
      editor.off('component:remove', onChange);
      editor.off('component:update', onChange);
    };
  }, [editor, refresh]);

  return list;
}

/* ==================== 常量 ==================== */

const EVENT_TYPE_OPTIONS: { label: string; value: string; group: string }[] = [
  { label: '点击 (click)', value: 'click', group: '鼠标事件' },
  { label: '双击 (dblclick)', value: 'dblClick', group: '鼠标事件' },
  { label: '鼠标移入 (mouseEnter)', value: 'mouseEnter', group: '鼠标事件' },
  { label: '鼠标移出 (mouseLeave)', value: 'mouseLeave', group: '鼠标事件' },
  { label: '内容变化 (change)', value: 'change', group: '表单事件' },
  { label: '提交 (submit)', value: 'submit', group: '表单事件' },
  { label: '获得焦点 (focus)', value: 'focus', group: '表单事件' },
  { label: '失去焦点 (blur)', value: 'blur', group: '表单事件' },
  { label: '键盘按下 (keyDown)', value: 'keyDown', group: '键盘事件' },
  { label: '键盘弹起 (keyUp)', value: 'keyUp', group: '键盘事件' },
];

const ACTION_TYPE_OPTIONS: { label: string; value: EventActionType; icon: string }[] = [
  { label: 'Toast 消息提示', value: 'toast', icon: '📢' },
  { label: '页面跳转', value: 'navigate', icon: '🔗' },
  { label: '打开弹窗', value: 'open-modal', icon: '🪟' },
  { label: '关闭弹窗', value: 'close-modal', icon: '❌' },
  { label: '确认对话框', value: 'confirm', icon: '⚠️' },
  { label: '设置变量', value: 'set-variable', icon: '📦' },
  { label: '调用 API', value: 'call-api', icon: '🌐' },
  { label: '派发自定义事件', value: 'dispatch-event', icon: '📡' },
  { label: '刷新页面', value: 'reload', icon: '🔄' },
  { label: '返回上一页', value: 'back', icon: '↩️' },
  { label: '滚动到元素', value: 'scroll-to', icon: '📍' },
  { label: '自定义代码', value: 'custom-code', icon: '💻' },
];

/* ==================== 工具函数 ==================== */

let actionIdCounter = 0;
function generateActionId(): string {
  return `act_${Date.now()}_${++actionIdCounter}`;
}

function readEventsFromComponent(component: Component | null): EventBinding[] {
  if (!component) return [];
  // 优先从组件 model 读取（可持久化）
  const attrs = component.getAttributes();
  const modelData = attrs['data-events'] as string | undefined;
  if (modelData) {
    try {
      return JSON.parse(modelData) as EventBinding[];
    } catch {
      // fallback below
    }
  }
  // 降级：从 DOM 读取（兼容旧数据）
  const el = component.getEl();
  if (!el) return [];
  const domData = el.getAttribute('data-events');
  if (!domData) return [];
  try {
    return JSON.parse(domData) as EventBinding[];
  } catch {
    return [];
  }
}

function writeEventsToComponent(
  component: Component | null,
  events: EventBinding[],
): void {
  if (!component) return;
  if (events.length === 0) {
    // 清空时从 model 移除
    const current = component.getAttributes();
    const { 'data-events': _unused, ...rest } = current;
    component.setAttributes(rest);
  } else {
    component.addAttributes({ 'data-events': JSON.stringify(events) });
  }
  component.emitUpdate();
}

function createDefaultAction(type: EventActionType): EventAction {
  const base = { id: generateActionId(), type, config: {} };
  switch (type) {
    case 'toast':
      return { ...base, config: { type: 'info', message: '' } };
    case 'navigate':
      return { ...base, config: { url: '', target: '_self' } };
    case 'open-modal':
    case 'close-modal':
      return { ...base, config: { modalId: '' } };
    case 'confirm':
      return { ...base, config: { title: '确认', content: '确定执行此操作？', confirmText: '确定', cancelText: '取消' } };
    case 'set-variable':
      return { ...base, config: { key: '', value: '', scope: 'page' } };
    case 'call-api':
      return { ...base, config: { url: '', method: 'GET' } };
    case 'dispatch-event':
      return { ...base, config: { eventName: '' } };
    case 'scroll-to':
      return { ...base, config: { selector: '', behavior: 'smooth' } };
    case 'custom-code':
      return { ...base, config: { code: '' } };
    case 'reload':
    case 'back':
      return base;
    default:
      return base;
  }
}

/* ==================== 动作配置表单 ==================== */

interface ActionConfigFormProps {
  action: EventAction;
  onChange: (updated: EventAction) => void;
}

const ActionConfigFields: React.FC<ActionConfigFormProps> = ({ action, onChange }) => {
  const config = action.config;
  const setConfig = (partial: Record<string, unknown>) => {
    onChange({ ...action, config: { ...config, ...partial } });
  };

  // hooks 必须在顶层调用，不能放在 switch/case 中
  const editor = useContext(EditorContext);
  const modals = useModalList(editor);

  switch (action.type) {
    case 'toast':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Select
            size="small"
            value={config.type as string}
            onChange={(v) => setConfig({ type: v })}
            options={[
              { label: '✅ 成功', value: 'success' },
              { label: '❌ 错误', value: 'error' },
              { label: 'ℹ️ 提示', value: 'info' },
              { label: '⚠️ 警告', value: 'warning' },
            ]}
            style={{ width: '100%' }}
          />
          <Input
            size="small"
            placeholder="消息内容"
            value={config.message as string}
            onChange={(e) => setConfig({ message: e.target.value })}
          />
        </Space>
      );

    case 'navigate':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Input
            size="small"
            placeholder="跳转地址"
            value={config.url as string}
            onChange={(e) => setConfig({ url: e.target.value })}
          />
          <Select
            size="small"
            value={config.target as string}
            onChange={(v) => setConfig({ target: v })}
            options={[
              { label: '当前窗口 (_self)', value: '_self' },
              { label: '新窗口 (_blank)', value: '_blank' },
            ]}
            style={{ width: '100%' }}
          />
        </Space>
      );

    case 'open-modal':
    case 'close-modal':
      return (
        <Select
          size="small"
          placeholder="选择弹窗"
          value={config.modalId as string || undefined}
          onChange={(v) => setConfig({ modalId: v })}
          options={modals.map((m) => ({ label: m.label, value: m.id }))}
          style={{ width: '100%' }}
          notFoundContent="暂无弹窗，请先拖入弹窗组件"
        />
      );

    case 'confirm':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Input
            size="small"
            placeholder="标题"
            value={config.title as string}
            onChange={(e) => setConfig({ title: e.target.value })}
          />
          <Input
            size="small"
            placeholder="确认内容"
            value={config.content as string}
            onChange={(e) => setConfig({ content: e.target.value })}
          />
          <Space size={4}>
            <Input
              size="small"
              placeholder="确认按钮"
              value={config.confirmText as string}
              onChange={(e) => setConfig({ confirmText: e.target.value })}
              style={{ width: '50%' }}
            />
            <Input
              size="small"
              placeholder="取消按钮"
              value={config.cancelText as string}
              onChange={(e) => setConfig({ cancelText: e.target.value })}
              style={{ width: '50%' }}
            />
          </Space>
        </Space>
      );

    case 'set-variable':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Space size={4}>
            <Input
              size="small"
              placeholder="变量名"
              value={config.key as string}
              onChange={(e) => setConfig({ key: e.target.value })}
              style={{ flex: 1 }}
            />
            <Select
              size="small"
              value={config.scope as string}
              onChange={(v) => setConfig({ scope: v })}
              options={[
                { label: '页面', value: 'page' },
                { label: '全局', value: 'global' },
              ]}
              style={{ width: 80 }}
            />
          </Space>
          <Input
            size="small"
            placeholder="变量值"
            value={config.value as string}
            onChange={(e) => setConfig({ value: e.target.value })}
          />
        </Space>
      );

    case 'call-api':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Space size={4}>
            <Select
              size="small"
              value={config.method as string}
              onChange={(v) => setConfig({ method: v })}
              options={[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'DELETE', value: 'DELETE' },
              ]}
              style={{ width: 80 }}
            />
            <Input
              size="small"
              placeholder="API 地址"
              value={config.url as string}
              onChange={(e) => setConfig({ url: e.target.value })}
              style={{ flex: 1 }}
            />
          </Space>
          <Input
            size="small"
            placeholder="响应存入变量名（选填）"
            value={config.assignTo as string}
            onChange={(e) => setConfig({ assignTo: e.target.value })}
          />
        </Space>
      );

    case 'dispatch-event':
      return (
        <Input
          size="small"
          placeholder="自定义事件名称"
          value={config.eventName as string}
          onChange={(e) => setConfig({ eventName: e.target.value })}
        />
      );

    case 'scroll-to':
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Input
            size="small"
            placeholder="CSS 选择器"
            value={config.selector as string}
            onChange={(e) => setConfig({ selector: e.target.value })}
          />
          <Select
            size="small"
            value={config.behavior as string}
            onChange={(v) => setConfig({ behavior: v })}
            options={[
              { label: '平滑滚动', value: 'smooth' },
              { label: '即时跳转', value: 'auto' },
            ]}
            style={{ width: '100%' }}
          />
        </Space>
      );

    case 'custom-code':
      return (
        <TextArea
          rows={4}
          placeholder="// 可用变量：context, event, variables, $toast, $navigate, $modals, $bus"
          value={config.code as string}
          onChange={(e) => setConfig({ code: e.target.value })}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      );

    case 'reload':
    case 'back':
      return <Text type="secondary">无需额外配置</Text>;

    default:
      return <Text type="warning">未知动作类型</Text>;
  }
};

/* ==================== 动作列表编辑 ==================== */

interface ActionsEditorProps {
  actions: EventAction[];
  onChange: (actions: EventAction[]) => void;
  level?: number;
}

const ActionsEditor: React.FC<ActionsEditorProps> = ({
  actions,
  onChange,
  level = 0,
}) => {
  const addAction = (type: EventActionType) => {
    onChange([...actions, createDefaultAction(type)]);
  };

  const updateAction = (index: number, updated: EventAction) => {
    const next = [...actions];
    next[index] = updated;
    onChange(next);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <div style={{ paddingLeft: level * 12 }}>
      {actions.map((action, idx) => (
        <div
          key={action.id}
          style={{
            background: '#fafafa',
            borderRadius: 6,
            padding: 8,
            marginBottom: 6,
            border: '1px solid #f0f0f0',
          }}
        >
          <Space style={{ marginBottom: 4, width: '100%', justifyContent: 'space-between' }} size={4}>
            <Select
              size="small"
              value={action.type}
              onChange={(type) => {
                const updated = createDefaultAction(type as EventActionType);
                updated.id = action.id;
                onChange(actions.map((a, i) => (i === idx ? updated : a)));
              }}
              style={{ width: 140 }}
              options={ACTION_TYPE_OPTIONS.map((opt) => ({
                label: `${opt.icon} ${opt.label}`,
                value: opt.value,
              }))}
            />
            <Space size={4}>
              <Input
                size="small"
                placeholder="标签"
                value={action.label}
                onChange={(e) => {
                  updateAction(idx, { ...action, label: e.target.value });
                }}
                style={{ width: 80 }}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAction(idx)}
              />
            </Space>
          </Space>

          <ActionConfigFields
            action={action}
            onChange={(updated) => updateAction(idx, updated)}
          />

          {(action.type === 'confirm' || action.type === 'call-api') && (
            <NestedActionsSection
              action={action}
              actionIndex={idx}
              updateAction={updateAction}
              level={level + 1}
            />
          )}
        </div>
      ))}

      <Select
        size="small"
        placeholder="添加动作..."
        value={undefined}
        onChange={(type) => addAction(type as EventActionType)}
        style={{ width: '100%' }}
        options={ACTION_TYPE_OPTIONS.map((opt) => ({
          label: `${opt.icon} ${opt.label}`,
          value: opt.value,
        }))}
        dropdownMatchSelectWidth={false}
      />
    </div>
  );
};

/* ==================== 嵌套动作区域 ==================== */

interface NestedActionsSectionProps {
  action: EventAction;
  actionIndex: number;
  updateAction: (index: number, updated: EventAction) => void;
  level: number;
}

const NestedActionsSection: React.FC<NestedActionsSectionProps> = ({
  action,
  actionIndex,
  updateAction,
  level,
}) => {
  if (action.type === 'confirm') {
    return (
      <div style={{ marginTop: 6 }}>
        <Divider style={{ margin: '6px 0', fontSize: 11 }}>
          <Tag style={{ fontSize: 10 }}>确认后执行</Tag>
        </Divider>
        <ActionsEditor
          actions={(action.config.onConfirm as EventAction[]) || []}
          onChange={(onConfirm) =>
            updateAction(actionIndex, {
              ...action,
              config: { ...action.config, onConfirm },
            })
          }
          level={level}
        />
        <Divider style={{ margin: '6px 0', fontSize: 11 }}>
          <Tag style={{ fontSize: 10 }}>取消后执行</Tag>
        </Divider>
        <ActionsEditor
          actions={(action.config.onCancel as EventAction[]) || []}
          onChange={(onCancel) =>
            updateAction(actionIndex, {
              ...action,
              config: { ...action.config, onCancel },
            })
          }
          level={level}
        />
      </div>
    );
  }

  if (action.type === 'call-api') {
    return (
      <div style={{ marginTop: 6 }}>
        <Divider style={{ margin: '6px 0', fontSize: 11 }}>
          <Tag color="success" style={{ fontSize: 10 }}>成功时</Tag>
        </Divider>
        <ActionsEditor
          actions={(action.config.onSuccess as EventAction[]) || []}
          onChange={(onSuccess) =>
            updateAction(actionIndex, {
              ...action,
              config: { ...action.config, onSuccess },
            })
          }
          level={level}
        />
        <Divider style={{ margin: '6px 0', fontSize: 11 }}>
          <Tag color="error" style={{ fontSize: 10 }}>失败时</Tag>
        </Divider>
        <ActionsEditor
          actions={(action.config.onError as EventAction[]) || []}
          onChange={(onError) =>
            updateAction(actionIndex, {
              ...action,
              config: { ...action.config, onError },
            })
          }
          level={level}
        />
      </div>
    );
  }

  return null;
};

/* ==================== 事件绑定卡片 ==================== */

interface EventBindingCardProps {
  binding: EventBinding;
  index: number;
  onChange: (index: number, updated: EventBinding) => void;
  onRemove: (index: number) => void;
}

const EventBindingCard: React.FC<EventBindingCardProps> = ({
  binding,
  index,
  onChange,
  onRemove,
}) => {
  const update = (partial: Partial<EventBinding>) => {
    onChange(index, { ...binding, ...partial });
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        border: '1px solid #e8e8e8',
      }}
    >
      <Space style={{ marginBottom: 6, width: '100%', justifyContent: 'space-between' }}>
        <Select
          size="small"
          value={binding.event}
          onChange={(event) => update({ event })}
          style={{ width: 160 }}
          options={EVENT_TYPE_OPTIONS.map((opt) => ({
            label: opt.label,
            value: opt.value,
          }))}
        />
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onRemove(index)}
        />
      </Space>

      {/* 高级选项 */}
      <details style={{ marginBottom: 6 }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, color: '#999' }}>
          防抖 / 节流 / 条件
        </summary>
        <Space style={{ marginTop: 4 }} size={4} wrap>
          <Space size={2}>
            <Text style={{ fontSize: 11 }}>防抖:</Text>
            <InputNumber
              size="small"
              placeholder="ms"
              value={binding.debounce}
              onChange={(v) => update({ debounce: v ?? undefined, throttle: v ? undefined : binding.throttle })}
              min={0}
              style={{ width: 64 }}
            />
          </Space>
          <Space size={2}>
            <Text style={{ fontSize: 11 }}>节流:</Text>
            <InputNumber
              size="small"
              placeholder="ms"
              value={binding.throttle}
              onChange={(v) => update({ throttle: v ?? undefined, debounce: v ? undefined : binding.debounce })}
              min={0}
              style={{ width: 64 }}
            />
          </Space>
          <Input
            size="small"
            placeholder="条件表达式"
            value={binding.condition}
            onChange={(e) => update({ condition: e.target.value || undefined })}
            style={{ width: '100%' }}
          />
        </Space>
      </details>

      <ActionsEditor
        actions={binding.actions}
        onChange={(actions) => update({ actions })}
      />
    </div>
  );
};

/* ==================== 筛选显示 ==================== */

/** 是否有任何事件绑定使用嵌套动作（confirm/call-api） */
function hasNestedActions(events: EventBinding[]): boolean {
  return events.some((b) =>
    b.actions.some((a) => a.type === 'confirm' || a.type === 'call-api'),
  );
}

/* ==================== 主组件 ==================== */

interface EventBindingTabContentProps {
  /** 由 GrapesJS Studio SDK 自动注入 */
  editor: Editor;
}

const EventBindingTabContent: React.FC<EventBindingTabContentProps> = ({ editor }) => {
  const [component, setComponent] = useState<Component | null>(null);
  const [events, setEvents] = useState<EventBinding[]>([]);
  const [saveHint, setSaveHint] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  /** 读取组件 data-events */
  const reloadEvents = useCallback((cmp: Component) => {
    setEvents(readEventsFromComponent(cmp));
  }, []);

  /** 监听组件选中/取消选中 */
  useEffect(() => {
    const onSelect = (cmp: Component) => {
      setComponent(cmp);
      setSaveHint('');
      reloadEvents(cmp);
    };
    const onDeselect = () => {
      setComponent(null);
      setEvents([]);
      setSaveHint('');
    };
    const onUpdate = () => {
      // 当组件通过其他方式（如撤销/重做）更新时刷新
      const selected = editor.getSelected();
      if (selected) {
        reloadEvents(selected);
      }
    };

    editor.on('component:selected', onSelect);
    editor.on('component:deselected', onDeselect);
    editor.on('component:update', onUpdate);

    // 如果已有选中的组件
    const selected = editor.getSelected();
    if (selected) {
      setComponent(selected);
      reloadEvents(selected);
    }

    return () => {
      editor.off('component:selected', onSelect);
      editor.off('component:deselected', onDeselect);
      editor.off('component:update', onUpdate);
    };
  }, [editor, reloadEvents]);

  /** 防抖自动保存 */
  const scheduleSave = useCallback((cmp: Component, evts: EventBinding[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      writeEventsToComponent(cmp, evts);
      setSaveHint('');
    }, 500);
  }, []);

  /** 事件变更处理 */
  const handleEventsChange = useCallback((newEvents: EventBinding[]) => {
    setEvents(newEvents);
    setSaveHint('修改中...');
    if (component) {
      scheduleSave(component, newEvents);
    }
  }, [component, scheduleSave]);

  const addBinding = () => {
    handleEventsChange([
      ...events,
      { event: 'click', actions: [] },
    ]);
  };

  const updateBinding = (index: number, updated: EventBinding) => {
    const next = [...events];
    next[index] = updated;
    handleEventsChange(next);
  };

  const removeBinding = (index: number) => {
    handleEventsChange(events.filter((_, i) => i !== index));
  };

  /** 清理定时器 */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ==================== 渲染 ==================== */

  // 未选中组件时的空状态
  if (!component) {
    return (
      <EditorContext.Provider value={editor}>
        <div style={{ padding: '24px 12px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 13 }}>
                请先在画布中选择一个组件
              </Text>
            }
          />
        </div>
      </EditorContext.Provider>
    );
  }

  const tagName = component.getEl()?.tagName?.toLowerCase() || component.getName() || component.getId();

  return (
    <EditorContext.Provider value={editor}>
    <div className="event-binding-tab" style={{ padding: '8px 8px 16px' }}>
      {/* 组件信息 + 保存状态 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Space size={4}>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          <Tag style={{ fontSize: 11, marginRight: 0 }}>{tagName}</Tag>
        </Space>
        {saveHint && (
          <Text style={{ fontSize: 11, color: '#999' }}>{saveHint}</Text>
        )}
      </div>

      {/* 事件绑定列表（过滤掉自动生成的同步变量事件） */}
      {(() => {
        // 过滤掉自动生成的同步变量事件（id 以 auto_ 开头）
        const userEvents = events.filter((binding) =>
          !binding.actions?.some((a) => a.id?.startsWith('auto_'))
        );

        if (userEvents.length === 0) {
          return (
            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                color: '#bbb',
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                尚未配置事件绑定
              </Text>
            </div>
          );
        }

        return userEvents.map((binding, idx) => {
          // 找到原始 events 中的真实索引
          const realIdx = events.indexOf(binding);
          return (
            <EventBindingCard
              key={`${binding.event}_${realIdx}`}
              binding={binding}
              index={realIdx}
              onChange={updateBinding}
              onRemove={removeBinding}
            />
          );
        });
      })()}

      {/* 添加按钮 */}
      <Button
        type="dashed"
        onClick={addBinding}
        block
        size="small"
        icon={<PlusOutlined />}
        style={{ marginTop: 4 }}
      >
        添加事件绑定
      </Button>
    </div>
    </EditorContext.Provider>
  );
};

export default EventBindingTabContent;
