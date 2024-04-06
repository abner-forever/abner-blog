import React from "react";
import classNames from "classnames";
import { FC } from "react";
import "./style.less";

interface IProps extends IObject {
  /** 图标类型 icon- */
  type: string;
  /** 图标大小 */
  size: number;
  /** 图标颜色 */
  color?: string;
}

/** 字体图标 */
const Iconfont: FC<IProps> = props => {
  const { type, color, size, style, className, ...rest } = props;

  return (
    <svg
      className={classNames(
        "iconfont",
        size && `iconfont-size-${size}`,
        className
      )}
      aria-hidden="true"
      fill={color}
      style={style}
      {...rest}
    >
      <use xlinkHref={`#${type}`}></use>
    </svg>
  );
};

export default Iconfont;
