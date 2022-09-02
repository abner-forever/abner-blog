import React from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { observer, inject } from 'mobx-react';
import { DEFAULT_HEAD } from "@/constant";

import "@/index.scss";

const Header = ({ globalStore, routerConfig, onToggleLoginModal }: any) => {
  const { userInfo } =  globalStore;
  const token = Cookies.get("token");
  
  return <header className="header-container">
    <ul className="banner">
      <div className='banner-left'>
        <Link to="/" className='banner-logo'>Abner的笔记</Link>
        {routerConfig.map(
          (item: any, index: number) =>
            item.isShowHeader && (
              <li
                key={index}
                className={item.current ? "active-tab" : "tab-item"}
              >
                <Link to={item.path}>{item.title}</Link>
              </li>
            )
        )}
      </div>
      <li className="tab-item">
        {!token ? (
          <a onClick={onToggleLoginModal}>登录</a>
        ) : (
          <Link to='/mine'>
            <img className="user-icon" src={userInfo?.avator || DEFAULT_HEAD} alt="" />
            <span>{userInfo?.userName}</span>
          </Link>
        )}
      </li>
    </ul>
  </header>
}
export default inject('globalStore')(observer(Header));