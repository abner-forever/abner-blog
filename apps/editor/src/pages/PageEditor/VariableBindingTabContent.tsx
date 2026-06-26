/**
 * VariableBindingTabContent — 右侧属性面板「变量」标签页
 *
 * 功能：
 * 1. 条件显示：配置组件根据变量值显示/隐藏（props.condition）
 * 2. 模板变量：配置组件 props 中的 {{key}} 模板变量
 * 3. 变量列表：查看页面中使用的所有变量
 *
 * 数据存储：
 * - condition → data-condition 属性
 * - 变量映射 → data-variable-bindings 属性
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Select,
  Input,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { Editor, Component } from 'grapesjs';
import type { ConditionConfig, ConditionOperator, EventBinding } from '@abner-blog/page-schema';

const { Text } = Typography;

/* ==================== 类型定义 ==================== */

/** 变量绑定配置 */
interface VariableBinding {
  /** 目标属性名（如 content, text, src） */
  prop: string;
  /** 变量名 */
  variable: string;
}

/** 组件变量配置 */
interface ComponentVariableConfig {
  /** 条件显示配置 */
  condition?: ConditionConfig;
  /** 是否直接隐藏（无条件） */
  hidden?: boolean;
  /** 变量绑定列表 */
  bindings?: VariableBinding[];
}

/* ==================== 常量 ==================== */

const CONDITION_OPERATOR_OPTIONS: { label: string; value: ConditionOperator }[] = [
  { label: '等于 (==)', value: 'eq' },
  { label: '不等于 (!=)', value: 'neq' },
  { label: '大于 (>)', value: 'gt' },
  { label: '小于 (<)', value: 'lt' },
  { label: '大于等于 (>=)', value: 'gte' },
  { label: '小于等于 (<=)', value: 'lte' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'notContains' },
  { label: '在数组中', value: 'in' },
  { label: '不在数组中', value: 'notIn' },
];

/** 常用的可绑定属性 */
const BINDABLE_PROPS: Record<string, string[]> = {
  text: ['content', 'text'],
  button: ['text', 'icon'],
  image: ['src', 'alt'],
  link: ['text', 'href'],
  input: ['placeholder', 'value', 'label'],
  textarea: ['placeholder', 'value', 'label'],
  select: ['placeholder', 'value', 'label'],
  checkbox: ['label', 'value'],
  section: ['title'],
  card: ['title', 'description', 'imageSrc', 'href'],
  'nav-link': ['text', 'href'],
  'html-embed': ['html'],
};

/* ==================== 工具函数 ==================== */

function readConfigFromComponent(component: Component | null): ComponentVariableConfig {
  if (!component) return {};
  const attrs = component.getAttributes();

  const config: ComponentVariableConfig = {};

  // 读取 condition
  const conditionStr = attrs['data-condition'];
  if (conditionStr) {
    try {
      config.condition = JSON.parse(conditionStr);
    } catch { /* 忽略 */ }
  }

  // 读取 hidden
  if (attrs['data-conditional-hidden'] === 'true') {
    config.hidden = true;
  }

  // 读取变量绑定
  const bindingsStr = attrs['data-variable-bindings'];
  if (bindingsStr) {
    try {
      config.bindings = JSON.parse(bindingsStr);
    } catch { /* 忽略 */ }
  }

  return config;
}

/** 从组件读取事件绑定 */
function readEvents(component: Component | null): EventBinding[] {
  if (!component) return [];
  const attrs = component.getAttributes();
  const data = attrs['data-events'];
  if (!data) return [];
  try {
    return JSON.parse(data) as EventBinding[];
  } catch {
    return [];
  }
}

/** 写入事件绑定到组件 */
function writeEvents(component: Component | null, events: EventBinding[]): void {
  if (!component) return;
  if (events.length === 0) {
    const current = component.getAttributes();
    const { 'data-events': _unused, ...rest } = current;
    component.setAttributes(rest);
  } else {
    component.addAttributes({ 'data-events': JSON.stringify(events) });
  }
}

