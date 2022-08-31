import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import ApiBlog from "@/api/apiBlog";
import "./style.scss";
import GithubIcon from "@img/github.svg";
import { Button } from "antd";
import { DEFAULT_HEAD } from "@/constant";
const MinePage = (props: any) => {
  const [userInfo, setUserInfo] = useState<Record<string, string>>({});
  useEffect(() => {
    let userId = Cookies.get("userId");
    if (!userId) {
      props.history.replace("/login");
      return;
    }
    getuserInfo(userId);
  }, [props.history]);
  const getuserInfo = async (userId: string) => {
    let res: any = await ApiBlog.userInfo({
      userId,
    });
    if (res) {
      setUserInfo(res);
      let currentCookieSetting = {
        expires: 1,
      };
      Object.assign(currentCookieSetting, {});
      Cookies.set("avator", res.avator, currentCookieSetting);
    }
  };
  const loginout = () => {
    let currentCookieSetting = {
      expires: -1,
    };
    Object.assign(currentCookieSetting, {});
    Cookies.set("token", "", currentCookieSetting);
    Cookies.set("userId", "", currentCookieSetting);
    Cookies.set("userName", "", currentCookieSetting);
    props.history.replace("/login");
  };
  return (
    <div className="content-item">
      <div className="user-content">
        <img className="head" src={userInfo.avator || DEFAULT_HEAD} alt="" />
        <div className="userinfo">
          <p className="user-name">{userInfo.userName}</p>
          <div className="write-article">
            <p
              onClick={() => {
                props.history.push("/addArticle");
              }}
            >
              去写文章
            </p>
            <p
              onClick={() => {
                props.history.push("/myArticle");
              }}
            >
              我的文章
            </p>
          </div>
        </div>
        <div className="social-content">
          <a href="https://github.com/abner-jlm">
            <img src={GithubIcon} alt="" />
          </a>
        </div>
      </div>
      <Button onClick={loginout}>退出登录</Button>
    </div>
  );
};
export default MinePage;
