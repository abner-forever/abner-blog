import React, { ComponentType, Suspense, lazy } from "react";
import { Loading } from "@/components";

// 自定义懒加载函数
export const lazyLoad = (factory: () => Promise<{ default: ComponentType }>) => {
  const Module = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Module />
    </Suspense>
  );
};