/** 判断组件是否为表单输入类型（需要双向绑定） */
function isFormInputType(component: Component | null): boolean {
  if (!component) return false;
  const type = component.getType?.() || '';
  const tagName = component.getEl()?.tagName?.toLowerCase() || '';
  return (
    type === 'input' ||
    type === 'form-input' ||
    type === 'form-textarea' ||
    type === 'form-select' ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

/** 生成自增 ID */
let _varActionIdCounter = 0;
function genActionId(): string {
  return `auto_${Date.now()}_${++_varActionIdCounter}`;
}

/**
 * 当变量绑定包含 value/content 等输入类属性时，
 * 自动为组件创建 change 事件 + custom-code 动作，实现双向绑定。
 */
function syncAutoEventBindings(
  component: Component | null,
  bindings: VariableBinding[],
): void {
  if (!component || !isFormInputType(component)) return;

  const events = readEvents(component);
  const inputBindings = bindings.filter(
    (b) => b.prop === 'value' && b.variable,
  );

  // 移除之前自动生成的 change 事件（ID 以 auto_ 开头）
  const manualEvents = events.filter((e) => {
    if (e.event !== 'change') return true;
    return !e.actions.some((a) => a.id.startsWith('auto_'));
  });

  // 为每个 value 绑定添加 change → custom-code 事件
  for (const binding of inputBindings) {
    const code = `context.variables.set('${binding.variable}', event.target.value);`;
    manualEvents.push({
      event: 'change',
      actions: [
        {
          id: genActionId(),
          type: 'custom-code',
          label: `同步变量 ${binding.variable}`,
          config: { code },
        },
      ],
    });
  }

  writeEvents(component, manualEvents);
}

function writeConfigToComponent(
  component: Component | null,
  config: ComponentVariableConfig,
): void {
  if (!component) return;

  const attrs: Record<string, string | undefined> = {};

  // 写入 condition
  if (config.condition && config.condition.field) {
    attrs['data-condition'] = JSON.stringify(config.condition);
  } else {
    attrs['data-condition'] = undefined;
  }

  // 写入 hidden
  if (config.hidden) {
    attrs['data-conditional-hidden'] = 'true';
  } else {
    attrs['data-conditional-hidden'] = undefined;
  }

  // 写入变量绑定
  if (config.bindings && config.bindings.length > 0) {
    attrs['data-variable-bindings'] = JSON.stringify(config.bindings);
  } else {
    attrs['data-variable-bindings'] = undefined;
  }

  // 清理 undefined 值
  const cleanAttrs: Record<string, string> = {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanAttrs[key] = value;
    }
  });

  // 先移除所有相关属性，再添加新值
  component.removeAttributes(['data-condition', 'data-conditional-hidden', 'data-variable-bindings']);
  if (Object.keys(cleanAttrs).length > 0) {
    component.addAttributes(cleanAttrs);
  }

  // 自动同步 change 事件（双向绑定）
  syncAutoEventBindings(component, config.bindings || []);

  component.emitUpdate();
}

/** 从组件中提取可用的属性列表 */
function getBindableProps(component: Component | null): string[] {
  if (!component) return [];
  const type = component.getType?.() || '';
  const name = component.getName?.() || '';

  // 尝试从预定义列表中获取
  for (const [key, props] of Object.entries(BINDABLE_PROPS)) {
    if (type.includes(key) || name.toLowerCase().includes(key)) {
      return props;
    }
  }

  // 从组件 attributes 中提取
  const attrs = component.getAttributes();
  const attrKeys = Object.keys(attrs).filter(
    (k) => !k.startsWith('data-') && !k.startsWith('gjs-') && k !== 'id' && k !== 'class'
  );

  return [...new Set([...attrKeys, 'content', 'text', 'src', 'href', 'placeholder'])];
}

