import type { ReactNode } from "react";
import { Spin, Result, Button, Empty } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface PageContainerProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({
  loading = false,
  error = null,
  empty = false,
  emptyText = "暂无数据",
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Result
          status="error"
          title="加载失败"
          subTitle={error}
          extra={
            onRetry ? (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                重试
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (empty) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Empty description={emptyText} />
      </div>
    );
  }

  return <>{children}</>;
};

export default PageContainer;
