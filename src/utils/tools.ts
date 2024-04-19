export const buildRequestUrl = (
  url: string,
  params: Record<string, string>
) => {
  if (!params) return url;
  let param = [];
  for (let key in params) {
    param.push(`${key}=${params[key]}`);
  }
  return url + "?" + param.join("&");
};
export const getkey = (obj: Record<string, string>) => {
  var arr = [];
  var str = "";
  for (const key in obj) {
    arr.push(key + "=" + obj[key]);
  }
  str = arr.join("&");
  return str;
};
