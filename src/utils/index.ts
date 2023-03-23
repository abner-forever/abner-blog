export default class Commutils {
  static buildRequestUrl(url: string, params: Record<string, string>) {
    let param = "";
    for (let key in params) {
      param = param + "&" + key + "=" + params[key];
    }
    return url + "?" + param;
  }
}
