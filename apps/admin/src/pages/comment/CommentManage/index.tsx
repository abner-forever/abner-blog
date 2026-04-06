import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Input,
  Tabs,
  Tag,
} from "antd";
import type { TableProps } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { getBlogAdminAPI } from "@/services/generated/admin";
import type { BlogCommentDto, CommentDto, TopicCommentDto } from "@/services/generated/model";
import dayjs from "dayjs";

const api = getBlogAdminAPI();

const CommentManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("blog");

  // 博客评论
  const [blogComments, setBlogComments] = useState<BlogCommentDto[]>([]);
  const [blogPagination, setBlogPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [blogKeyword, setBlogKeyword] = useState("");

  // 闲聊评论
  const [topicComments, setTopicComments] = useState<TopicCommentDto[]>([]);
  const [topicPagination, setTopicPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [topicKeyword, setTopicKeyword] = useState("");

  // 选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const loadBlogComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAdminBlogComments({
        page: blogPagination.current,
        size: blogPagination.pageSize,
        keyword: blogKeyword || undefined,
      });
      setBlogComments(response.list || []);
      setBlogPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [blogPagination.current, blogPagination.pageSize, blogKeyword]);

  const loadTopicComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAdminTopicComments({
        page: topicPagination.current,
        size: topicPagination.pageSize,
        keyword: topicKeyword || undefined,
      });
      setTopicComments(response.list || []);
      setTopicPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [topicPagination.current, topicPagination.pageSize, topicKeyword]);

  useEffect(() => {
    if (activeTab === "blog") {
      void loadBlogComments();
    } else {
      void loadTopicComments();
    }
  }, [activeTab, loadBlogComments, loadTopicComments]);

  const handleBlogSearch = (value: string) => {
    setBlogKeyword(value);
    setBlogPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTopicSearch = (value: string) => {
    setTopicKeyword(value);
    setTopicPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAdminComment(id);
      message.success("删除成功");
      if (activeTab === "blog") {
        loadBlogComments();
      } else {
        loadTopicComments();
      }
    } catch {
      message.error("删除失败");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const batchData = { ids: selectedRowKeys };
      await api.batchDeleteAdminComments(batchData);
      message.success("批量删除成功");
      setSelectedRowKeys([]);
      if (activeTab === "blog") {
        loadBlogComments();
      } else {
        loadTopicComments();
      }
    } catch {
      message.error("删除失败");
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as number[]),
  };

  const blogColumns: TableProps<CommentDto>["columns"] = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "博客",
      dataIndex: ["blog", "title"],
      ellipsis: true,
      width: 300,
      render: (_: unknown, record: BlogCommentDto) => record.blog?.title || "-",
    },
    { title: "评论内容", dataIndex: "content", ellipsis: true },
    {
      title: "作者",
      dataIndex: ["author", "username"],
      width: 100,
      render: (_: unknown, record) => record.author?.username || "-",
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 200,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_: unknown, record) => (
        <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const topicColumns: TableProps<TopicCommentDto>["columns"] = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "评论内容", dataIndex: "content", ellipsis: true },
    {
      title: "话题",
      dataIndex: ["blog", "title"],
      ellipsis: true,
      width: 150,
      render: (_: unknown, record) =>
        record.topic?.name ? (
          <Tag color="purple">{record.topic.name}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "作者",
      dataIndex: ["author", "username"],
      width: 150,
      render: (_: unknown, record) => record.author?.username || "-",
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 200,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (_: unknown, record) => (
        <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const blogTab = (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>博客评论</h2>
        <Space>
          <Input.Search
            placeholder="搜索评论"
            onSearch={handleBlogSearch}
            style={{ width: 200 }}
            allowClear
          />
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条评论?`}
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
        </Space>
      </div>
      <Table
        columns={blogColumns}
        dataSource={blogComments}
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          ...blogPagination,
          onChange: (page, pageSize) =>
            setBlogPagination({ ...blogPagination, current: page, pageSize }),
        }}
      />
    </>
  );

  const topicTab = (
    <>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>闲聊评论</h2>
        <Space>
          <Input.Search
            placeholder="搜索评论"
            onSearch={handleTopicSearch}
            style={{ width: 200 }}
            allowClear
          />
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的 ${selectedRowKeys.length} 条评论?`}
              onConfirm={handleBatchDelete}
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
        </Space>
      </div>
      <Table
        columns={topicColumns}
        dataSource={topicComments}
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          ...topicPagination,
          onChange: (page, pageSize) =>
            setTopicPagination({ ...topicPagination, current: page, pageSize }),
        }}
      />
    </>
  );

  const tabItems = [
    { key: "blog", label: "博客评论", children: blogTab },
    { key: "topic", label: "闲聊评论", children: topicTab },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setSelectedRowKeys([]);
        }}
        items={tabItems}
      />
    </div>
  );
};

export default CommentManage;
