import React, { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef, memo } from 'react';
import {
  Button,
  Input,
  List,
  Upload,
  Modal,
  Form,
  message,
  Popconfirm,
  Empty,
  Spin,
  Progress,
  Tooltip,
  Switch,
} from 'antd';
import {
  DatabaseOutlined,
  UploadOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  knowledgeBaseService,
  type KnowledgeBaseResponse,
  type KnowledgeChunkResponse,
  type SearchResult,
} from '@services/knowledge-base';
import { useVirtualizer } from '@tanstack/react-virtual';
import './KnowledgeBasePanel.less';

interface Props {
  onClose: () => void;
}

// Fix filename encoding - when UTF-8 filenames are incorrectly decoded as Latin-1
const fixFilenameEncoding = (filename: string): string => {
  // Check if filename contains garbled characters
  if (/[æ°ä¸å¨æ¤åè®¡¥]/g.test(filename)) {
    try {
      // Re-encode as Latin-1 to get original UTF-8 bytes, then decode as UTF-8
      const buffer = Buffer.from(filename, 'latin1');
      return buffer.toString('utf-8');
    } catch {
      return filename;
    }
  }
  return filename;
};

/** 首帧估算行高（含底部间距）；真实高度由 measureElement 测量 */
const CHUNK_ROW_ESTIMATE_HEIGHT = 96;

/**
 * 列表可视区高度：用视口算，不用量 DOM。
 * 旧方案用 ResizeObserver 量 virtual-host 时，VirtualList 先按较小 height 渲染会把 flex 父级压扁，读数常卡在 ~220px，和大屏无关。
 */
const CHUNKS_LIST_VIEWPORT_MIN = 320;
const CHUNKS_LIST_VIEWPORT_MAX = 780;
const CHUNKS_LIST_HEIGHT_OFFSET = 200;

const resolveChunksListViewportHeight = (): number => {
  if (typeof window === 'undefined') {
    return 560;
  }
  return Math.min(
    CHUNKS_LIST_VIEWPORT_MAX,
    Math.max(CHUNKS_LIST_VIEWPORT_MIN, Math.floor(window.innerHeight - CHUNKS_LIST_HEIGHT_OFFSET)),
  );
};

const getChunkListTitle = (chunk: KnowledgeChunkResponse): string => {
  const fallback = `文本块 #${chunk.chunkIndex + 1}`;
  if (!chunk.metadata) {
    return fallback;
  }
  try {
    const raw = JSON.parse(chunk.metadata) as { fileName?: string };
    const name = typeof raw.fileName === 'string' ? fixFilenameEncoding(raw.fileName) : '';
    return name.trim() ? name : fallback;
  } catch {
    return fallback;
  }
};

interface KnowledgeChunksVirtualListProps {
  chunks: KnowledgeChunkResponse[];
  height: number;
  onDeleteChunk: (chunkId: string) => void;
}

