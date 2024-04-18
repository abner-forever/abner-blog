import React from "react";
import { isMobile } from "@/utils/userAgent";
import MobileNavigation from "@/components/MobileNavigation";
import "./container.less";

interface ContainerProps {
  children: React.ReactNode;
}
const Container = ({ children }: ContainerProps) => {
  if (isMobile()) {
    return <MobileNavigation>{children}</MobileNavigation>;
  }
  return (
    <div className="content-wrap">
      {children}
    </div>
  );
};

export default Container;
