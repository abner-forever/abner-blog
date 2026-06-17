import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import type { UploadFile } from 'antd';
import {
  ArrowLeftOutlined,
  SettingOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Loading from '@/components/Loading';
import BlogEditorForm from '../BlogEditorForm';
import {
  blogsControllerFindOne,
  blogsControllerUpdate,
} from '@services/generated/blogs/blogs';
import type { MdPreviewTheme } from '@components/MarkdownEditor';
import {
  useAutoSaveDraft,
  checkDraftExists,
  getDraft,
} from '@hooks/useAutoSaveDraft';
import '../BlogEditor.less';

const EditBlog: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cover, setCover] = useState('');
  const [mdTheme, setMdTheme] = useState<MdPreviewTheme>('default');
  const [category, setCategory] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blogLoaded, setBlogLoaded] = useState(false);
  const blogFetchRef = useRef(false);

  const autoSave = useAutoSaveDraft({
    blogId: id,
    title,
    content,
    tags,
    cover,
    mdTheme: mdTheme as string,
    category,
    enabled: blogLoaded,
  });

  useEffect(() => {
    if (blogFetchRef.current) return;
    blogFetchRef.current = true;

    const fetchBlog = async () => {
      try {
        const blog = await blogsControllerFindOne(id!);

        if (checkDraftExists(id)) {
          const draft = getDraft(id);
          if (draft && draft.timestamp > new Date(blog.updatedAt || 0).getTime()) {
            Modal.confirm({
              title: t('blog.restoreDraftTitle', '发现未保存的草稿'),
              content: t(
                'blog.restoreDraftContent',
                '本地草稿比服务器内容更新，是否恢复草稿？',
              ),
              okText: t('blog.restoreDraft', '恢复草稿'),
              cancelText: t('blog.useServer', '使用服务器版本'),
              onOk() {
                setTitle(draft.title || blog.title || '');
                setContent(draft.content || blog.content || '');
                setTags(draft.tags || blog.tags || []);
                setCover(draft.cover || blog.cover || '');
                setMdTheme(
                  (draft.mdTheme as MdPreviewTheme) ||
                    (blog.mdTheme as MdPreviewTheme) ||
                    'default',
                );
                setCategory(draft.category || '');
              },
              onCancel() {
                setTitle(blog.title || '');
                setContent(blog.content || '');
                setTags(blog.tags || []);
                setCover(blog.cover || '');
                setMdTheme(
                  (blog.mdTheme as MdPreviewTheme) || 'default',
                );
                setCategory('');
                autoSave.clearDraft();
              },
            });
          } else {
            setTitle(blog.title || '');
            setContent(blog.content || '');
            setTags(blog.tags || []);
            setCover(blog.cover || '');
            setMdTheme(
              (blog.mdTheme as MdPreviewTheme) || 'default',
            );
            setCategory('');
          }
        } else {
          setTitle(blog.title || '');
          setContent(blog.content || '');
          setTags(blog.tags || []);
          setCover(blog.cover || '');
          setMdTheme(
            (blog.mdTheme as MdPreviewTheme) || 'default',
          );
          setCategory('');
        }
      } catch (err) {
        console.error('获取博客失败:', err);
        message.error(t('blog.getBlogFailed'));
        navigate('/blogs');
      } finally {
        setLoading(false);
        setBlogLoaded(true);
      }
    };

    fetchBlog();
  }, [id, navigate, t]);

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
      await blogsControllerUpdate(id!, {
        title: title.trim(),
        content,
        summary,
        tags,
        cover: cover.trim() || undefined,
        mdTheme: mdTheme !== 'default' ? mdTheme : undefined,
      } as Parameters<typeof blogsControllerUpdate>[1]);
      autoSave.clearDraft();
      message.success(t('blog.updateSuccess'));
      navigate(`/blogs/${id}`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : t('blog.updateFailed');
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

  if (loading) {
    return (
      <div className="juejin-editor">
        <header className="juejin-editor__header">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined />
          </button>
          <div
            className="juejin-editor__body"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loading size="small" tip={t('common.loading')} />
          </div>
        </header>
      </div>
    );
  }

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
            {t('blog.save')}
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
          submitText={t('blog.save')}
        />
      </div>
    </div>
  );
};

export default EditBlog;
