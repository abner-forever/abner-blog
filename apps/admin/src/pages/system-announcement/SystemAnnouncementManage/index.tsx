import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  RollbackOutlined,
  CloudSyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  listSystemAnnouncements,
  createSystemAnnouncement,
  updateSystemAnnouncement,
  deleteSystemAnnouncement,
  publishSystemAnnouncement,
  recallSystemAnnouncement,
  syncSystemAnnouncementNotifications,
  type SystemAnnouncementRow,
} from "@/services/systemAnnouncementsApi";

const SystemAnnouncementManage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<SystemAnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<SystemAnnouncementRow | null>(null);
  const [form] = Form.useForm<{
    title: string;
    bodyRich: string;
    imageUrlsText: string;
    sortOrder: number;
  }>();

  const page = pagination.current;
  const pageSize = pagination.pageSize;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSystemAnnouncements(page, pageSize);
      setData(res.list || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch {
      message.error(t("systemAnnouncement.loadFail"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      title: "",
      bodyRich: "",
      imageUrlsText: "",
      sortOrder: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (row: SystemAnnouncementRow) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      bodyRich: row.bodyRich,
      imageUrlsText: (row.imageUrls || []).join("\n"),
      sortOrder: row.sortOrder,
    });
    setModalVisible(true);
  };

  const parseUrls = (text: string): string[] | undefined => {
    const lines = text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length ? lines : undefined;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const imageUrls = parseUrls(values.imageUrlsText || "");
      if (editing) {
        await updateSystemAnnouncement(editing.id, {
          title: values.title,
          bodyRich: values.bodyRich,
          imageUrls,
          sortOrder: values.sortOrder,
        });
        message.success(t("systemAnnouncement.updateOk"));
      } else {
        await createSystemAnnouncement({
          title: values.title,
          bodyRich: values.bodyRich,
          imageUrls,
          sortOrder: values.sortOrder,
        });
        message.success(t("systemAnnouncement.createOk"));
      }
      setModalVisible(false);
      void loadData();
    } catch {
      message.error(t("systemAnnouncement.saveFail"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSystemAnnouncement(id);
      message.success(t("systemAnnouncement.deleteOk"));
      void loadData();
    } catch {
      message.error(t("systemAnnouncement.deleteFail"));
    }
  };

  const handlePublish = async (id: number) => {
    try {
      const res = await publishSystemAnnouncement(id);
      message.success(
        t("systemAnnouncement.publishOk", { n: res.notificationsCreated }),
      );
      void loadData();
    } catch {
      message.error(t("systemAnnouncement.publishFail"));
    }
  };

  const handleRecall = async (id: number) => {
    try {
      const res = await recallSystemAnnouncement(id);
      message.success(t("systemAnnouncement.recallOk", { n: res.notificationsUpdated }));
      void loadData();
    } catch {
      message.error(t("systemAnnouncement.recallFail"));
    }
  };

  const handleSyncNotifications = async (id: number) => {
    try {
      const res = await syncSystemAnnouncementNotifications(id);
      message.success(
        t("systemAnnouncement.syncOk", { u: res.notificationsUpdated, c: res.notificationsCreated }),
      );
      void loadData();
    } catch {
      message.error(t("systemAnnouncement.syncFail"));
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 64 },
    { title: t("systemAnnouncement.titleCol"), dataIndex: "title" },
    {
      title: t("systemAnnouncement.statusCol"),
      key: "status",
      width: 160,
      render: (_: unknown, row: SystemAnnouncementRow) => (
        <Space wrap size={4}>
          {row.published ? (
            <Tag color="green">{t("systemAnnouncement.published")}</Tag>
          ) : (
            <Tag>{t("systemAnnouncement.draft")}</Tag>
          )}
          {row.published && row.recalledAt ? (
            <Tag color="orange">{t("systemAnnouncement.recalled")}</Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: t("systemAnnouncement.sortCol"),
      dataIndex: "sortOrder",
      width: 88,
    },
    {
      title: t("systemAnnouncement.timeCol"),
      dataIndex: "updatedAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t("systemAnnouncement.actionsCol"),
      key: "actions",
      width: 400,
      render: (_: unknown, row: SystemAnnouncementRow) => (
        <Space wrap size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(row)}>
            {t("common.edit")}
          </Button>
          {!row.published && (
            <Popconfirm
              title={t("systemAnnouncement.publishConfirm")}
              onConfirm={() => handlePublish(row.id)}
            >
              <Button type="link" icon={<SendOutlined />}>
                {t("systemAnnouncement.publish")}
              </Button>
            </Popconfirm>
          )}
          {row.published && !row.recalledAt ? (
            <Popconfirm title={t("systemAnnouncement.recallConfirm")} onConfirm={() => handleRecall(row.id)}>
              <Button type="link" danger icon={<RollbackOutlined />}>
                {t("systemAnnouncement.recall")}
              </Button>
            </Popconfirm>
          ) : null}
          {row.published ? (
            <Popconfirm
              title={t("systemAnnouncement.syncConfirm")}
              onConfirm={() => handleSyncNotifications(row.id)}
            >
              <Button type="link" icon={<CloudSyncOutlined />}>
                {t("systemAnnouncement.renotify")}
              </Button>
            </Popconfirm>
          ) : null}
          <Popconfirm title={t("common.confirmDelete")} onConfirm={() => handleDelete(row.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t("common.delete")}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="system-announcement-manage">
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{t("systemAnnouncement.pageTitle")}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          {t("systemAnnouncement.create")}
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) =>
            setPagination((prev) => ({ ...prev, current: page, pageSize: pageSize || 10 })),
        }}
      />
      <Modal
        title={editing ? t("systemAnnouncement.edit") : t("systemAnnouncement.create")}
        open={modalVisible}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t("systemAnnouncement.titleCol")}
            rules={[{ required: true, message: t("systemAnnouncement.titleRequired") }]}
          >
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="bodyRich"
            label={t("systemAnnouncement.bodyLabel")}
            rules={[{ required: true, message: t("systemAnnouncement.bodyRequired") }]}
          >
            <Input.TextArea rows={10} placeholder="HTML，发布前由服务端消毒" />
          </Form.Item>
          <Form.Item name="imageUrlsText" label={t("systemAnnouncement.imagesLabel")}>
            <Input.TextArea rows={4} placeholder={t("systemAnnouncement.imagesHint")} />
          </Form.Item>
          <Form.Item name="sortOrder" label={t("systemAnnouncement.sortCol")}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemAnnouncementManage;