/** 收集页面中所有使用的变量名 */
function collectPageVariables(editor: Editor): string[] {
  const vars = new Set<string>();
  const wrapper = editor.getWrapper();
  if (!wrapper) return [];

  const traverse = (comp: unknown) => {
    if (!comp || typeof comp !== 'object') return;
    const c = comp as {
      getAttributes: () => Record<string, string>;
      components: () => { each: (cb: (c: unknown) => void) => void };
    };

    // 从 data-events 中提取 set-variable 的 key
    const attrs = c.getAttributes();
    const eventsStr = attrs['data-events'];
    if (eventsStr) {
      try {
        const events = JSON.parse(eventsStr);
        if (Array.isArray(events)) {
          events.forEach((binding: { actions?: Array<{ type: string; config: { key?: string } }> }) => {
            binding.actions?.forEach((action) => {
              if (action.type === 'set-variable' && action.config.key) {
                vars.add(action.config.key);
              }
            });
          });
        }
      } catch { /* 忽略 */ }
    }

    // 从 data-condition 中提取 field
    const conditionStr = attrs['data-condition'];
    if (conditionStr) {
      try {
        const condition = JSON.parse(conditionStr);
        if (condition.field) vars.add(condition.field);
      } catch { /* 忽略 */ }
    }

    // 从 data-variable-bindings 中提取 variable
    const bindingsStr = attrs['data-variable-bindings'];
    if (bindingsStr) {
      try {
        const bindings = JSON.parse(bindingsStr);
        if (Array.isArray(bindings)) {
          bindings.forEach((b: { variable?: string }) => {
            if (b.variable) vars.add(b.variable);
          });
        }
      } catch { /* 忽略 */ }
    }

    // 递归子组件
    if (typeof c.components === 'function') {
      c.components().each((child: unknown) => traverse(child));
    }
  };

  traverse(wrapper);
  return Array.from(vars).sort();
}

/* ==================== 条件配置组件 ==================== */

interface ConditionConfigProps {
  condition?: ConditionConfig;
  onChange: (config: { condition?: ConditionConfig }) => void;
  pageVariables: string[];
}

const ConditionEditor: React.FC<ConditionConfigProps> = ({
  condition,
  onChange,
  pageVariables,
}) => {
  const updateCondition = (partial: Partial<ConditionConfig>) => {
    const newCondition: ConditionConfig = {
      field: condition?.field || '',
      operator: condition?.operator || 'eq',
      value: condition?.value ?? '',
      ...partial,
    };
    onChange({ condition: newCondition });
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <Divider style={{ margin: '8px 0', fontSize: 11 }}>
        <Tag style={{ fontSize: 10 }}>条件显示</Tag>
      </Divider>

      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        当满足条件时才显示此组件
      </Text>

      {/* 变量名 */}
      <div style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>变量名</Text>
        <Select
          size="small"
          showSearch
          placeholder="选择或输入变量名"
          value={condition?.field || undefined}
          onChange={(v) => updateCondition({ field: v })}
          style={{ width: '100%' }}
          options={pageVariables.map((v) => ({ label: v, value: v }))}
          dropdownRender={(menu) => (
            <>
              {menu}
              {pageVariables.length === 0 && (
                <div style={{ padding: '4px 8px', color: '#999', fontSize: 11 }}>
                  暂无变量，请先在事件中使用「设置变量」动作
                </div>
              )}
            </>
          )}
        />
        <Input
          size="small"
          placeholder="或直接输入变量名"
          value={condition?.field || ''}
          onChange={(e) => updateCondition({ field: e.target.value })}
          style={{ marginTop: 4 }}
        />
      </div>

      {/* 运算符 */}
      <div style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>运算符</Text>
        <Select
          size="small"
          value={condition?.operator || 'eq'}
          onChange={(v) => updateCondition({ operator: v as ConditionOperator })}
          style={{ width: '100%' }}
          options={CONDITION_OPERATOR_OPTIONS}
        />
      </div>

      {/* 比较值 */}
      <div>
        <Text style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>比较值</Text>
        <Input
          size="small"
          placeholder="比较值（支持字符串、数字、布尔）"
          value={String(condition?.value ?? '')}
          onChange={(e) => {
            let value: unknown = e.target.value;
            // 自动转换类型
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (value !== '' && !isNaN(Number(value))) value = Number(value);
            updateCondition({ value });
          }}
        />
        <Text type="secondary" style={{ fontSize: 10, marginTop: 2, display: 'block' }}>
          输入 true/false 自动识别为布尔值，纯数字自动识别为数字
        </Text>
      </div>

      {/* 预览提示 */}
      {condition?.field && (
        <div
          style={{
            marginTop: 12,
            padding: '6px 8px',
            background: '#f6ffed',
            borderRadius: 4,
            border: '1px solid #b7eb8f',
          }}
        >
          <Text style={{ fontSize: 11 }}>
            当 <Text code style={{ fontSize: 10 }}>{condition.field}</Text>{' '}
            <Text code style={{ fontSize: 10 }}>{condition.operator}</Text>{' '}
            <Text code style={{ fontSize: 10 }}>{String(condition.value)}</Text> 时显示
          </Text>
        </div>
      )}
    </div>
  );
};

