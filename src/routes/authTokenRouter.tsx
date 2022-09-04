import React, { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import routeConfig from "./routers";
import "@/index.scss";
import { Loading } from "@/components";


const AuthToken = () => {
  const { pathname } = location;
  const element = useRoutes(routeConfig);
  routeConfig.forEach((item: any) => {
    if (pathname === item.path) {
      if (item.isShowHeader) {
        item.current = true;
      }
    } else {
      item.current = false;
      if (item.path === '/christmas') {
        const endTime = 1640448000000; // new Date('2021 12 25').getTime()
        const currentTime = Date.now();
        item.isShowHeader = currentTime < endTime;
      }
    }
  });

  return (
    <Suspense
      fallback={<Loading />}
    >
      <div className="content-wrap">
        <div className="content">
          {/* Route 组件必须是Switch 的子元素 不然正常渲染的时候 404页面也会渲染 */}
          {element}
        </div>
      </div>
    </Suspense>
  );
};

export default AuthToken;