/**
 * 组件通信演示页面
 *
 * 展示 page-schema 引擎中组件间通信的三种核心模式：
 * 1. set-variable + condition：A 控制 B 的显示/隐藏
 * 2. set-variable + {{template}}：B 展示 A 的计算结果
 * 3. dispatch-event + EventBus：组件间解耦通信
 *
 * 使用方式：
 * 将此组件挂载到路由或直接引入到页面中即可预览。
 */

import React, { useCallback, useRef } from 'react';
import { message, Card, Row, Col, Typography } from 'antd';
import {
  RendererProvider,
  PageRenderer,
  ModalProvider,
  ModalPortals,
  styleInjector,
  createConditionMiddleware,
  createVariableParserMiddleware,
  Container,
  Section,
  Row as SchemaRow,
  Column,
  Text,
  Button,
  Divider,
  Form,
  FormInput,
  FormSubmit,
  Card as SchemaCard,
  Modal,
} from '@abner-blog/page-schema';
import type {
  PageSchema,
  ActionContext,
  SchemaNode,
  ModalApi,
  Middleware,
} from '@abner-blog/page-schema';

const { Title, Paragraph, Text: AntText } = Typography;

/* ==================== Demo 1: 显隐控制 ==================== */

const demo1Schema: PageSchema = {
  root: {
    id: 'demo1-root',
    type: 'container',
    props: { style: { padding: '24px' } },
    children: [
      {
        id: 'demo1-title',
        type: 'text',
        props: { content: 'Demo 1: 按钮控制面板显隐', as: 'h3' },
      },
      {
        id: 'demo1-desc',
        type: 'text',
        props: {
          content: '点击按钮后，下方面板通过 condition 中间件判断变量值来决定是否渲染。',
          style: { color: '#666', marginBottom: '16px' },
        },
      },
      {
        id: 'demo1-show-btn',
        type: 'button',
        props: { text: '显示面板', style: { marginRight: '8px' } },
        events: [
          {
            event: 'click',
            actions: [
              {
                id: 'show-panel',
                type: 'set-variable',
                config: { key: 'isPanelVisible', value: true, scope: 'page' },
              },
              {
                id: 'show-toast',
                type: 'toast',
                config: { type: 'success', message: '面板已显示' },
              },
            ],
          },
        ],
      },
      {
        id: 'demo1-hide-btn',
        type: 'button',
        props: { text: '隐藏面板', variant: 'default' },
        events: [
          {
            event: 'click',
            actions: [
              {
                id: 'hide-panel',
                type: 'set-variable',
                config: { key: 'isPanelVisible', value: false, scope: 'page' },
              },
              {
                id: 'hide-toast',
                type: 'toast',
                config: { type: 'info', message: '面板已隐藏' },
              },
            ],
          },
        ],
      },
      {
        id: 'demo1-toggle-btn',
        type: 'button',
        props: { text: '切换显隐', style: { marginLeft: '8px' } },
        events: [
          {
            event: 'click',
            actions: [
              {
                id: 'toggle-panel',
                type: 'custom-code',
                config: {
                  code: `
                    const current = context.variables.get('isPanelVisible');
                    context.variables.set('isPanelVisible', !current);
                    context.toast.info(!current ? '面板已显示' : '面板已隐藏');
                  `,
                },
              },
            ],
          },
        ],
      },
      {
        id: 'demo1-hidden-panel',
        type: 'section',
        props: {
          condition: {
            field: 'isPanelVisible',
            operator: 'eq',
            value: true,
          },
          style: {
            marginTop: '16px',
            padding: '16px',
            background: '#f0f5ff',
            borderRadius: '8px',
            border: '1px solid #adc6ff',
          },
        },
        children: [
          {
            id: 'demo1-panel-content',
            type: 'text',
            props: { content: '这个面板由按钮控制显示/隐藏！\n通过 set-variable 设置 isPanelVisible 变量，condition 中间件在渲染时检查该变量。' },
          },
        ],
      },
    ],
  },
};

/* ==================== Demo 2: 数据传递 ==================== */

