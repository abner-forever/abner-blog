import React, { useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group'
import dayjs from 'dayjs';
import AdvancedFormat from 'dayjs/plugin/advancedFormat'
// import Lottie from '@/components/Lottie';
import littlePersion from '@/assets/lottie/little-persion.json';
import './style.less';


dayjs.extend(AdvancedFormat);

/**
 * 动画组件
 */
const Animate = () => {
  const [show, setShow] = useState(false);
  const aniRef: any = useRef(null);
  const changeToshow = () => {
    setShow(!show);
    if (show) {
      aniRef.current?.pause();
    } else {
      aniRef.current?.play();
    }
  }

  return <div className='animate-container'>
    {/*this.state.toshow值为true时，className为show意思是显示div内的文字；反之隐藏。  */}
    {/* <div className={this.state.toshow?'show':'hide'}>boss级人物：铠爹</div> */}
    <CSSTransition
      in={show}
      timeout={2000}
      classNames='boss-text'
    >
      <div>boss级人物:{dayjs().format('Do')}</div>
    </CSSTransition>
    {/* <Lottie ref={aniRef} autoplay={false} animationData={littlePersion} /> */}
    <div>
      <button onClick={changeToshow}>召唤boss{show ? '动' : '停'}</button>
    </div>
  </div>
}

export default Animate;