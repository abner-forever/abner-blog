/**
 * EventBindingPanel — 事件绑定面板
 *
 * 在 GrapesJS 编辑器中选中组件时，允许用户可视化配置事件绑定。
 *
 * 工作原理：
 * 1. 读取选中组件 DOM 元素的 data-events 属性（JSON 字符串）
 * 2. 用户在面板中配置事件绑定和动作链
 * 3. 保存时将配置写回 data-events 属性
 * 4. schemaConverter 在转换时提取 data-events → SchemaNode.events
 *
 * 数据流：
 * 编辑器选中组件 → 读取 data-events → 渲染表单
 * 表单修改 → 写回 data-events → schemaConverter 读取 → SchemaNode.events
 */

import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import {
  Modal,
  Button,
  Select,
  Input,
  InputNumber,
  Switch,
  Form,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
  Tooltip,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { Editor, Component } from 'grapesjs';
import type {
  EventBinding,
  EventAction,
  EventActionType,
} from '@abner-blog/page-schema';
import { getModalList } from '@/utils/schemaConverter';

const { Text, Title } = Typography;
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

/* ==================== 类型定义 ==================== */

/** 事件类型选项（DOM 事件名 → React 事件 prop） */
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

/** 动作类型选项 */
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

/** 读取组件 data-events 属性（从组件 model，持久化） */
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

/** 写入 data-events 到组件 model（通过 GrapesJS API 持久化） */
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

/** 创建默认事件动作 */
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

/** 根据动作类型渲染对应的配置表单 */
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
        <Space direction="vertical" style={{ width: '100%' }}>
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            size="small"
            placeholder="跳转地址（支持相对/绝对路径）"
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
        <Space direction="vertical" style={{ width: '100%' }}>
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
          <Space>
            <Input
              size="small"
              placeholder="确认按钮"
              value={config.confirmText as string}
              onChange={(e) => setConfig({ confirmText: e.target.value })}
              style={{ width: 120 }}
            />
            <Input
              size="small"
              placeholder="取消按钮"
              value={config.cancelText as string}
              onChange={(e) => setConfig({ cancelText: e.target.value })}
              style={{ width: 120 }}
            />
          </Space>
        </Space>
      );

    case 'set-variable':
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Input
              size="small"
              placeholder="变量名"
              value={config.key as string}
              onChange={(e) => setConfig({ key: e.target.value })}
              style={{ width: 140 }}
            />
            <Select
              size="small"
              value={config.scope as string}
              onChange={(v) => setConfig({ scope: v })}
              options={[
                { label: '页面级', value: 'page' },
                { label: '全局级', value: 'global' },
              ]}
              style={{ width: 100 }}
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
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
              style={{ width: 90 }}
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
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            size="small"
            placeholder="CSS 选择器（如 #footer, .section）"
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
    <div style={{ paddingLeft: level * 16 }}>
      {actions.map((action, idx) => (
        <div
          key={action.id}
          style={{
            background: '#fafafa',
            borderRadius: 6,
            padding: 8,
            marginBottom: 8,
            border: '1px solid #f0f0f0',
          }}
        >
          <Space style={{ marginBottom: 6, width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Select
                size="small"
                value={action.type}
                onChange={(type) => {
                  const updated = createDefaultAction(type as EventActionType);
                  updated.id = action.id;
                  onChange(actions.map((a, i) => (i === idx ? updated : a)));
                }}
                style={{ width: 160 }}
                options={ACTION_TYPE_OPTIONS.map((opt) => ({
                  label: `${opt.icon} ${opt.label}`,
                  value: opt.value,
                }))}
              />
              <Input
                size="small"
                placeholder="标签（可选）"
                value={action.label}
                onChange={(e) => {
                  updateAction(idx, { ...action, label: e.target.value });
                }}
                style={{ width: 100 }}
              />
            </Space>
            <Popconfirm
              title="删除此动作？"
              onConfirm={() => removeAction(idx)}
              okText="删除"
              cancelText="取消"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>

          <ActionConfigFields
            action={action}
            onChange={(updated) => updateAction(idx, updated)}
          />

          {/* 嵌套动作：confirm.onConfirm / call-api.onSuccess */}
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
      <div style={{ marginTop: 8 }}>
        <Divider style={{ margin: '8px 0', fontSize: 12 }}>
          <Tag style={{ fontSize: 11 }}>确认后执行</Tag>
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

        <Divider style={{ margin: '8px 0', fontSize: 12 }}>
          <Tag style={{ fontSize: 11 }}>取消后执行</Tag>
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
      <div style={{ marginTop: 8 }}>
        <Divider style={{ margin: '8px 0', fontSize: 12 }}>
          <Tag color="success" style={{ fontSize: 11 }}>成功时</Tag>
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

        <Divider style={{ margin: '8px 0', fontSize: 12 }}>
          <Tag color="error" style={{ fontSize: 11 }}>失败时</Tag>
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
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        border: '1px solid #e8e8e8',
      }}
    >
      {/* 事件类型 + 删除 */}
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Select
            size="small"
            value={binding.event}
            onChange={(event) => update({ event })}
            style={{ width: 200 }}
            options={EVENT_TYPE_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            触发时执行以下动作
          </Text>
        </Space>
        <Popconfirm
          title="删除此事件绑定？"
          onConfirm={() => onRemove(index)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>

      {/* 高级选项 */}
      <details style={{ marginBottom: 8 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: '#999' }}>
          高级选项（防抖/节流/条件）
        </summary>
        <Space style={{ marginTop: 6 }} wrap>
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>防抖:</Text>
            <InputNumber
              size="small"
              placeholder="ms"
              value={binding.debounce}
              onChange={(v) => update({ debounce: v ?? undefined, throttle: v ? undefined : binding.throttle })}
              min={0}
              style={{ width: 80 }}
            />
            <Text style={{ fontSize: 12 }}>ms</Text>
          </Space>
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>节流:</Text>
            <InputNumber
              size="small"
              placeholder="ms"
              value={binding.throttle}
              onChange={(v) => update({ throttle: v ?? undefined, debounce: v ? undefined : binding.debounce })}
              min={0}
              style={{ width: 80 }}
            />
            <Text style={{ fontSize: 12 }}>ms</Text>
          </Space>
          <Space size={4}>
            <Text style={{ fontSize: 12 }}>条件:</Text>
            <Input
              size="small"
              placeholder="event.target.value === 'ok'"
              value={binding.condition}
              onChange={(e) => update({ condition: e.target.value || undefined })}
              style={{ width: 200 }}
            />
          </Space>
        </Space>
      </details>

      {/* 动作列表 */}
      <ActionsEditor
        actions={binding.actions}
        onChange={(actions) => update({ actions })}
      />
    </div>
  );
};

/* ==================== 主面板 ==================== */

interface EventBindingPanelProps {
  /** GrapesJS 编辑器实例 */
  editor: Editor | null;
  /** 当前选中的组件 */
  component: Component | null;
  /** 面板可见性 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

const EventBindingPanel: React.FC<EventBindingPanelProps> = ({
  editor,
  component,
  open,
  onClose,
}) => {
  const [events, setEvents] = useState<EventBinding[]>([]);
  const hasChangedRef = useRef(false);

  // 打开面板时从组件 data-events 读取
  useEffect(() => {
    if (open && component) {
      setEvents(readEventsFromComponent(component));
      hasChangedRef.current = false;
    }
  }, [open, component]);

  const addBinding = () => {
    setEvents((prev) => [
      ...prev,
      { event: 'click', actions: [] },
    ]);
  };

  const updateBinding = (index: number, updated: EventBinding) => {
    setEvents((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
    hasChangedRef.current = true;
  };

  const removeBinding = (index: number) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
    hasChangedRef.current = true;
  };

  const handleSave = useCallback(() => {
    if (component) {
      writeEventsToComponent(component, events);
      message.success('事件绑定已保存');
    }
    onClose();
  }, [component, events, onClose]);

  const handleCancel = useCallback(() => {
    if (hasChangedRef.current) {
      Modal.confirm({
        title: '放弃更改？',
        content: '已修改的事件绑定尚未保存，确定放弃？',
        okText: '放弃',
        cancelText: '继续编辑',
        onOk: onClose,
      });
    } else {
      onClose();
    }
  }, [onClose]);

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          <span>事件绑定</span>
          {component && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              — {component.getEl()?.tagName?.toLowerCase() || component.getId()}
            </Text>
          )}
        </Space>
      }
      open={open}
      onOk={handleSave}
      onCancel={handleCancel}
      okText="保存"
      cancelText="取消"
      width={680}
      bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
      destroyOnHidden
    >
      <EditorContext.Provider value={editor}>
      {!component ? (
        <Empty description="请先在画布中选择一个组件" />
      ) : (
        <>
          {events.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
              <Text type="secondary">尚未配置事件绑定，点击下方按钮添加</Text>
            </div>
          )}

          {events.map((binding, idx) => (
            <EventBindingCard
              key={`${binding.event}_${idx}`}
              binding={binding}
              index={idx}
              onChange={updateBinding}
              onRemove={removeBinding}
            />
          ))}

          <Button
            type="dashed"
            onClick={addBinding}
            block
            icon={<PlusOutlined />}
          >
            添加事件绑定
          </Button>
        </>
      )}
      </EditorContext.Provider>
    </Modal>
  );
};

export default EventBindingPanel;
