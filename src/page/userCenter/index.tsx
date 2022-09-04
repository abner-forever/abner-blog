import React, { useEffect } from "react";
import Cookies from "js-cookie";
import "./style.scss";
import GithubIcon from "@img/github.svg";
import { Button } from "antd";
import { DEFAULT_HEAD } from "@/constant";
import { observer, inject } from 'mobx-react';
import { useNavigate } from "react-router-dom";
const MinePage = ({ history, globalStore }: any) => {
  const { userInfo } = globalStore;
  const navigate = useNavigate();
  useEffect(() => {
    let userToken = Cookies.get("token");
    if (!userToken) {
      navigate("/login",{
        replace: true
      });
      return;
    }
  }, [history]);

  const loginout = () => {
    let currentCookieSetting = {
      expires: -1,
    };
    Object.assign(currentCookieSetting, {});
    Cookies.set("token", "", currentCookieSetting);
    Cookies.set("userId", "", currentCookieSetting);
    Cookies.set("userName", "", currentCookieSetting);
    navigate("/login",{
      replace: true
    });
  };
  return (
    <div className="content-item">
      <div className="user-content">
        <img className="head" src={userInfo?.avator || DEFAULT_HEAD} alt="" />
        <div className="userinfo-wrap">
          <div className="userinfo">
            <p className="user-name">{userInfo?.userName}</p>
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
          <Button onClick={loginout}>退出登录</Button>
        </div>
        <div className="social-content">
          <a href="https://github.com/abner-forever">
            <img src={GithubIcon} alt="" />
          </a>
        </div>

      </div>

    </div>
  );
};

export default inject('globalStore')(observer(MinePage));