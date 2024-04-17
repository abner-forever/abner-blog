import configs from "@/config";
import Common from "@/utils/Common";
import Cookies from "js-cookie";

function prependDomainIfNeeded(url: string, domain: string) {
  // 构建匹配域名的正则表达式
  const domainRegex =
    /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.?)+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/;
  if (!domainRegex.test(url)) {
    url = domain + url;
  }
  return url;
}

class Http {
  domain: string;
  headers: Record<string, string>;
  timeout?: number;

  constructor(config: HttpConfigType) {
    const { domain, headers, timeout, interceptors } = config || {};
    this.domain = domain || configs.api;
    this.headers = headers || {};
    this.timeout = timeout || 10000;

    if (interceptors && typeof interceptors.response === "function") {
      this.interceptorsResponse = interceptors.response;
    }
    if (interceptors && typeof interceptors.request === "function") {
      this.interceptorsRequest = interceptors.request;
    }
  }
  interceptorsResponse(response: any, options?: any) {
    return new Promise(resolve => {
      resolve(response);
    });
  }
  interceptorsRequest(request: any) {
    return request;
  }
  commonFetch(path: string, headers: any, body: any, method = "GET") {
    const abortController = new AbortController();
    let initParams: any = {
      signal: abortController.signal,
    };
    const _headers = {
      ...headers,
      Authorization: `Bearer ${Cookies.get("user-token")}`,
    };
     let requestUrl = prependDomainIfNeeded(path, this.domain);
    if (method === "GET") {
      requestUrl = Common.buildRequestUrl(requestUrl, body);
      initParams = {
        ...initParams,
        headers: _headers,
        method,
      };
    } else {
      initParams = {
        ...initParams,
        method,
        headers: _headers,
        body: body,
      };
    }

    const request = new Promise((resolve, reject) => {
      fetch(requestUrl, initParams)
        .then(response => response.json())
        .then(res => {
          resolve(res);
        })
        .catch(err => {
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
  async post(url: string, body: any, options?: any): Promise<any> {
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
        this.interceptorsResponse(res, options)
          .then(result => {
            resolve(result);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
  async get(url: string, params?: any, options?: any): Promise<any> {
    let { headers = {} } = options || {};
    headers = { ...this.headers, ...headers };
    let res = await this.commonFetch(url, headers, params, options);
    return new Promise((resolve, reject) => {
      try {
        this.interceptorsResponse(res)
          .then(result => {
            resolve(result);
          })
          .catch(err => {
            reject(err);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}
export default Http;
