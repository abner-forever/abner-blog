import React from "react";
import "./styles.less";

interface EmptyProps {
  title?: string;
}

const Empty = ({ title = "暂无数据" }: EmptyProps) => {
  return (
    <div className="empty-content">
      <p>{title}</p>
    </div>
  );
};
export default Empty;
