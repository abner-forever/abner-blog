import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import type { UploadFile } from 'antd';
import {
  ArrowLeftOutlined,
  SettingOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import BlogEditorForm from '../BlogEditorForm';
import { blogsControllerCreate } from '@services/generated/blogs/blogs';
import type { MdPreviewTheme } from '@components/MarkdownEditor';
import {
  useAutoSaveDraft,
  checkDraftExists,
  getDraft,
} from '@hooks/useAutoSaveDraft';
import '../BlogEditor.less';

const CreateBlog: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cover, setCover] = useState('');
  const [mdTheme, setMdTheme] = useState<MdPreviewTheme>('default');
  const [category, setCategory] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const draftRestoredRef = useRef(false);

  const autoSave = useAutoSaveDraft({
    title,
    content,
    tags,
    cover,
    mdTheme: mdTheme as string,
    category,
    enabled: true,
  });

  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;

    if (checkDraftExists()) {
      Modal.confirm({
        title: t('blog.restoreDraftTitle', '发现未保存的草稿'),
        content: t(
          'blog.restoreDraftContent',
          '是否恢复上次未保存的内容？',
        ),
        okText: t('blog.restoreDraft', '恢复草稿'),
        cancelText: t('blog.discardDraft', '丢弃'),
        onOk() {
          const draft = getDraft();
          if (draft) {
            setTitle(draft.title || '');
            setContent(draft.content || '');
            setTags(draft.tags || []);
            setCover(draft.cover || '');
            setMdTheme((draft.mdTheme as MdPreviewTheme) || 'default');
            setCategory(draft.category || '');
          }
        },
        onCancel() {
          autoSave.clearDraft();
        },
      });
    }
  }, [t]);

  const handleSubmit = async (summary: string) => {
    if (!content.trim()) {
      message.error(t('blog.pleaseEnterContent'));
      return;
    }
    if (!title.trim()) {
      message.error(t('blog.titleRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await blogsControllerCreate({
        title: title.trim(),
        content,
        summary,
        tags,
        cover: cover.trim() || undefined,
        mdTheme: mdTheme !== 'default' ? mdTheme : undefined,
      } as Parameters<typeof blogsControllerCreate>[0]);
      autoSave.clearDraft();
      message.success(t('blog.createSuccess'));
      navigate('/');
    } catch (err: unknown) {
      console.error('创建博客失败:', err);
      const errorMessage =
        err instanceof Error &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'message' in err.response.data
          ? String((err.response as { data: { message: string } }).data.message)
          : t('blog.createFailed');
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportMd = (file: UploadFile) => {
    if (!file) return false;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (content && content.trim()) {
        message.warning(t('blog.importReplaceWarning'));
      }
      setContent(text);
      message.success(t('blog.importSuccess'));
    };
    reader.onerror = () => {
      message.error(t('blog.importFailed'));
    };
    reader.readAsText(file as unknown as File);
    return false;
  };

  return (
    <div className="juejin-editor">
      <header className="juejin-editor__header">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>

        <input
          type="text"
          className="header-title-input"
          placeholder={t('blog.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="header-actions">
          <span
            className={`auto-save-status auto-save-status--${autoSave.status}`}
          >
            {autoSave.status === 'saving' &&
              t('blog.autoSaving', '保存中...')}
            {autoSave.status === 'saved' &&
              t('blog.autoSaved', '已保存')}
            {autoSave.status === 'error' &&
              t('blog.autoSaveFailed', '保存失败')}
          </span>

          <button
            type="button"
            className={`settings-btn ${drawerOpen ? 'active' : ''}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <SettingOutlined />
          </button>

          <button
            type="button"
            className="import-btn-header"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.md,.markdown,.txt';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImportMd(file as unknown as UploadFile);
              };
              input.click();
            }}
          >
            <ImportOutlined />
          </button>

          <button
            type="button"
            className="publish-btn-header"
            onClick={() => setDrawerOpen(true)}
          >
            {t('blog.publish')}
          </button>
        </div>
      </header>

      <div className="juejin-editor__body">
        <BlogEditorForm
          content={content}
          onContentChange={setContent}
          tags={tags}
          onTagsChange={setTags}
          cover={cover}
          onCoverChange={setCover}
          mdTheme={mdTheme}
          onMdThemeChange={setMdTheme}
          category={category}
          onCategoryChange={setCategory}
          submitting={submitting}
          onSubmit={handleSubmit}
          drawerOpen={drawerOpen}
          onDrawerOpenChange={setDrawerOpen}
          submitText={t('blog.publish')}
        />
      </div>
    </div>
  );
};

export default CreateBlog;
