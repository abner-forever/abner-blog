import { Suspense, type ReactNode } from "react";
import { Spin } from "antd";
import ErrorBoundary from "../ErrorBoundary";

interface GlobalWrapperProps {
  children: ReactNode;
}

const GlobalWrapper: React.FC<GlobalWrapperProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
            }}
          >
            <Spin size="large" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default GlobalWrapper;
