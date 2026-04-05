import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Switch,
  message,
  Popconfirm,
  Select,
} from "antd";
import type { TableProps } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getBlogAPI } from "@/services/generated/admin";
import type { BlogDto, BlogListResponseDto } from "@/services/generated/model";
import PageContainer from "@/components/PageContainer";

const api = getBlogAPI();

type Blog = BlogDto;

const BlogManage: React.FC = () => {
  const [data, setData] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<boolean | undefined>(undefined);
  const [sort, setSort] = useState<string>("latest");

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.adminControllerGetBlogs({
        page: String(pagination.current),
        size: String(pagination.pageSize),
        keyword: keyword || undefined,
        isPublished: status,
        sort: sort,
      });
      const res = result as unknown as BlogListResponseDto;
      setData(res.list || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMsg =
        axiosError.response?.data?.message || axiosError.message || "加载失败";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pagination object changes on total update
  }, [pagination.current, pagination.pageSize, keyword, status, sort]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setStatus(value);
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPagination({ ...pagination, current: 1 });
    loadData();
  };

  const handleEdit = (record: Blog) => {
    navigate(`/blogs/${record.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.adminControllerDeleteBlog(id);
      message.success("删除成功");
      loadData();
    } catch {
      message.error("删除失败");
    }
  };

  const handlePublishToggle = async (record: Blog) => {
    try {
      await api.adminControllerToggleBlogPublish(record.id, {
        isPublished: !record.isPublished,
      });
      message.success(record.isPublished ? "已下架" : "已发布");
      loadData();
    } catch {
      message.error("操作失败");
    }
  };

  const columns: TableProps<Blog>["columns"] = [
    { title: "ID", dataIndex: "id", width: 50 },
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      width: 180,
    },
    { title: "摘要", dataIndex: "summary", ellipsis: true, width: 150 },
    {
      title: "作者",
      dataIndex: ["author", "username"],
      width: 70,
      render: (_: unknown, record: Blog) => record.author?.username || "-",
    },
    {
      title: "状态",
      dataIndex: "isPublished",
      width: 70,
      render: (published: boolean) => (
        <Tag color={published ? "green" : "orange"}>
          {published ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    { title: "浏览", dataIndex: "viewCount", width: 50 },
    { title: "点赞", dataIndex: "likesCount", width: 50 },
    { title: "评论", dataIndex: "commentCount", width: 50 },
    { title: "收藏", dataIndex: "favoritesCount", width: 50 },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      render: (v: string) => new Date(v).toLocaleString(),
      width: 150,
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      render: (_: unknown, record: Blog) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Switch
            size="small"
            checked={record.isPublished}
            onChange={() => handlePublishToggle(record)}
          />
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
    <PageContainer loading={loading} error={error} onRetry={loadData}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索文章"
              onSearch={handleSearch}
              style={{ width: 180 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              value={status}
              onChange={handleStatusChange}
              options={[
                { value: true, label: "已发布" },
                { value: false, label: "草稿" },
              ]}
            />
            <Select
              placeholder="排序方式"
              style={{ width: 140 }}
              value={sort}
              onChange={handleSortChange}
              options={[
                { value: "latest", label: "最新创建" },
                { value: "oldest", label: "最早创建" },
                { value: "popular", label: "浏览量最高" },
                { value: "unpopular", label: "浏览量最低" },
                { value: "most-liked", label: "点赞最多" },
                { value: "least-liked", label: "点赞最少" },
                { value: "most-commented", label: "评论最多" },
                { value: "least-commented", label: "评论最少" },
              ]}
            />
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            onChange: (page, pageSize) =>
              setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </div>
    </PageContainer>
  );
};

export default BlogManage;
