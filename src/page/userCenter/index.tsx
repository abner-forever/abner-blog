import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { DEFAULT_HEAD } from "@/constant";
import GithubIcon from "@img/github.svg";
import { observer } from "mobx-react";
import useStore from "@/hooks/useStore";
import { Page } from "@/components";
import apiBlog from "@/services/apiBlog";
import config from "@/config";
import { Toast, Button } from "antd-mobile";

import "./styles.less";

const MinePage = ({}: any) => {
  const navigate = useNavigate();
  const { global } = useStore();
  const { userInfo, isLogin } = global;
  useEffect(() => {
    let userToken = Cookies.get("user-token");
    if (!userToken) {
      navigate("/login", {
        replace: true,
      });
      return;
    }
    if (isLogin && !userInfo) global.getUserInfo();
  }, [isLogin]);
  const handleAvatorChange = async (event: any) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    const { url } = await apiBlog.uploadAvator(formData);
    const urls = config.imageServer + url;
    await apiBlog.updateUserInfo({
      avator: urls,
    });
    global.updateUserInfo({
      avator: urls,
    });
    Toast.show("头像更新成功");
  };
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
    <Page className="user-content" title="个人中心">
      <div className="avator-container">
        <img className="avator" src={userInfo?.avator || DEFAULT_HEAD} alt="" />
        <input type="file" onChange={handleAvatorChange} />
      </div>
      <div className="userinfo-wrap">
        <div className="userinfo">
          <p className="user-name">{userInfo?.username}</p>
        </div>
        <div className="write-article">
          <p
            onClick={() => {
              navigate("/addArticle");
            }}
          >
            去写文章
          </p>
          <p
            onClick={() => {
              navigate("/myArticle");
            }}
          >
            我的文章
          </p>
        </div>
      </div>
      <div className="social-content">
        <a href="https://github.com/abner-forever" target="_blank">
          <img src={GithubIcon} alt="" />
        </a>
      </div>
      <Button onClick={logOut}>退出登录</Button>
    </Page>
  );
};

export default observer(MinePage);
