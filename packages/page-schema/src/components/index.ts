/**
 * 组件索引 — 导出所有内置渲染组件
 *
 * 分批导出说明：
 * - v1.1: UnknownComponent（降级组件）
 * - v1.2: 基础组件（Container, Section, Row, Column, Text, Image, Button, Divider, Spacer, Video, BilibiliVideo, TencentVideo）
 * - v1.3: 高级组件（Card, Accordion, Tabs, Carousel, Map, NavMenu, NavLink, HtmlEmbed）
 * - v1.4: 表单/数据组件（Form, FormInput, FormTextarea, FormSelect, FormCheckbox, FormSubmit, DataList, DataBadge）
 */

// v1.1 — 降级组件
export { UnknownComponent } from './Unknown';

// v1.2 — 基础组件
export { default as Container } from './Container';
export { default as Section } from './Section';
export { default as Row } from './Row';
export { default as Column } from './Column';
export { default as Text } from './Text';
export { default as Image } from './Image';
export { default as Button } from './Button';
export { default as Divider } from './Divider';
export { default as Spacer } from './Spacer';
export { default as Video } from './Video';
export { default as BilibiliVideo } from './BilibiliVideo';
export { default as TencentVideo } from './TencentVideo';

// v1.3 — 高级组件
export { default as Card } from './Card';
export { default as Accordion } from './Accordion';
export { default as Tabs } from './Tabs';
export { default as Carousel } from './Carousel';
export { default as Map } from './Map';
export { default as NavMenu } from './NavMenu';
export { default as NavLink } from './NavLink';
export { default as HtmlEmbed } from './HtmlEmbed';

// v1.4 — 表单/数据组件
export { default as Form } from './Form';
export { useFormContext } from './Form';
export { default as FormInput } from './FormInput';
export { default as FormTextarea } from './FormTextarea';
export { default as FormSelect } from './FormSelect';
export { default as FormCheckbox } from './FormCheckbox';
export { default as FormSubmit } from './FormSubmit';
export { default as DataList } from './DataList';
export { default as DataBadge } from './DataBadge';

// v1.5 — 弹窗组件
export { default as Modal } from './Modal';
export type { ModalComponentProps } from './Modal';