/* ==================== 变量绑定组件 ==================== */

interface VariableBindingsEditorProps {
  bindings?: VariableBinding[];
  onChange: (bindings: VariableBinding[]) => void;
  component: Component | null;
  pageVariables: string[];
}

const VariableBindingsEditor: React.FC<VariableBindingsEditorProps> = ({
  bindings = [],
  onChange,
  component,
  pageVariables,
}) => {
  const bindableProps = getBindableProps(component);

  const addBinding = () => {
    onChange([...bindings, { prop: '', variable: '' }]);
  };

  const updateBinding = (index: number, partial: Partial<VariableBinding>) => {
    const next = [...bindings];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  };

  const removeBinding = (index: number) => {
    onChange(bindings.filter((_, i) => i !== index));
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        将组件属性绑定到变量，变量值变化时自动更新
      </Text>

      {bindings.map((binding, idx) => (
        <div
          key={idx}
          style={{
            background: '#fafafa',
            borderRadius: 6,
            padding: 8,
            marginBottom: 6,
            border: '1px solid #f0f0f0',
          }}
        >
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Select
              size="small"
              showSearch
              placeholder="属性"
              value={binding.prop || undefined}
              onChange={(v) => updateBinding(idx, { prop: v })}
              style={{ width: 120 }}
              options={bindableProps.map((p) => ({ label: p, value: p }))}
            />
            <Text style={{ fontSize: 11, color: '#999' }}>→</Text>
            <Select
              size="small"
              showSearch
              placeholder="变量名"
              value={binding.variable || undefined}
              onChange={(v) => updateBinding(idx, { variable: v })}
              style={{ width: 120 }}
              options={pageVariables.map((v) => ({ label: v, value: v }))}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeBinding(idx)}
            />
          </Space>
          <Input
            size="small"
            placeholder="或直接输入变量名"
            value={binding.variable}
            onChange={(e) => updateBinding(idx, { variable: e.target.value })}
            style={{ marginTop: 4 }}
          />
        </div>
      ))}

      <Button
        type="dashed"
        size="small"
        block
        icon={<PlusOutlined />}
        onClick={addBinding}
        style={{ marginTop: 4 }}
      >
        添加变量绑定
      </Button>

      {bindings.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 8px', background: '#f6ffed', borderRadius: 4, border: '1px solid #b7eb8f' }}>
          <Text style={{ fontSize: 10 }}>
            💡 对于输入框组件，绑定 value 属性后会自动创建 change 事件同步变量值
          </Text>
        </div>
      )}
    </div>
  );
};

/* ==================== 主组件 ==================== */

interface VariableBindingTabContentProps {
  editor: Editor;
}

