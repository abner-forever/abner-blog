import { useState, useEffect, useCallback } from "react";
import { Modal, Table, Button, Tag, Space, Form, Input, Select, message } from "antd";
import { PlusOutlined, GlobalOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { translationApi, type Page } from "@/services/api";

interface TranslationPanelProps {
  open: boolean;
  pageId: number;
  currentLocale: string;
  onClose: () => void;
}

const localeNames: Record<string, string> = {
  "zh-CN": "简体中文",
  en: "English",
};

const localeAbbr: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
};

const translateOptions = [
  { label: "English", value: "en" },
  { label: "简体中文", value: "zh-CN" },
];

const TranslationPanel: React.FC<TranslationPanelProps> = ({
  open,
  pageId,
  currentLocale,
  onClose,
}) => {
  const navigate = useNavigate();
  const [translations, setTranslations] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchTranslations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await translationApi.list(pageId);
      setTranslations(Array.isArray(data) ? data : [data]);
    } catch {
      message.error("加载翻译列表失败");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (open) {
      fetchTranslations();
    }
  }, [open, fetchTranslations]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);
      await translationApi.create(pageId, {
        locale: values.locale,
        title: values.title,
        slug: values.slug,
        description: values.description,
      });
      message.success("翻译版本创建成功");
      setCreateOpen(false);
      form.resetFields();
      fetchTranslations();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("创建失败，请检查 slug 是否唯一");
    } finally {
      setCreateLoading(false);
    }
  };

  const availableLocales = translateOptions.filter(
    (opt) =>
      opt.value !== currentLocale &&
      !translations.some((t) => t.locale === opt.value),
  );

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string, record: Page) => (
        <Space>
          <span>{title}</span>
          <Tag color="blue" style={{ fontSize: 10, padding: "0 3px" }}>
            {localeAbbr[record.locale] || record.locale}
          </Tag>
        </Space>
      ),
    },
    {
      title: "语言",
      dataIndex: "locale",
      key: "locale",
      width: 100,
      render: (locale: string) => (
        <Tag icon={<GlobalOutlined />} color="geekblue">
          {localeNames[locale] || locale}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (s: string) => {
        const colors: Record<string, string> = {
          draft: "blue",
          published: "green",
          archived: "default",
        };
        const texts: Record<string, string> = {
          draft: "草稿",
          published: "已发布",
          archived: "已归档",
        };
        return <Tag color={colors[s] || "default"}>{texts[s] || s}</Tag>;
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Page) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            onClose();
            navigate(`/editor/${record.id}`);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <GlobalOutlined />
            <span>多语言管理</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={680}
        getContainer={document.body}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue" style={{ fontSize: 13, padding: "2px 8px" }}>
            当前语言：{localeNames[currentLocale] || currentLocale}
          </Tag>
        </div>

        <Table
          dataSource={translations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />

        {availableLocales.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
              block
            >
              添加翻译版本
            </Button>
          </div>
        )}

        {availableLocales.length === 0 && !loading && (
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              color: "#999",
              fontSize: 13,
            }}
          >
            所有语言版本已存在
          </div>
        )}
      </Modal>

      {/* Create Translation Modal */}
      <Modal
        title="创建翻译版本"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        getContainer={document.body}
      >
        <Form form={form} layout="vertical" size="middle">
          <Form.Item
            name="locale"
            label="目标语言"
            rules={[{ required: true, message: "请选择语言" }]}
          >
            <Select placeholder="选择要翻译的语言">
              {availableLocales.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="页面标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="翻译后的页面标题" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="URL 标识"
            rules={[
              { required: true, message: "请输入 URL 标识" },
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: "仅支持小写字母、数字和连字符",
              },
            ]}
          >
            <Input placeholder="例如：en-spring-sale" />
          </Form.Item>
          <Form.Item name="description" label="描述（选填）">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TranslationPanel;
