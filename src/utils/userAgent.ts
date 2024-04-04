const UA = window.navigator.userAgent;

export const isMobile = ()=>{
  return /Mobile/i.test(UA);
}