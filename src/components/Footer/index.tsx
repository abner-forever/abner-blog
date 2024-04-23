import React from "react";
import classNames from "classnames";
import "./styles.less";
interface FooterProps {
  className?: string;
}
const Footer = ({ className }: FooterProps) => {
  return (
    <div className={classNames("footer", className)}>
      <a
        href="https://beian.miit.gov.cn/"
        rel="noopener noreferrer"
        target="_blank"
      >
        蜀ICP备18037467号
      </a>
    </div>
  );
};
export default Footer;