const demo2Schema: PageSchema = {
  root: {
    id: 'demo2-root',
    type: 'container',
    props: { style: { padding: '24px' } },
    children: [
      {
        id: 'demo2-title',
        type: 'text',
        props: { content: 'Demo 2: 输入框计算结果展示', as: 'h3' },
      },
      {
        id: 'demo2-desc',
        type: 'text',
        props: {
          content: '输入数字后，通过 custom-code 动作计算并将结果存入变量，下方通过 {{sum}} 模板语法展示。',
          style: { color: '#666', marginBottom: '16px' },
        },
      },
      {
        id: 'demo2-form',
        type: 'form',
        props: { style: { maxWidth: '300px' } },
        children: [
          {
            id: 'demo2-input-a',
            type: 'form-input',
            props: { name: 'numA', label: '数字 A', type: 'number', placeholder: '请输入数字' },
            events: [
              {
                event: 'change',
                actions: [
                  {
                    id: 'calc-on-a',
                    type: 'custom-code',
                    config: {
                      code: `
                        const a = parseFloat(event.target.value) || 0;
                        const b = parseFloat(context.variables.get('numB')) || 0;
                        context.variables.set('numA', a);
                        context.variables.set('sum', a + b);
                        context.variables.set('product', a * b);
                        context.variables.set('hasResult', true);
                      `,
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'demo2-input-b',
            type: 'form-input',
            props: { name: 'numB', label: '数字 B', type: 'number', placeholder: '请输入数字' },
            events: [
              {
                event: 'change',
                actions: [
                  {
                    id: 'calc-on-b',
                    type: 'custom-code',
                    config: {
                      code: `
                        const a = parseFloat(context.variables.get('numA')) || 0;
                        const b = parseFloat(event.target.value) || 0;
                        context.variables.set('numB', b);
                        context.variables.set('sum', a + b);
                        context.variables.set('product', a * b);
                        context.variables.set('hasResult', true);
                      `,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'demo2-result-section',
        type: 'section',
        props: {
          condition: {
            field: 'hasResult',
            operator: 'eq',
            value: true,
          },
          style: {
            marginTop: '16px',
            padding: '16px',
            background: '#f6ffed',
            borderRadius: '8px',
            border: '1px solid #b7eb8f',
          },
        },
        children: [
          {
            id: 'demo2-sum',
            type: 'text',
            props: { content: '求和结果：{{sum}}' },
          },
          {
            id: 'demo2-product',
            type: 'text',
            props: { content: '乘积结果：{{product}}' },
          },
        ],
      },
    ],
  },
};

/* ==================== Demo 3: 弹窗通信 ==================== */

const demo3Schema: PageSchema = {
  root: {
    id: 'demo3-root',
    type: 'container',
    props: { style: { padding: '24px' } },
    children: [
      {
        id: 'demo3-title',
        type: 'text',
        props: { content: 'Demo 3: 弹窗数据传递', as: 'h3' },
      },
      {
        id: 'demo3-desc',
        type: 'text',
        props: {
          content: '点击按钮打开弹窗，通过 open-modal 的 data 传递数据到弹窗。',
          style: { color: '#666', marginBottom: '16px' },
        },
      },
      {
        id: 'demo3-open-btn',
        type: 'button',
        props: { text: '打开确认弹窗' },
        events: [
          {
            event: 'click',
            actions: [
              {
                id: 'set-item-id',
                type: 'set-variable',
                config: { key: 'selectedItem', value: '商品 #12345', scope: 'page' },
              },
              {
                id: 'open-confirm-modal',
                type: 'open-modal',
                config: { modalId: 'demo3-modal' },
              },
            ],
          },
        ],
      },
      {
        id: 'demo3-modal',
        type: 'modal',
        props: { title: '确认操作', width: 420 },
        children: [
          {
            id: 'demo3-modal-text',
            type: 'text',
            props: { content: '你选择了：{{selectedItem}}\n确认要执行此操作吗？' },
          },
          {
            id: 'demo3-modal-actions',
            type: 'container',
            props: { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' } },
            children: [
              {
                id: 'demo3-cancel-btn',
                type: 'button',
                props: { text: '取消', variant: 'default' },
                events: [
                  {
                    event: 'click',
                    actions: [
                      {
                        id: 'close-modal',
                        type: 'close-modal',
                        config: { modalId: 'demo3-modal' },
                      },
                      {
                        id: 'cancel-toast',
                        type: 'toast',
                        config: { type: 'info', message: '已取消' },
                      },
                    ],
                  },
                ],
              },
              {
                id: 'demo3-confirm-btn',
                type: 'button',
                props: { text: '确认' },
                events: [
                  {
                    event: 'click',
                    actions: [
                      {
                        id: 'confirm-action',
                        type: 'toast',
                        config: { type: 'success', message: '操作已确认！' },
                      },
                      {
                        id: 'close-after-confirm',
                        type: 'close-modal',
                        config: { modalId: 'demo3-modal' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

/* ==================== 演示页面组件 ==================== */

const CommunicationDemo: React.FC = () => {
  const modalApiRef1 = useRef<ModalApi>({ open: () => {}, close: () => {} });
  const modalApiRef2 = useRef<ModalApi>({ open: () => {}, close: () => {} });
  const modalApiRef3 = useRef<ModalApi>({ open: () => {}, close: () => {} });

  const createActionContextFactory = useCallback(
    (modalApiRef: React.MutableRefObject<ModalApi>) =>
      (rootNode: SchemaNode): ActionContext => {
        const pageVars: Record<string, unknown> = {};
        const eventHandlers: Record<string, Array<(detail?: unknown) => void>> = {};

        return {
          sourceNode: rootNode,
          toast: {
            success: (msg: string) => message.success(msg),
            error: (msg: string) => message.error(msg),
            info: (msg: string) => message.info(msg),
            warning: (msg: string) => message.warning(msg),
          },
          navigate: (url: string, target: '_self' | '_blank' = '_self') => {
            if (target === '_blank') window.open(url, '_blank');
            else window.location.href = url;
          },
          modals: {
            open: (modalId: string, data?: Record<string, unknown>) => {
              modalApiRef.current.open(modalId, data);
            },
            close: (modalId: string) => {
              modalApiRef.current.close(modalId);
            },
          },
          variables: {
            get: (key: string) => pageVars[key],
            set: (key: string, value: unknown) => { pageVars[key] = value; },
            delete: (key: string) => { delete pageVars[key]; },
            clear: () => { Object.keys(pageVars).forEach((k) => { delete pageVars[k]; }); },
          },
          eventBus: {
            emit: (name: string, detail?: unknown) => {
              (eventHandlers[name] || []).forEach((handler) => handler(detail));
            },
            on: (name: string, handler: (detail?: unknown) => void) => {
              if (!eventHandlers[name]) eventHandlers[name] = [];
              eventHandlers[name].push(handler);
              return () => {
                eventHandlers[name] = eventHandlers[name].filter((h) => h !== handler);
              };
            },
          },
          getRootNode: () => rootNode,
        };
      },
    [],
  );

  const renderDemo = (
    schema: PageSchema,
    modalApiRef: React.MutableRefObject<ModalApi>,
    title: string,
    description: string,
  ) => (
    <Card style={{ marginBottom: 24 }}>
      <Title level={4}>{title}</Title>
      <Paragraph type="secondary">{description}</Paragraph>
      <ModalProvider schema={schema}>
        {(modalApi) => {
          modalApiRef.current = modalApi;
          return (
            <RendererProvider
              schema={schema}
              modalApi={modalApi}
              extraComponents={{
                container: Container,
                section: Section,
                row: SchemaRow,
                column: Column,
                text: Text,
                button: Button,
                divider: Divider,
                form: Form,
                'form-input': FormInput,
                'form-submit': FormSubmit,
                card: SchemaCard,
                modal: Modal,
              }}
              extraMiddlewares={[styleInjector]}
              actionContextFactory={createActionContextFactory(modalApiRef)}
            >
              <PageRenderer schema={schema} />
              <ModalPortals />
            </RendererProvider>
          );
        }}
      </ModalProvider>
    </Card>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>低代码组件通信演示</Title>
      <Paragraph>
        本页面演示了 page-schema 引擎中组件间通信的三种核心模式。
        所有配置均为纯 JSON，可序列化存储到数据库。
      </Paragraph>

      {renderDemo(
        demo1Schema,
        modalApiRef1,
        'Demo 1: 按钮控制面板显隐',
        '使用 set-variable 设置变量，condition 中间件在渲染时判断变量值决定是否渲染组件。',
      )}

      {renderDemo(
        demo2Schema,
        modalApiRef2,
        'Demo 2: 输入框计算结果展示',
        '使用 custom-code 执行计算逻辑，将结果存入变量，通过 {{sum}} 模板语法展示。',
      )}

      {renderDemo(
        demo3Schema,
        modalApiRef3,
        'Demo 3: 弹窗数据传递',
        '使用 open-modal 打开弹窗，通过 variables 传递数据到弹窗内部组件。',
      )}

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>通信机制总结</Title>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>场景</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>方案</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>动作</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '8px' }}>A 控制 B 显示/隐藏</td>
              <td style={{ padding: '8px' }}>set-variable + condition</td>
              <td style={{ padding: '8px' }}><AntText code>set-variable</AntText> + <AntText code>condition 中间件</AntText></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '8px' }}>B 展示 A 的计算结果</td>
              <td style={{ padding: '8px' }}>custom-code + {'{{}}'} 模板</td>
              <td style={{ padding: '8px' }}><AntText code>custom-code</AntText> + <AntText code>variable-parser 中间件</AntText></td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '8px' }}>打开弹窗并传递数据</td>
              <td style={{ padding: '8px' }}>open-modal + variables</td>
              <td style={{ padding: '8px' }}><AntText code>open-modal</AntText> + <AntText code>set-variable</AntText></td>
            </tr>
            <tr>
              <td style={{ padding: '8px' }}>组件间解耦通信</td>
              <td style={{ padding: '8px' }}>dispatch-event + EventBus</td>
              <td style={{ padding: '8px' }}><AntText code>dispatch-event</AntText> + <AntText code>custom-code (监听)</AntText></td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default CommunicationDemo;
