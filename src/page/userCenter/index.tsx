import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { DEFAULT_HEAD } from "@/constant";
import GithubIcon from "@img/github.svg";
import "./styles.less";
import { inject, observer } from "mobx-react";


const MinePage = ({ history, globalStore:{
  userInfo
} }: any) => {
  
  const navigate = useNavigate();
  
  useEffect( () => {
    let userToken = Cookies.get("user-token");
    if (!userToken) {
      navigate("/login",{
        replace: true
      });
      return;
    }
  }, [history]);

  
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
        </div>
        <div className="social-content">
          <a href="https://github.com/abner-forever" target="_blank">
            <img src={GithubIcon} alt="" />
          </a>
        </div>

      </div>

    </div>
  );
};

const UserCenter = inject('globalStore')(observer(MinePage));
export default UserCenter 