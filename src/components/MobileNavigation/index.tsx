import React from "react";
import type { FC } from "react";
import { NavBar, TabBar } from "antd-mobile";
import { useLocation } from "react-router-dom";
import { useNavigate } from "@/hooks";
import {
  AppOutline,
  UnorderedListOutline,
  UserOutline,
} from "antd-mobile-icons";

import styles from "./style.module.less";

const tabs = [
  {
    key: "/",
    title: "首页",
    icon: <AppOutline />,
  },
  {
    key: "/todo",
    title: "待办",
    icon: <UnorderedListOutline />,
  },
  // {
  //   key: '/message',
  //   title: '消息',
  //   icon: <MessageOutline />,
  // },
  {
    key: "/userCenter",
    title: "我的",
    icon: <UserOutline />,
  },
];

const Bottom: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;

  const setRouteActive = (value: string) => {
    navigate(value);
  };

  return (
    <TabBar activeKey={pathname} onChange={value => setRouteActive(value)}>
      {tabs.map(item => (
        <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
      ))}
    </TabBar>
  );
};

interface Iprops {
  children: React.ReactNode;
}
export default ({ children }: Iprops) => {
  const navigate = useNavigate();
  const { pathname } = location;
  const currentTab = tabs.find(item => item.key === pathname);
  return (
    <div className={styles.app}>
      <div className={styles.top}>
        {currentTab && <NavBar backArrow={false}>{currentTab.title}</NavBar>}
      </div>
      <div className={styles.body}>{children}</div>
      {currentTab && (
        <div className={styles.bottom}>
          <Bottom />
        </div>
      )}
    </div>
  );
};
