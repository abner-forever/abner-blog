import lottie from "lottie-web";
import React, { useImperativeHandle, FC, useEffect, useRef, useMemo, forwardRef } from "react";
import './style.less';

interface IProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  renderer?: 'svg';
  path?: string;
  autoplay?: boolean;
  ref: any;
}
/**
 * Lottie动画组件
 */
export default forwardRef(({
  animationData,
  loop = true,
  renderer = 'svg',
  path = '',
  autoplay = true,
  className
}: IProps, ref) => {
  /** 动画渲染容器 */
  const refComponent: any = useRef(null);

  const lottieAnimation: any = useRef(null);

  useImperativeHandle(ref, () => ({
    // 获取当前动画对象实例
    getInstance: () => lottieAnimation.current,
    // 播放，继续播放
    play: () => {
      lottieAnimation.current.play();
    },
    // 暂停动画
    pause: () => {
      lottieAnimation.current.pause();
    },
    // 停止动画，区别于暂停动画pause()
    stop: () => {
      lottieAnimation.current.stop();
    }
  }))
  // 缓存动画的相关配置
  const animationOptions = useMemo(() => {
    const options: any = {
      loop,
      renderer,
      autoplay
    };

    // 优先取animationData
    if (animationData) {
      options.animationData = animationData;
    } else {
      options.path = path;
    }

    return options;
  }, [loop, renderer, path, animationData, autoplay]);


  useEffect(() => {
    if (!refComponent.current) return;
    const lottieAnimationItem = lottie.loadAnimation({
      ...animationOptions,
      container: refComponent.current,
    })
    // 渲染后的动画实例对象复制给 refAnimation.current，返回
    lottieAnimation.current = lottieAnimationItem;
    // 一定要注意这里的对象销毁，避免内存泄露，以及重复渲染动画
    return () => {
      // 重置为null
      lottieAnimation.current = null;
      // 销毁动画对象
      lottieAnimationItem.destroy();
    };

  }, [animationOptions]);

  return <div ref={refComponent} className={`lottie-animate ${className ? className : ''}`} />
});