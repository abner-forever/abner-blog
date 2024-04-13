import React, { FC } from "react";
import Loading from "../Loading";
import classNames from "classnames";
import Iconfont from "../Iconfont";
import { isMobile } from "@/utils/userAgent";
import { useNavigate } from "react-router";
import Header from "../Header";
import routerList from "@/routes/routers";

import "./style.less";

interface PageProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  title?: string;
  hideBack?: boolean;
  hideHeader?: boolean;
  bodyClassName?: string;
}

const Page: FC<PageProps> = ({
  children,
  loading = false,
  title,
  className,
  hideBack = false,
  hideHeader = false,
  bodyClassName,
}) => {
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  return (
    <div className={classNames("page-container", className)}>
      {isMobile() ? (
        <>
          {!hideHeader && (
            <header className="page-header">
              {!hideBack && (
                <div onClick={onBack} className="page-back">
                  <Iconfont type="icon-back" color="#222" size={20} />
                </div>
              )}
              {title && <span className="page-title">{title}</span>}
            </header>
          )}
        </>
      ) : (
        <Header routerConfig={routerList} />
      )}
      <main className={classNames("page-body", bodyClassName)}>
        {loading ? <Loading /> : children}
      </main>
    </div>
  );
};
export default Page;
