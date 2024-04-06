import React, { FC, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Dropdown } from "antd";
import useStore from "@/hooks/useStore";
import { observer } from "mobx-react";
import { DEFAULT_HEAD } from "@/constant";

import "./styles.less";
import { isMobile } from "@/utils/userAgent";

interface HeaderProps {
  routerConfig: any[];
}

const Header: FC<HeaderProps> = ({ routerConfig }) => {
  const { global } = useStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);
  const navigate = useNavigate();

  const loginout = () => {
    let currentCookieSetting = {
      expires: -1,
    };
    Object.assign(currentCookieSetting, {});
    Cookies.set("user-token", "", currentCookieSetting);
    Cookies.set("user-id", "", currentCookieSetting);
    navigate("/login", {
      replace: true,
    });
    global.isLogin = false;
    global.userInfo = undefined;
  };

  const items = [
    {
      key: "1",
      label: (
        <a href="https://github.com/abner-forever" target="_blank">
          About me
        </a>
      ),
    },
    {
      key: "2",
      label: <span onClick={loginout}>退出登录</span>,
    },
  ];

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
            <Dropdown
              overlayClassName="menu-wrap"
              menu={{ items: isMobile() ? [] : items }}
              placement="bottom"
              arrow
            >
              <Link
                className="avator-container"
                onClick={() => setActiveTab("admin")}
                to="admin"
              >
                <img
                  className="user-avator"
                  src={global.userInfo?.avator || DEFAULT_HEAD}
                  alt=""
                />
                {!isMobile() && <span>{global.userInfo?.username}</span>}
              </Link>
            </Dropdown>
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
