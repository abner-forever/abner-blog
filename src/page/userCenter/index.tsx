import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "@/hooks";
import { DEFAULT_HEAD } from "@/constant";
import GithubIcon from "@img/github.svg";
import { observer } from "mobx-react";
import useStore from "@/hooks/useStore";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import config from "@/config";
import { Toast, Button, List } from "antd-mobile";
import styles from "./styles.module.less";

const userConfig = [
  {
    title: "我的笔记",
    path: "/user/myArticle",
    action: "navigate",
  },
  {
    title: "运动",
    path: "/user/exercise",
    action: "navigate",
  },
];

/**
 * 个人中心
 */
const UserCenter = () => {
  const navigate = useNavigate();
  const { global } = useStore();

  const { userInfo, isLogin } = global;
  useEffect(() => {
    if (isLogin && !userInfo) global.getUserInfo();
  }, [isLogin]);
  const logOut = () => {
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

  return (
    <Page hideHeader className={styles["user-content"]} title="个人中心">
      <div
        className={styles.userinfo}
        onClick={() => navigate("/user/account")}
      >
        <img
          className={styles.avator}
          src={userInfo?.avator || DEFAULT_HEAD}
          alt="avator"
        />
        <p className={styles["user-name"]}>{userInfo?.username}</p>
        <p className={styles.sign}>{userInfo?.sign}</p>
        {userInfo?.id === 1 && (
          <div className={styles["social-content"]}>
            <a href="https://github.com/abner-forever" target="_blank">
              <img src={GithubIcon} alt="" />
            </a>
          </div>
        )}
      </div>
      <div className={styles.user_config}>
        <List>
          {userConfig.map((item, index) => (
            <List.Item
              key={index}
              onClick={() => {
                navigate(item.path);
              }}
            >
              {item.title}
            </List.Item>
          ))}
        </List>
      </div>
      <Button className={styles.logout_btn} onClick={logOut}>
        退出登录
      </Button>
    </Page>
  );
};

export default observer(UserCenter);
