import { isMobile, isPad } from "../utils/userAgent";
(function () {
  /**  设置 rem 的 fontSize 值 */
  function setRem() {
    // 设计稿横屏的基本宽度
  const DESIGN_DRAFT_PC = 1920;
  // 设计稿竖屏的基本宽度
  const DESIGN_DRAFT_MOBILE = 375;
  // 基准大小
  const BASE_SIZE = 8;

  // 横屏根据屏幕高度计算 rem
  const clientWidth = document.documentElement.clientWidth;
  const DESIGN_DRAFT = isMobile() ? DESIGN_DRAFT_MOBILE : DESIGN_DRAFT_PC;
  const dpr = window.devicePixelRatio
  const scale = isMobile() ? (clientWidth * dpr) / DESIGN_DRAFT : 2;

  document.documentElement.style.fontSize = BASE_SIZE * scale + "px";
  }

  // 改变窗口大小时重新设置 rem
  let timer: NodeJS.Timeout;
  window.onresize = function () {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      setRem();
    }, 100);
  };

  window.addEventListener(
    "pageshow",
    function (e) {
      if (e.persisted) {
        // 浏览器后退的时候重新计算
        clearTimeout(timer);
        timer = setTimeout(setRem, 300);
      }
    },
    false
  );
  setRem();
})();
