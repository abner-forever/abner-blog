import React, { FC } from "react";

interface IProps extends IObject {
  /** 图标类型 icon- */
  type: string;
  /** 图标大小 */
  size: number;
  /** 图标颜色 */
  color?: string;
}

/** 字体图标 */
const Iconfont: FC<IProps> = (props) => {
  const { type, color, size, style, ...rest } = props;

  return (
    <svg
      className="iconfont"
      aria-hidden="true"
      fill={color}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <use xlinkHref={`#${type}`}></use>
    </svg>
  );
};

export default Iconfont;
