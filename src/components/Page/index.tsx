import React, { FC } from "react";
import Loading from "../Loading";
import classNames from "classnames";
import "./style.less";
import Iconfont from "../Iconfont";
import { isMobile } from "@/utils/userAgent";
import { useNavigate } from "react-router";
import Header from "../Header";
import routerList from "@/routes/routers";

interface PageProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  title?: string;
}

const Page: FC<PageProps> = ({
  children,
  loading = false,
  title,
  className,
}) => {
  if (loading) {
    return <Loading />;
  }
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  return (
    <div className={classNames("page-container", className)}>
      {isMobile() ? (
        <header className="page-header">
          <div onClick={onBack} className="page-back">
            <Iconfont type="icon-back" color="#222" size={20} />
          </div>
          {title && <span className="page-title">{title}</span>}
        </header>
      ) : (
        <Header routerConfig={routerList} />
      )}
      <main className="page-body">{children}</main>
    </div>
  );
};
export default Page;
