import React, { FC, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useStore from "@/hooks/useStore";
import { observer } from "mobx-react";
import { DEFAULT_HEAD } from "@/constant";
import { isMobile } from "@/utils/userAgent";
import { useNavigate } from "@/hooks";
import "./styles.less";

interface HeaderProps {
  routerConfig: any[];
}

const Header: FC<HeaderProps> = ({ routerConfig }) => {
  const { global } = useStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const navigate = useNavigate();

  return (
    <header className="header-container">
      <ul className="banner">
        <li className="banner-left">
          <span
            onClick={() => navigate("/", { replace: true })}
            className="banner-logo"
          >
            {isMobile() ? "首页" : "Abner的笔记"}
          </span>
          {routerConfig.map((item: any, index) => {
            return (
              item.isShowHeader && (
                <span
                  key={index}
                  className={`tab-item ${
                    item.path === activeTab ? "active" : ""
                  }`}
                >
                  <Link onClick={() => setActiveTab(item.path)} to={item.path}>
                    {item.title}
                  </Link>
                </span>
              )
            );
          })}
        </li>
        <li className="login-item">
          {global.isLogin && (
            <Link
              className="avator-container"
              onClick={() => setActiveTab("admin")}
              to="/userCenter"
            >
              <img
                className="user-avator"
                src={global.userInfo?.avator || DEFAULT_HEAD}
                alt=""
              />
              {!isMobile() && <span>{global.userInfo?.username}</span>}
            </Link>
          )}
        </li>
        {/* <a
          className="gpt-entry"
          href="https://openai.foreverheart.top"
          target="_blank"
        /> */}
      </ul>
    </header>
  );
};
export default observer(Header);
