import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Popconfirm,
  message,
  Tabs,
} from "antd";
import type { TableProps } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getBlogAdminAPI } from "@/services/generated/admin";
import type {
  MomentDto,
  TopicDto,
  GetAdminMomentsParams,
} from "@/services/generated/model";

const api = getBlogAdminAPI();

const MomentManage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MomentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState("");
  const [topicId, setTopicId] = useState<number | undefined>(undefined);
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [activeTab, setActiveTab] = useState("list");

  const loadTopics = useCallback(async () => {
    try {
      const result = await api.getAdminTopics({ page: 1, size: 100 });
      const response = result as unknown as { list: TopicDto[] };
      setTopics(response.list || []);
    } catch {
      message.error("加载话题失败");
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetAdminMomentsParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: keyword || undefined,
        topicId,
      };
      const response = await api.getAdminMoments(params);
      setData(response.list || []);
      setPagination((prev) => ({ ...prev, total: response.total || 0 }));
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [keyword, topicId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    if (activeTab === "list") {
      void loadData();
    }
  }, [activeTab, loadData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTopicChange = (value: number | undefined) => {
    setTopicId(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleEdit = (record: MomentDto) => {
    navigate(`/moments/${record.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAdminMoment(id);
      message.success("删除成功");
      loadData();
    } catch {
      message.error("删除失败");
    }
  };

  const handleGoToTopics = () => {
    navigate("/moments/topics");
  };

  const columns: TableProps<MomentDto>["columns"] = [
    { title: "ID", dataIndex: "id", width: 50 },
    {
      title: "内容",
      dataIndex: "content",
      ellipsis: true,
      width: 180,
    },
    {
      title: "话题",
      dataIndex: ["topic", "name"],
      width: 80,
      render: (_: unknown, record: MomentDto) =>
        record.topic?.name ? (
          <Tag color="purple">{record.topic.name}</Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "作者",
      dataIndex: ["author", "username"],
      width: 70,
      render: (_: unknown, record: MomentDto) => record.author?.username || "-",
    },
    { title: "浏览", dataIndex: "viewCount", width: 50 },
    { title: "点赞", dataIndex: "likeCount", width: 50 },
    { title: "评论", dataIndex: "commentCount", width: 50 },
    {
      title: "时间",
      dataIndex: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
      width: 140,
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: unknown, record: MomentDto) => (
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

  const listTab = (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索内容"
            onSearch={handleSearch}
            style={{ width: 180 }}
            allowClear
          />
          <Select
            placeholder="选择话题"
            style={{ width: 140 }}
            allowClear
            value={topicId}
            onChange={handleTopicChange}
            options={topics.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Button onClick={handleGoToTopics}>管理话题</Button>
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
    </>
  );

  const tabItems = [{ key: "list", label: "闲聊列表", children: listTab }];

  return (
    <div>
      <h2>闲聊管理</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};

export default MomentManage;
