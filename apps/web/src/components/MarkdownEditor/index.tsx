import React from 'react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import { message } from 'antd';
import { UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '@services/simpleImageUploader';
import { useAppSelector } from '@store/reduxHooks';

export type MdPreviewTheme =
  | 'default'
  | 'github'
  | 'vuepress'
  | 'mk-cute'
  | 'smart-blue'
  | 'cyanosis';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  previewTheme?: MdPreviewTheme;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '开始写作...',
  height = 'calc(100vh - 400px)',
  previewTheme = 'default',
}) => {
  const { theme } = useAppSelector((state) => state.theme);
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const onUploadImg = async (
    files: File[],
    callback: (urls: string[]) => void,
  ) => {
    try {
      const uploader = createSimpleImageUploader('markdown', true);
      const res = await Promise.all(files.map((file) => uploader.upload(file)));
      const urls = res
        .filter(
          (task) => task.status === UploadStatus.COMPLETED && task.url,
        )
        .map((task) => task.url as string);
      if (urls.length !== files.length) {
        throw new Error('部分图片上传失败');
      }
      callback(urls);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '图片上传失败';
      message.error(errMsg);
    }
  };

  return (
    <div className="markdown-editor-wrapper">
      <MdEditor
        modelValue={value}
        onChange={onChange}
        placeholder={placeholder}
        onUploadImg={onUploadImg}
        theme={isDark ? 'dark' : 'light'}
        previewTheme={previewTheme}
        style={{ height }}
        toolbars={[
          'bold',
          'underline',
          'italic',
          '-',
          'strikeThrough',
          'title',
          'sub',
          'sup',
          'quote',
          'unorderedList',
          'orderedList',
          'task',
          '-',
          'codeRow',
          'code',
          'link',
          'image',
          'table',
          'mermaid',
          'katex',
          '-',
          'revoke',
          'next',
          'save',
          '=',
          'pageFullscreen',
          'fullscreen',
          'preview',
          'htmlPreview',
          'catalog',
          'github',
        ]}
      />
    </div>
  );
};

export default MarkdownEditor;
