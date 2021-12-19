import { PROXY_ENV } from "@/config";
import Common from "./Common";
class Http {
  HOST: string;
  headers: any;
  timeout?: number;

  constructor(config: HttpConfigType) {
    this.HOST = config.HOST;
    this.headers = config.headers || {};
    this.timeout = config.timeout || 10000;
    if (
      config.interceptors &&
      typeof config.interceptors.response === "function"
    ) {
      this.interceptorsResponse = config.interceptors.response;
    }
    if (
      config.interceptors &&
      typeof config.interceptors.requset === "function"
    ) {
      this.interceptorsRequest = config.interceptors.requset;
    }
  }
  interceptorsResponse(res: any) {
    return new Promise((resolve) => {
      resolve(res);
    });
  }
  interceptorsRequest(res: any) {
    return res;
  }
  commonFetch(url: string, headers: any, body: any, method = "GET") {
    const abortController = new AbortController();
    let initParams: any = {
      signal: abortController.signal,
    };
    if (method === "GET") {
      url = Common.buildRequestUrl(url, body);
      initParams = {
        ...initParams,
        method,
      };
    } else {
      initParams = {
        ...initParams,
        method,
        headers: { ...headers },
        body: JSON.stringify(body),
      };
    }
    const request = new Promise((resolve, reject) => {
      console.log('this.HOST + PROXY_ENV +url',this.HOST + PROXY_ENV +url);
      
      fetch(this.HOST + PROXY_ENV +url, initParams)
        .then((response) => response.json())
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
    const timeOut = new Promise((_, reject) => {
      setTimeout(() => {
        reject("请求超时啦");
        abortController.abort(); // 取消当前请求
      }, this.timeout);
    });
    return Promise.race([request, timeOut]);
  }
  async post(url: string, body: any, options?: any) {
    let { headers = {} } = options || {};
    headers = { ...this.headers, ...headers };
    let res = await this.commonFetch(
      url,
      headers,
      this.interceptorsRequest(body),
      "POST"
    );
    return new Promise((resolve, reject) => {
      try {
        this.interceptorsResponse(res)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
  async get(url: string, body: any, options?: any) {
    let { headers = {} } = options || {};
    headers = { ...this.headers, headers };
    let res = await this.commonFetch(url, headers, body, options);
    return new Promise((resolve, reject) => {
      try {
        this.interceptorsResponse(res)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}
export default Http;