const VariableBindingTabContent: React.FC<VariableBindingTabContentProps> = ({ editor }) => {
  const [component, setComponent] = useState<Component | null>(null);
  const [config, setConfig] = useState<ComponentVariableConfig>({});
  const [pageVariables, setPageVariables] = useState<string[]>([]);
  const [saveHint, setSaveHint] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);
  configRef.current = config;
  // 防止 syncAutoEventBindings → emitUpdate → component:update → reloadConfig 无限循环
  const syncingRef = useRef(false);

  /** 读取组件配置 */
  const reloadConfig = useCallback((cmp: Component) => {
    if (syncingRef.current) return;
    const cfg = readConfigFromComponent(cmp);
    setConfig(cfg);
    setPageVariables(collectPageVariables(editor));
    // 组件选中时，自动同步 change 事件（确保已有变量绑定的输入框有事件）
    if (cfg.bindings && cfg.bindings.length > 0) {
      syncingRef.current = true;
      syncAutoEventBindings(cmp, cfg.bindings);
      syncingRef.current = false;
    }
  }, [editor]);

  /** 监听组件选中/取消选中 */
  useEffect(() => {
    const onSelect = (cmp: Component) => {
      setComponent(cmp);
      setSaveHint('');
      reloadConfig(cmp);
    };
    const onDeselect = () => {
      setComponent(null);
      setConfig({});
      setSaveHint('');
    };
    const onUpdate = () => {
      if (syncingRef.current) return;
      const selected = editor.getSelected();
      if (selected) {
        reloadConfig(selected);
      }
    };

    editor.on('component:selected', onSelect);
    editor.on('component:deselected', onDeselect);
    editor.on('component:update', onUpdate);

    const selected = editor.getSelected();
    if (selected) {
      setComponent(selected);
      reloadConfig(selected);
    }

    return () => {
      editor.off('component:selected', onSelect);
      editor.off('component:deselected', onDeselect);
      editor.off('component:update', onUpdate);
    };
  }, [editor, reloadConfig]);

  /** 防抖自动保存 */
  const scheduleSave = useCallback((cmp: Component, cfg: ComponentVariableConfig) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      syncingRef.current = true;
      writeConfigToComponent(cmp, cfg);
      syncingRef.current = false;
      setSaveHint('');
    }, 500);
  }, []);

  /** 配置变更处理 */
  const handleConfigChange = useCallback((partial: Partial<ComponentVariableConfig>) => {
    const newConfig = { ...configRef.current, ...partial };
    setConfig(newConfig);
    setSaveHint('修改中...');
    if (component) {
      scheduleSave(component, newConfig);
    }
  }, [component, scheduleSave]);

  /** 清理定时器 */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ==================== 渲染 ==================== */

  if (!component) {
    return (
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
    );
  }

  const tagName = component.getEl()?.tagName?.toLowerCase() || component.getName() || component.getId();

  return (
    <div style={{ padding: '8px 8px 16px' }}>
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
          <ThunderboltOutlined style={{ color: '#52c41a' }} />
          <Tag style={{ fontSize: 11, marginRight: 0 }}>{tagName}</Tag>
        </Space>
        {saveHint && (
          <Text style={{ fontSize: 11, color: '#999' }}>{saveHint}</Text>
        )}
      </div>

      {/* 条件显示配置 */}
      <details open>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
          <Space size={4}>
            <EyeOutlined />
            条件显示
            <Tooltip title="配置组件根据变量值显示或隐藏">
              <InfoCircleOutlined style={{ color: '#999', fontSize: 11 }} />
            </Tooltip>
          </Space>
        </summary>
        <ConditionEditor
          condition={config.condition}
          onChange={handleConfigChange}
          pageVariables={pageVariables}
        />
      </details>

      <Divider style={{ margin: '8px 0' }} />

      {/* 变量绑定配置 */}
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
          <Space size={4}>
            <ThunderboltOutlined />
            变量绑定
            <Tooltip title="将组件属性绑定到变量，实现动态内容">
              <InfoCircleOutlined style={{ color: '#999', fontSize: 11 }} />
            </Tooltip>
          </Space>
        </summary>
        <VariableBindingsEditor
          bindings={config.bindings}
          onChange={(bindings) => handleConfigChange({ bindings })}
          component={component}
          pageVariables={pageVariables}
        />
      </details>

      <Divider style={{ margin: '8px 0' }} />

      {/* 页面变量列表 */}
      <details>
        <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
          <Space size={4}>
            <InfoCircleOutlined />
            页面变量 ({pageVariables.length})
          </Space>
        </summary>
        <div style={{ padding: '8px 0' }}>
          {pageVariables.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              暂无变量，请在事件绑定中使用「设置变量」动作创建
            </Text>
          ) : (
            <Space wrap size={4}>
              {pageVariables.map((v) => (
                <Tag key={v} style={{ fontSize: 11 }}>
                  {v}
                </Tag>
              ))}
            </Space>
          )}
        </div>
      </details>

      {/* 使用说明 */}
      <div
        style={{
          marginTop: 16,
          padding: 8,
          background: '#f0f5ff',
          borderRadius: 6,
          border: '1px solid #adc6ff',
        }}
      >
        <Text style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
          💡 使用说明
        </Text>
        <Text type="secondary" style={{ fontSize: 10 }}>
          1. 先在「事件」标签页中使用「设置变量」动作创建变量<br />
          2. 在「条件显示」中配置变量条件，控制组件显隐<br />
          3. 在「变量绑定」中绑定属性，然后在属性值中使用 {'{{变量名}}'} 语法
        </Text>
      </div>
    </div>
  );
};

export default VariableBindingTabContent;
