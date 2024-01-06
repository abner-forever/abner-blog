import React from "react";
import IconSvg from '@img/github.svg';
import './styles.less'
const ViteDemo = ()=>{
  return (
    <div>
      <p>View Demo </p>
      <p>静态资源图片引入</p>
      <img src={IconSvg} alt="" />
      <div className='bgc'></div>
    </div>
  )
}
export default ViteDemo;