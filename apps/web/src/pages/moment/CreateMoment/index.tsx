import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Card, message, Space } from 'antd';
import {
  ArrowLeftOutlined,
  PictureOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import {
  momentsControllerCreate,
  momentsControllerUpdate,
  momentsControllerFindOne,
} from '../../../services/generated/moments/moments';
import { UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '@services/simpleImageUploader';
import { httpMutator } from '../../../services/http';
import { useQueryClient } from '@tanstack/react-query';
import type {
  MomentTopicDto,
  MomentDto,
  CreateMomentDto,
} from '@services/generated/model';
import './index.less';

const { TextArea } = Input;
const { Option } = Select;

const CreateMoment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [topics, setTopics] = useState<MomentTopicDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const isEditMode = Boolean(id);

  const fetchTopics = useCallback(async () => {
    try {
      const data = await httpMutator<MomentTopicDto[]>({
        url: '/api/topics',
        method: 'GET',
      });
      setTopics(data || []);
    } catch (error) {
      console.error('获取话题列表失败:', error);
    }
  }, []);

  const fetchMomentDetail = useCallback(
    async (momentId: string) => {
      try {
        const detail = (await momentsControllerFindOne(momentId)) as MomentDto;
        form.setFieldsValue({
          content: detail.content,
          topicId: detail.topic?.id,
        });
        const existingFiles: UploadFile[] = (detail.images || []).map(
          (url, index) => ({
            uid: `existing-${index}`,
            name: `image-${index}.png`,
            status: 'done' as const,
            url,
          }),
        );
        setFileList(existingFiles);
      } catch {
        message.error(t('moment.getDetailFailed'));
        navigate('/moments');
      }
    },
    [form, navigate, t],
  );

  const handlePasteImages = useCallback(async (files: File[]) => {
    const maxCount = 9 - fileList.length;
    const filesToProcess = files.slice(0, maxCount);

    const newFiles: UploadFile[] = filesToProcess.map((file, index) => ({
      uid: `paste-${Date.now()}-${index}`,
      name: file.name || `image-${Date.now()}-${index}.png`,
      status: 'uploading' as const,
      originFileObj: file as RcFile,
    }));

    setFileList((prev) => [...prev, ...newFiles]);

    // 上传每个图片
    for (const file of newFiles) {
      if (file.originFileObj) {
        try {
          const task = await createSimpleImageUploader('moments').upload(
            file.originFileObj as File,
          );
          if (task.status !== UploadStatus.COMPLETED || !task.url) {
            throw new Error(task.error || '上传失败');
          }
          const url = task.url;
          setFileList((prev) =>
            prev.map((f) =>
              f.uid === file.uid ? { ...f, status: 'done', url } : f,
            ),
          );
        } catch (error) {
          console.error('上传图片失败:', error);
          message.error('图片上传失败，请重试');
          setFileList((prev) =>
            prev.map((f) =>
              f.uid === file.uid ? { ...f, status: 'error' } : f,
            ),
          );
        }
      }
    }
  }, [fileList]);

  useEffect(() => {
    void fetchTopics();
    if (id) {
      void fetchMomentDetail(id);
    }
  }, [id, fetchTopics, fetchMomentDetail]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await handlePasteImages(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePasteImages]);

  const handleSubmit = async (values: CreateMomentDto) => {
    setLoading(true);
    try {
      // 收集所有已上传的图片URL
      const imageUrls = fileList
        .filter((file) => file.status === 'done' && file.url)
        .map((file) => file.url as string);

      const payload: CreateMomentDto = {
        content: values.content,
        // 确保 topicId 是数字类型
        topicId: values.topicId ? Number(values.topicId) : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      };

      console.log('发布动态 payload:', payload);

      if (id) {
        await momentsControllerUpdate(
          id,
          payload as Parameters<typeof momentsControllerUpdate>[1],
        );
      } else {
        await momentsControllerCreate(
          payload as Parameters<typeof momentsControllerCreate>[0],
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['moments'] });
      message.success(
        id ? t('moment.updateSuccess', '更新成功') : t('moment.publishSuccess'),
      );
      navigate('/moments');
    } catch (error: unknown) {
      console.error('发布失败:', error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        t('moment.publishFailed');
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 拖拽处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );

    if (files.length > 0) {
      await handlePasteImages(files);
    }
  };

  const removeImage = (uid: string) => {
    setFileList((prev) => prev.filter((file) => file.uid !== uid));
  };

  return (
    <div
      className={`create-moment-page ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽提示层 */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-hint">
            <PictureOutlined className="drag-icon" />
            <span>松开鼠标上传图片</span>
          </div>
        </div>
      )}

      <div className="create-moment-container">
        <Card className="create-card">
          <div className="page-header">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/moments')}
            >
              {t('common.back')}
            </Button>
            <h1 className="page-title">
              {isEditMode
                ? t('moment.editTitle', '编辑动态')
                : t('moment.publishTitle')}
            </h1>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            {/* 掘金风发布框 */}
            <div
              ref={pasteAreaRef}
              className={`moment-editor ${contentFocused || form.getFieldValue('content') ? 'focused' : ''}`}
            >
              {/* noStyle 保持自定义布局，同时将输入值正确绑定到 form */}
              <Form.Item name="content" noStyle>
                <TextArea
                  placeholder="有什么新鲜事想分享给大家？"
                  autoSize={{ minRows: contentFocused ? 5 : 3, maxRows: 15 }}
                  onFocus={() => setContentFocused(true)}
                  onBlur={() =>
                    !form.getFieldValue('content') && setContentFocused(false)
                  }
                  maxLength={1000}
                  showCount
                  className="moment-textarea"
                />
              </Form.Item>

              {/* 图片预览区域 */}
              {fileList.length > 0 && (
                <div className="image-preview-grid">
                  {fileList.map((file) => (
                    <div key={file.uid} className="preview-item">
                      {file.status === 'uploading' ? (
                        <div className="uploading-placeholder">
                          <span className="upload-spinner" />
                          上传中...
                        </div>
                      ) : file.status === 'error' ? (
                        <div className="upload-error-placeholder">上传失败</div>
                      ) : (
                        <img
                          src={
                            file.url ||
                            URL.createObjectURL(file.originFileObj as File)
                          }
                          alt=""
                        />
                      )}
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeImage(file.uid)}
                      >
                        <CloseOutlined />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 底部工具栏 */}
              <div className="editor-footer">
                <div className="footer-left">
                  <Button
                    type="text"
                    icon={<PictureOutlined />}
                    className="footer-action-btn"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = async (e) => {
                        const files = Array.from(
                          (e.target as HTMLInputElement).files || [],
                        );
                        if (files.length > 0) {
                          await handlePasteImages(files);
                        }
                      };
                      input.click();
                    }}
                  />
                  <span className="paste-hint">支持粘贴或拖拽图片</span>
                </div>
              </div>
            </div>

            <Form.Item name="topicId" label="选择话题（可选）">
              <Select
                placeholder="添加话题让更多人看到"
                allowClear
                showSearch
                optionFilterProp="children"
                className="topic-select"
              >
                {topics.map((topic) => (
                  <Option key={topic.id} value={topic.id}>
                    #{topic.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item className="submit-row">
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEditMode ? t('common.save', '保存') : '发布'}
                </Button>
                <Button onClick={() => navigate('/moments')}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateMoment;