const KnowledgeChunksVirtualList: React.FC<KnowledgeChunksVirtualListProps> = memo(
  function KnowledgeChunksVirtualList({ chunks, height, onDeleteChunk }) {
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);

    const overscan = useMemo(
      () => Math.min(48, Math.max(10, Math.ceil(height / CHUNK_ROW_ESTIMATE_HEIGHT) + 6)),
      [height],
    );

    const virtualizer = useVirtualizer({
      count: chunks.length,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => CHUNK_ROW_ESTIMATE_HEIGHT,
      overscan,
      getItemKey: (index) => chunks[index]?.id ?? index,
    });

    return (
      <div
        ref={scrollRef}
        className="kb-chunks-tanstack-scroll"
        style={{ height, width: '100%' }}
      >
        <div
          className="kb-chunks-tanstack-inner"
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const chunk = chunks[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                className="kb-chunks-virtual-row"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="kb-chunks-virtual-row__shell">
                  <div className="kb-chunks-virtual-row__body">
                    <div className="kb-chunks-virtual-row__title">{getChunkListTitle(chunk)}</div>
                    <div className="kb-chunks-virtual-row__snippet">
                      {chunk.content.length > 200 ? `${chunk.content.slice(0, 200)}...` : chunk.content}
                    </div>
                  </div>
                  <div className="kb-chunks-virtual-row__actions">
                    <Popconfirm
                      title={t('chat.deleteChunkConfirm') || '确定删除？'}
                      onConfirm={() => onDeleteChunk(chunk.id)}
                      okText={t('common.ok')}
                      cancelText={t('common.cancel')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        {t('common.delete')}
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

const KnowledgeBasePanel: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBaseResponse | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBaseResponse | null>(null);
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [chunks, setChunks] = useState<KnowledgeChunkResponse[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingKbId, setUploadingKbId] = useState<string | null>(null);
  const [togglingKbId, setTogglingKbId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [chunksListViewportHeight, setChunksListViewportHeight] = useState(resolveChunksListViewportHeight);

  const formatRelevance = (score: number): string => {
    const normalizedScore = Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : 0;
    return `${(normalizedScore * 100).toFixed(1)}%`;
  };

  const loadKnowledgeBases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await knowledgeBaseService.getAll();
      setKnowledgeBases(data);
    } catch (_err) {
      message.error(t('chat.loadFailed') || '加载知识库失败');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  useLayoutEffect(() => {
    if (!chunksModalOpen || chunksLoading || chunks.length === 0) {
      return undefined;
    }
    const update = () => {
      setChunksListViewportHeight(resolveChunksListViewportHeight());
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [chunksModalOpen, chunksLoading, chunks.length]);

  const handleCreate = async (values: { name: string; description?: string }) => {
    try {
      await knowledgeBaseService.create(values);
      message.success(t('chat.createSuccess') || '知识库创建成功');
      setCreateModalOpen(false);
      form.resetFields();
      loadKnowledgeBases();
    } catch (_err) {
      message.error(t('chat.createFailed') || '创建失败');
    }
  };

  const handleDelete = async (kb: KnowledgeBaseResponse) => {
    try {
      await knowledgeBaseService.delete(kb.id);
      message.success(t('chat.deleteSuccess') || '删除成功');
      loadKnowledgeBases();
      if (selectedKb?.id === kb.id) {
        setSelectedKb(null);
      }
    } catch (_err) {
      message.error(t('chat.deleteFailed') || '删除失败');
    }
  };

  const handleOpenEditModal = (kb: KnowledgeBaseResponse) => {
    setEditingKb(kb);
    editForm.setFieldsValue({
      name: kb.name,
      description: kb.description || '',
      useInChat: kb.status === 'active',
    });
    setEditModalOpen(true);
  };

  const handleToggleKbChatRetrieval = async (
    kb: KnowledgeBaseResponse,
    enabled: boolean,
  ) => {
    const nextStatus = enabled ? 'active' : 'inactive';
    if (kb.status === nextStatus) return;
    setTogglingKbId(kb.id);
    try {
      const updated = await knowledgeBaseService.update(kb.id, {
        status: nextStatus,
      });
      setKnowledgeBases((prev) => prev.map((k) => (k.id === kb.id ? updated : k)));
      if (selectedKb?.id === kb.id) {
        setSelectedKb(updated);
      }
      message.success(t('chat.updateSuccess'));
    } catch (_err) {
      message.error(t('chat.updateFailed'));
    } finally {
      setTogglingKbId(null);
    }
  };

  const handleSubmitEdit = async (values: {
    name: string;
    description?: string;
    useInChat?: boolean;
  }) => {
    if (!editingKb) return;
    const nextName = values.name.trim();
    const nextDescription = (values.description || '').trim();
    if (!nextName) {
      message.warning(t('chat.nameRequired') || '请输入知识库名称');
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await knowledgeBaseService.update(editingKb.id, {
        name: nextName,
        description: nextDescription,
        status: values.useInChat === false ? 'inactive' : 'active',
      });
      message.success(t('chat.updateSuccess') || '更新成功');
      setEditModalOpen(false);
      setEditingKb(null);
      editForm.resetFields();
      await loadKnowledgeBases();
      if (selectedKb?.id === editingKb.id) {
        setSelectedKb(updated);
      }
    } catch (_err) {
      message.error(t('chat.updateFailed') || '更新失败');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpload = (kbId: string, file: File) => {
    setUploadingKbId(kbId);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/knowledge-base/${kbId}/documents`);

    // Get auth token
    const token = localStorage.getItem('access_token') || localStorage.getItem('user-token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setUploadingKbId(null);
      setUploadProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        message.success(t('chat.uploadSuccess') || '文档上传成功');
        loadKnowledgeBases();
      } else {
        message.error(t('chat.uploadFailed') || '上传失败');
      }
    };

    xhr.onerror = () => {
      setUploadingKbId(null);
      setUploadProgress(0);
      message.error(t('chat.uploadFailed') || '上传失败');
    };

    xhr.send(formData);
    return false;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await knowledgeBaseService.search({
        query: searchQuery,
        knowledgeBaseIds: selectedKb ? [selectedKb.id] : undefined,
        topK: 5,
      });
      setSearchResults(results);
    } catch (_err) {
      message.error(t('chat.searchFailed') || '搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const loadChunks = async (kbId: string) => {
    setChunksLoading(true);
    try {
      const data = await knowledgeBaseService.getChunks(kbId);
      setChunks(data);
    } catch (_err) {
      message.error(t('chat.loadChunksFailed') || '加载chunks失败');
    } finally {
      setChunksLoading(false);
    }
  };

  const handleViewChunks = async (kb: KnowledgeBaseResponse) => {
    setSelectedKb(kb);
    setChunksModalOpen(true);
    await loadChunks(kb.id);
  };

  const handleDeleteChunk = async (chunkId: string) => {
    try {
      await knowledgeBaseService.deleteChunk(chunkId);
      message.success(t('chat.deleteChunkSuccess') || '删除成功');
      if (selectedKb) {
        await loadChunks(selectedKb.id);
        // Refresh knowledge bases to update chunk count
        const updated = await knowledgeBaseService.getAll();
        setKnowledgeBases(updated);
      }
    } catch (_err) {
      message.error(t('chat.deleteChunkFailed') || '删除失败');
    }
  };

  return (
    <div className="knowledge-base-panel">
      <div className="panel-header">
        <div className="panel-title">
          <DatabaseOutlined />
          <span>{t('chat.knowledgeBase')}</span>
        </div>
        <Button type="text" size="small" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>

      <div className="panel-content">
        <div className="search-section">
          <div className="section-header">
            <SearchOutlined />
            <span>{t('chat.knowledgeSearch')}</span>
          </div>
          <div className="search-row">
            <Input
              placeholder={t('chat.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              className="search-input"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={searching}
            >
              {t('common.search')}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div key={result.id} className="search-result-item">
                  <div className="result-header">
                    <FileTextOutlined />
                    <span className="result-kb-name">{result.knowledgeBaseName}</span>
                    <span className="result-file-name">{result.metadata ? fixFilenameEncoding(JSON.parse(result.metadata).fileName) : ''}</span>
                    <span className="result-score">
                      {t('chat.relevance')}: {formatRelevance(result.score)}
                    </span>
                  </div>
                  <div className="result-content">{result.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        <div className="kb-section">
          <div className="section-header">
            <DatabaseOutlined />
            <span>{t('chat.myKnowledgeBases')}</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              className="create-btn"
            >
              {t('chat.createKnowledgeBase')}
            </Button>
          </div>

          {loading ? (
            <Spin />
          ) : knowledgeBases.length === 0 ? (
            <Empty description={t('chat.noKnowledgeBases')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              className="kb-list"
              dataSource={knowledgeBases}
              renderItem={(kb) => (
                <List.Item
                  className={`kb-item ${selectedKb?.id === kb.id ? 'selected' : ''} ${kb.status !== 'active' ? 'kb-item--rag-off' : ''}`}
                  onClick={() => setSelectedKb(kb)}
                >
                  <div className="kb-card">
                    <div className="kb-main">
                      <div className="kb-icon">
                        <DatabaseOutlined />
                      </div>
                      <div className="kb-content">
                        <div className="kb-title-row">
                          <span className="kb-title">{kb.name}</span>
                          <div
                            className="kb-title-actions"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Tooltip title={t('chat.kbChatRetrievalHint')}>
                              <span className="kb-title-rag">
                                <span className="kb-title-rag__label">
                                  {t('chat.kbChatRetrieval')}
                                </span>
                                <Switch
                                  size="small"
                                  checked={kb.status === 'active'}
                                  loading={togglingKbId === kb.id}
                                  onChange={(checked) => {
                                    void handleToggleKbChatRetrieval(kb, checked);
                                  }}
                                />
                              </span>
                            </Tooltip>
                            <Tooltip title={t('common.edit')}>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(kb);
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                        <div className="kb-description-text">
                          {kb.description?.trim() || t('chat.noDescription')}
                        </div>
                        <div className="kb-meta-row">
                          <span className="kb-meta-pill">
                            {kb.chunkCount} 文本块
                          </span>
                          <span className={`status-badge status-${kb.status}`}>
                            {kb.status === 'active' ? t('common.active') : t('common.inactive')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="kb-actions">
                      <Button
                        type="primary"
                        size="small"
                        icon={<FileTextOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleViewChunks(kb);
                        }}
                      >
                        {t('chat.viewChunks')}
                      </Button>
                      <Upload
                        showUploadList={false}
                        beforeUpload={(file) => {
                          void handleUpload(kb.id, file);
                          return false;
                        }}
                        accept=".pdf,.txt,.md,.docx"
                      >
                        <Button size="small" icon={<UploadOutlined />}>
                          {t('chat.upload')}
                        </Button>
                      </Upload>
                      <Popconfirm
                        title={t('chat.deleteConfirm')}
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          void handleDelete(kb);
                        }}
                        okText={t('common.ok')}
                        cancelText={t('common.cancel')}
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t('common.delete')}
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                  {uploadingKbId === kb.id && (
                    <Progress
                      percent={uploadProgress}
                        size="small"
                      showInfo={false}
                      className="upload-progress"
                    />
                  )}
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        title={t('chat.createKnowledgeBase')}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label={t('chat.name')}
            rules={[{ required: true, message: t('chat.nameRequired') || '请输入知识库名称' }]}
          >
            <Input placeholder={t('chat.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('chat.description')}
          >
            <Input.TextArea
              placeholder={t('chat.descriptionPlaceholder')}
              rows={3}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('common.create')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('common.edit')}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingKb(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} onFinish={handleSubmitEdit} layout="vertical">
          <Form.Item
            name="name"
            label={t('chat.name')}
            rules={[{ required: true, message: t('chat.nameRequired') || '请输入知识库名称' }]}
          >
            <Input placeholder={t('chat.namePlaceholder')} maxLength={60} />
          </Form.Item>
          <Form.Item
            name="description"
            label={t('chat.description')}
          >
            <Input.TextArea
              placeholder={t('chat.descriptionPlaceholder')}
              rows={3}
              maxLength={300}
            />
          </Form.Item>
          <Form.Item
            name="useInChat"
            valuePropName="checked"
            label={t('chat.kbChatRetrieval')}
            tooltip={t('chat.kbChatRetrievalHint')}
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={savingEdit}>
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${t('chat.chunksManage')} - ${selectedKb?.name || ''}`}
        open={chunksModalOpen}
        onCancel={() => setChunksModalOpen(false)}
        footer={null}
        width={700}
        centered
        wrapClassName="kb-chunks-manage-modal"
      >
        <div className="kb-chunks-modal-stack">
          {chunksLoading ? (
            <div className="kb-chunks-modal-loading">
              <Spin />
            </div>
          ) : chunks.length === 0 ? (
            <div className="kb-chunks-modal-empty">
              <Empty description={t('chat.noChunks')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div className="kb-chunks-modal-body">
              <div className="kb-chunks-virtual-host">
                <KnowledgeChunksVirtualList
                  chunks={chunks}
                  height={chunksListViewportHeight}
                  onDeleteChunk={handleDeleteChunk}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default KnowledgeBasePanel;
