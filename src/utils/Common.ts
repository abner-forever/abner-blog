class Common {
  static formatTime() {
    let time = new Date();
    let year = time.getFullYear();
    let month = time.getMonth() + 1;
    let day = time.getDay();
    let hour = time.getHours();
    let minute = time.getMinutes();
    let second = time.getSeconds();
    let timeForat = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    return timeForat;
  }
  static buildRequestUrl(url: string, params: Record<string, string>) {
    console.log("params", params);
    if (!params) return url;
    let param = [];
    for (let key in params) {
      param.push(`${key}=${params[key]}`);
    }
    return url + "?" + param.join("&");
  }
  static getkey(obj: Record<string, string>) {
    var arr = [];
    var str = "";
    for (const key in obj) {
      arr.push(key + "=" + obj[key]);
    }
    str = arr.join("&");
    return str;
  }
}

export default Common;
