import type { ReactNode } from "react";
import { Spin, Result, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { usePageContext } from "@/contexts/PageContext";

interface GlobalPageWrapperProps {
  children: ReactNode;
  onRetry?: () => void;
}

const GlobalPageWrapper: React.FC<GlobalPageWrapperProps> = ({
  children,
  onRetry,
}) => {
  const { loading, error } = usePageContext();

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

  return <>{children}</>;
};

export default GlobalPageWrapper;
