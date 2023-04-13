import React, { FC, useState } from "react";
import { Link,useLocation } from "react-router-dom";
import Cookies from "js-cookie";

import { DEFAULT_HEAD } from "@/constant";

import "./style.less";
interface IProps {
  routerConfig: any[];
  onToggleLoginModal: () => void;
  globalStore?: any;
}

const Header: FC<IProps> = ({ globalStore, routerConfig, onToggleLoginModal }) => {
  const { userInfo } = globalStore||{};
  const token = Cookies.get("user-token");
  const location = useLocation();
  const [activeTab,setActiveTab] = useState(location.pathname);
  
  return <header className="header-container">
    <ul className="banner">
      <li className='banner-left'>
        <Link to="" className='banner-logo'>Abner的笔记</Link>
        {routerConfig.map(
          (item: any, index) =>
            {
              return item.isShowHeader && (
                <span
                  key={index}
                  className={`tab-item ${item.path === activeTab ? "active" : ''}`}
                >
                  <Link onClick={()=>setActiveTab(item.path)} to={item.path}>{item.title}</Link>
                </span>
              )
            }
        )}
      </li>
      <li className="login-item">
        {!token ? (
          <a onClick={onToggleLoginModal}>登录</a>
        ) : (
          <Link onClick={()=>setActiveTab('/mine')} to='/mine'>
            <img className="user-icon" src={userInfo?.avator || DEFAULT_HEAD} alt="" />
            <span>{userInfo?.userName}</span>
          </Link>
        )}
      </li>
    </ul>
  </header>
}
export default Header;