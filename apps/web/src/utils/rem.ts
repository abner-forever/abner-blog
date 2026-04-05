export const setRem = () => {
  const width = document.documentElement.clientWidth;
  const baseSize = 16;

  if (width > 768) {
    // PC 端：以 1200px 为设计稿基准（对应变量中的 @layout-max-width）
    // 只有当宽度小于 1200px 时才开始缩小，大于 1200px 时保持 16px 不变
    const pcThreshold = 1200;
    let fontSize = baseSize;

    if (width < pcThreshold) {
      fontSize = (width / pcThreshold) * baseSize;
    }

    // 保护措施：防止 PC 端字体缩得太小
    if (fontSize < 12) fontSize = 12;
    // 大于阈值时保持 16px，不再继续放大（除非有特殊需求，通常 16px 足够）
    if (fontSize > 16) fontSize = 16;

    document.documentElement.style.fontSize = `${fontSize}px`;
  } else {
    // 移动端：以 375px 为设计稿基准进行缩放
    // 这样在 375 宽度的屏幕下，1rem = 16px
    const mobileDesignWidth = 375;
    let fontSize = (width / mobileDesignWidth) * baseSize;

    // 移动端边界保护
    if (fontSize < 14) fontSize = 14;
    if (fontSize > 20) fontSize = 20;

    document.documentElement.style.fontSize = `${fontSize}px`;
  }
};

// 初始化
setRem();

// 监听窗口变化
window.addEventListener('resize', setRem);

export default setRem;
