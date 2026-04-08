import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getBlogAdminAPI } from "@/services/generated/admin";
import { ApiRequestError } from "@/services/http";
import type {
  UserProfileDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDtoStatus,
} from "@/services/generated/model";
import "./index.less";

const api = getBlogAdminAPI();

const UserManage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<UserProfileDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfileDto | null>(null);
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        size: pagination.pageSize,
        keyword: keyword || undefined,
      };
      const result = await api.getAdminUsers(params);
      setData(result.list || []);
      setPagination((prev) => ({ ...prev, total: result.total || 0 }));
    } catch {
      message.error(t("userManage.loadFail"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [pagination.current, pagination.pageSize, keyword, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: UserProfileDto) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAdminUser(id);
      message.success(t("userManage.deleteSuccess"));
      loadData();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        message.error(error.message);
      }
    }
  };

  const handleStatusChange = async (
    id: number,
    status: UpdateUserStatusDtoStatus,
  ) => {
    try {
      await api.updateAdminUserStatus(id, { status });
      message.success(t("userManage.statusUpdateSuccess"));
      loadData();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        message.error(error.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        const updateData: UpdateUserDto = {
          nickname: values.nickname,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        await api.updateAdminUser(editingUser.id, updateData);
        message.success(t("userManage.updateSuccess"));
      } else {
        const createData: CreateUserDto = {
          username: values.username,
          nickname: values.nickname,
          email: values.email,
          password: values.password,
          role: values.role,
          status: values.status,
        };
        await api.createAdminUser(createData);
        message.success(t("userManage.createSuccess"));
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      const formError = error as { errorFields?: unknown[] };
      if (Array.isArray(formError.errorFields) && formError.errorFields.length) {
        return;
      }
      if (error instanceof ApiRequestError) {
        message.error(error.message);
      }
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: t("userManage.username"), dataIndex: "username" },
    { title: t("userManage.nickname"), dataIndex: "nickname" },
    { title: t("userManage.email"), dataIndex: "email" },
    {
      title: t("userManage.role"),
      dataIndex: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? t("userManage.admin") : t("userManage.user")}
        </Tag>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active"
            ? t("userManage.active")
            : t("userManage.inactive")}
        </Tag>
      ),
    },
    {
      title: t("common.createdAt"),
      dataIndex: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t("common.actions"),
      key: "action",
      render: (_: unknown, record: UserProfileDto) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t("common.edit")}
          </Button>
          <Button
            type="link"
            size="small"
            icon={
              record.status === "active" ? <StopOutlined /> : <CheckOutlined />
            }
            onClick={() =>
              handleStatusChange(
                record.id,
                record.status === "active" ? "inactive" : "active",
              )
            }
          >
            {record.status === "active"
              ? t("common.disable")
              : t("common.enable")}
          </Button>
          <Popconfirm
            title={t("blogManage.confirmDelete")}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t("common.delete")}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-manage">
      <div className="user-manage__toolbar">
        <h2 className="user-manage__title">{t("userManage.title")}</h2>
        <Space>
          <Input.Search
            placeholder={t("userManage.searchUser")}
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t("userManage.addUser")}
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
        title={editingUser ? t("userManage.editUser") : t("userManage.addUser")}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label={t("userManage.username")}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="nickname" label={t("userManage.nickname")}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("userManage.email")}
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("userManage.password")}
            rules={[{ required: !editingUser }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label={t("userManage.role")}
            initialValue="user"
          >
            <Select>
              <Select.Option value="user">{t("userManage.user")}</Select.Option>
              <Select.Option value="admin">
                {t("userManage.admin")}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label={t("common.status")}
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">
                {t("userManage.active")}
              </Select.Option>
              <Select.Option value="inactive">
                {t("userManage.inactive")}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;
