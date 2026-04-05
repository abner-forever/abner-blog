import React, { useState } from 'react';
import { Form, Input, Button, Space, Tag, Select, Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownEditor, {
  type MdPreviewTheme,
} from '@components/MarkdownEditor';
import CoverUploader from '@components/CoverUploader';
import '../BlogEditor.less';

interface BlogEditorFormProps {
  content: string;
  onContentChange: (content: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  cover: string;
  onCoverChange: (cover: string) => void;
  mdTheme: MdPreviewTheme;
  onMdThemeChange: (theme: MdPreviewTheme) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  submitting: boolean;
  onSubmit: (summary: string) => Promise<void>;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  submitText: string;
}

const MD_THEMES: { value: MdPreviewTheme; label: string; color: string }[] = [
  { value: 'default', label: 'Default', color: '#6366f1' },
  { value: 'github', label: 'GitHub', color: '#24292e' },
  { value: 'vuepress', label: 'VuePress', color: '#3eaf7c' },
  { value: 'mk-cute', label: 'MK Cute', color: '#e91e63' },
  { value: 'smart-blue', label: 'Smart Blue', color: '#1677ff' },
  { value: 'cyanosis', label: 'Cyanosis', color: '#0abde3' },
];

const CATEGORIES = [
  { value: 'tech', label: '技术' },
  { value: 'life', label: '生活' },
  { value: 'design', label: '设计' },
  { value: 'product', label: '产品' },
  { value: 'other', label: '其他' },
];

const BlogEditorForm: React.FC<BlogEditorFormProps> = ({
  content,
  onContentChange,
  tags,
  onTagsChange,
  cover,
  onCoverChange,
  mdTheme,
  onMdThemeChange,
  category,
  onCategoryChange,
  submitting,
  onSubmit,
  drawerOpen,
  onDrawerOpenChange,
  submitText,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleDrawerClose = () => {
    onDrawerOpenChange(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 如果摘要为空，自动截取正文前 200 字
      const summary =
        values.summary?.trim() ||
        content.replace(/[#*`>[]]/g, '').substring(0, 200) ||
        '';
      await onSubmit(summary);
    } catch {
      // validation failed, let drawer stay open
    }
  };

  const handleTagClose = (removedTag: string) => {
    onTagsChange(tags.filter((tag) => tag !== removedTag));
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      onTagsChange([...tags, inputValue]);
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputConfirm();
    }
  };

  return (
    <>
      {/* 左侧编辑区 */}
      <main className="juejin-editor__main">
        <div className="juejin-editor__editor-wrap">
          <MarkdownEditor
            value={content}
            onChange={onContentChange}
            placeholder={t('blog.startWriting')}
            previewTheme={mdTheme}
            height="100%"
          />
        </div>
      </main>

      {/* 右侧抽屉 */}
      <Drawer
        title={t('blog.articleSettings')}
        placement="right"
        size={360}
        open={drawerOpen}
        onClose={handleDrawerClose}
        className="juejin-editor-drawer"
        footer={
          <div className="drawer-footer">
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmit}
              block
            >
              {submitText}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="drawer-form">
          {/* 预览主题 */}
          <div className="sidebar-section">
            <div className="sidebar-section__label">
              {t('blog.previewTheme')}
            </div>
            <div className="theme-list">
              {MD_THEMES.map((themeItem) => (
                <button
                  key={themeItem.value}
                  type="button"
                  className={`theme-chip ${mdTheme === themeItem.value ? 'active' : ''}`}
                  style={
                    { '--chip-color': themeItem.color } as React.CSSProperties
                  }
                  onClick={() => onMdThemeChange(themeItem.value)}
                >
                  {themeItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* 分类 */}
          <div className="sidebar-section">
            <div className="sidebar-section__label">{t('blog.category')}</div>
            <Select
              placeholder={t('blog.selectCategory')}
              value={category || undefined}
              onChange={onCategoryChange}
              options={CATEGORIES}
              className="sidebar-select"
              allowClear
            />
          </div>

          {/* 标签 */}
          <div className="sidebar-section">
            <div className="sidebar-section__label">{t('blog.tags')}</div>
            <div className="blog-tags-container">
              <Space wrap size={[4, 4]}>
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleTagClose(tag)}
                    className="tag-item"
                  >
                    {tag}
                  </Tag>
                ))}
                {inputVisible ? (
                  <Input
                    type="text"
                    size="small"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputConfirm}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    className="tag-input"
                  />
                ) : (
                  <Tag onClick={showInput} className="add-tag-btn">
                    + {t('blog.addTag')}
                  </Tag>
                )}
              </Space>
            </div>
          </div>

          {/* 封面 */}
          <div className="sidebar-section">
            <div className="sidebar-section__label">{t('blog.cover')}</div>
            <CoverUploader value={cover} onChange={onCoverChange} />
          </div>

          {/* 摘要 */}
          <div className="sidebar-section">
            <div className="sidebar-section__label">
              {t('blog.summary')}
              <span className="section-label-hint">（选填）</span>
            </div>
            <Form.Item name="summary" className="summary-item">
              <Input.TextArea
                placeholder={t('blog.summaryPlaceholder')}
                autoSize={{ minRows: 3, maxRows: 6 }}
                showCount
                maxLength={200}
                className="summary-textarea"
              />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default BlogEditorForm;
