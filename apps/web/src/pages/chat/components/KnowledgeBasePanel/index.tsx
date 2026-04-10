import React, { useState, useCallback, useEffect } from 'react';
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
} from 'antd';
import {
  DatabaseOutlined,
  UploadOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  knowledgeBaseService,
  type KnowledgeBaseResponse,
  type KnowledgeChunkResponse,
  type SearchResult,
} from '@services/knowledge-base';
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

const KnowledgeBasePanel: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBaseResponse | null>(null);
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [chunks, setChunks] = useState<KnowledgeChunkResponse[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingKbId, setUploadingKbId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadKnowledgeBases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await knowledgeBaseService.getAll();
      setKnowledgeBases(data);
    } catch (err) {
      message.error(t('chat.loadFailed') || '加载知识库失败');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  const handleCreate = async (values: { name: string; description?: string }) => {
    try {
      await knowledgeBaseService.create(values);
      message.success(t('chat.createSuccess') || '知识库创建成功');
      setCreateModalOpen(false);
      form.resetFields();
      loadKnowledgeBases();
    } catch (err) {
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
    } catch (err) {
      message.error(t('chat.deleteFailed') || '删除失败');
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
                    <span className="result-score">{(result.score * 100).toFixed(1)}%</span>
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
                  className={`kb-item ${selectedKb?.id === kb.id ? 'selected' : ''}`}
                  onClick={() => setSelectedKb(kb)}
                >
                  <List.Item.Meta
                    avatar={<DatabaseOutlined />}
                    title={kb.name}
                    description={
                      <span>
                        {kb.chunkCount} 文本块 |{' '}
                        <span className={`status-badge status-${kb.status}`}>
                          {kb.status === 'active' ? t('common.active') : t('common.inactive')}
                        </span>
                      </span>
                    }
                  />
                  <div className="kb-actions">
                    <Button
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
                        e.stopPropagation();
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
        title={`${t('chat.chunksManage')} - ${selectedKb?.name || ''}`}
        open={chunksModalOpen}
        onCancel={() => setChunksModalOpen(false)}
        footer={null}
        width={700}
      >
        {chunksLoading ? (
          <Spin />
        ) : chunks.length === 0 ? (
          <Empty description={t('chat.noChunks')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            className="chunk-list"
            dataSource={chunks}
            renderItem={(chunk) => (
              <List.Item
                className="chunk-item"
                actions={[
                  <Popconfirm
                    key="delete"
                    title={t('chat.deleteChunkConfirm') || '确定删除？'}
                    onConfirm={() => handleDeleteChunk(chunk.id)}
                    okText={t('common.ok')}
                    cancelText={t('common.cancel')}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={chunk.metadata ? fixFilenameEncoding(JSON.parse(chunk.metadata).fileName) || `文本块 #${chunk.chunkIndex + 1}` : `文本块 #${chunk.chunkIndex + 1}`}
                  description={
                    <div className="chunk-content">
                      {chunk.content.length > 200
                        ? `${chunk.content.slice(0, 200)}...`
                        : chunk.content}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default KnowledgeBasePanel;
