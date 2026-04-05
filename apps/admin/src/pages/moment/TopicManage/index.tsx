import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Input,
  Modal,
  Form,
  Switch,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getBlogAdminAPI } from "@/services/generated/admin";
import type {
  Topic,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from "@/services/generated/model";

const api = getBlogAdminAPI();

type TopicRow = Topic;

const TopicManage: React.FC = () => {
  const [data, setData] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        size: pagination.pageSize,
        keyword: keyword || undefined,
      };
      const result = await api.adminTopicsControllerGetTopics(params);
      const response = result as unknown as {
        list: TopicRow[];
        total: number;
      };
      setData(response.list || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [pagination.current, pagination.pageSize, keyword]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingTopic(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: TopicRow) => {
    setEditingTopic(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.adminTopicsControllerDeleteTopic(id);
      message.success("删除成功");
      loadData();
    } catch {
      message.error("删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTopic) {
        const updateData: UpdateTopicDto = {
          name: values.name,
          description: values.description,
          cover: values.cover,
          isHot: values.isHot,
        };
        await api.adminTopicsControllerUpdateTopic(editingTopic.id, updateData);
        message.success("更新成功");
      } else {
        const createData: AdminCreateTopicDto = {
          name: values.name,
          description: values.description,
          cover: values.cover,
          isHot: values.isHot,
        };
        await api.adminTopicsControllerCreateTopic(createData);
        message.success("创建成功");
      }
      setModalVisible(false);
      loadData();
    } catch {
      message.error("操作失败");
    }
  };

  const handleHotToggle = async (record: TopicRow) => {
    try {
      await api.adminTopicsControllerUpdateTopic(record.id, { isHot: !record.isHot });
      message.success(record.isHot ? "已取消热门" : "已设为热门");
      loadData();
    } catch {
      message.error("操作失败");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "话题名称", dataIndex: "name", ellipsis: true, width: 150 },
    { title: "描述", dataIndex: "description", ellipsis: true, width: 200 },
    { title: "动态数", dataIndex: "momentCount", width: 70 },
    {
      title: "热门",
      dataIndex: "isHot",
      width: 60,
      render: (hot: boolean, record: TopicRow) => (
        <Switch
          size="small"
          checked={hot}
          onChange={() => handleHotToggle(record)}
        />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
      width: 150,
    },
    {
      title: "操作",
      key: "action",
      width: 130,
      render: (_: unknown, record: TopicRow) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>话题管理</h2>
        <Space>
          <Input.Search
            placeholder="搜索话题"
            onSearch={handleSearch}
            style={{ width: 180 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增话题
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          onChange: (page, pageSize) =>
            setPagination({ ...pagination, current: page, pageSize }),
        }}
      />
      <Modal
        title={editingTopic ? "编辑话题" : "新增话题"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="话题名称"
            rules={[{ required: true, message: "请输入话题名称" }]}
          >
            <Input placeholder="请输入话题名称" />
          </Form.Item>
          <Form.Item name="description" label="话题描述">
            <Input.TextArea rows={3} placeholder="请输入话题描述" />
          </Form.Item>
          <Form.Item name="cover" label="封面图片URL">
            <Input placeholder="请输入封面图片URL" />
          </Form.Item>
          <Form.Item name="isHot" label="设为热门" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TopicManage;
