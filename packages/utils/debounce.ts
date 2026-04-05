export const debounce = (
  func: (...args: any[]) => void,
  wait: number,
  immediate: boolean = false,
) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    timeout && clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow) func.apply(this, args);
    } else {
      timeout = setTimeout(() => func.apply(this, args), wait);
    }
  };
};
