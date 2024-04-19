import React, { FC, useEffect, useRef } from "react";
import Loading from "../Loading";
import classNames from "classnames";
import Iconfont from "../Iconfont";
import { isMobile } from "@/utils/userAgent";
import { useNavigate } from "@/hooks";
import Header from "../Header";
import routerList from "@/routes/routers";
import { Footer } from "@/components";
import "./style.less";

interface PageProps {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  title?: string;
  hideBack?: boolean;
  hideHeader?: boolean;
  bodyClassName?: string;
  onBack?: () => void;
}

const Page: FC<PageProps> = ({
  children,
  loading = false,
  title,
  className,
  hideBack = false,
  hideHeader = false,
  bodyClassName,
  onBack,
}) => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const onClickBack = () => {
    if (onBack && typeof onBack === "function") {
      onBack();
    } else {
      navigate(-1);
    }
  };
  useEffect(() => {
    document.body?.addEventListener("scroll", () => {
      console.log("pageRef.current?.scrollTop", pageRef.current?.scrollTop);
    });
  }, []);
  const handelScroll = () => {
    console.log("pageRef.current?.scrollTop", pageRef.current?.scrollTop);
  };
  return (
    <div className={classNames("page", className)}>
      {isMobile() ? (
        <>
          {!hideHeader && (
            <header className="page-header">
              {!hideBack && (
                <div onClick={onClickBack} className="page-back">
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
      <main
        ref={pageRef}
        onScroll={handelScroll}
        className={classNames("page-body", bodyClassName)}
      >
        {loading ? <Loading /> : children}
      </main>
      {!isMobile() && <Footer />}
    </div>
  );
};
export default Page;
