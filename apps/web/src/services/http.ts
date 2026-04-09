import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../store';
import {
  AUTH_REFRESH_TOKEN_KEY,
  loginSuccess,
  logout,
} from '../store/authSlice';
import type { AuthTokenResponseDto } from './generated/model/authTokenResponseDto';
import i18n from '../i18n';

/** 与后端 TransformInterceptor 一致：解包 { code, data } */
function unwrapEnvelope<T>(body: unknown): T {
  if (
    body &&
    typeof body === 'object' &&
    'code' in body &&
    'data' in body &&
    (Number((body as { code?: unknown }).code) === 0 ||
      (body as { success?: boolean }).success === true)
  ) {
    return (body as { data: T }).data as T;
  }
  return body as T;
}

// HTTP 服务配置
class HttpService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = ``;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器 - 自动添加认证 token
    this.api.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem('user-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const apiEnv =
          window.AbnerEnvTool && (await window.AbnerEnvTool.getEnv());
        if (apiEnv) {
          config.headers['api-env'] = apiEnv;
        }
        // FormData 请求必须删除 Content-Type，让浏览器自动补全 multipart/form-data; boundary=...
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器 - 处理认证错误和自动解包数据
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // 如果响应有 data.data 结构（TransformInterceptor 包装的格式），自动解包
        if (
          response.data &&
          typeof response.data === 'object' &&
          'code' in response.data
        ) {
          // 只要 code 为 0 或者 success 为 true，就返回内部的 data
          if (
            Number(response.data.code) === 0 ||
            response.data.success === true
          ) {
            response.data = response.data.data;
          }
        }
        return response;
      },
      async (error) => {
        // 提取更友好的错误消息（使用 i18n）
        let displayMessage = i18n.t('http.requestFailed');

        if (error.response?.data) {
          const data = error.response.data;
          const rawMessage =
            data.message ||
            data.error ||
            (typeof data === 'string' ? data : i18n.t('http.serverError'));
          displayMessage = Array.isArray(rawMessage)
            ? rawMessage.join(', ')
            : String(rawMessage);
        } else if (error.request) {
          displayMessage = i18n.t('http.networkError');
        } else {
          displayMessage = error.message || i18n.t('http.requestInitFailed');
        }

        // 将处理后的友好消息存回 error.message，方便页面直接通过 error.message 获取
        error.message = displayMessage;

        // 打印错误日志到控制台，方便开发调试
        console.error('API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        const config = error.config;
        const url = typeof config?.url === 'string' ? config.url : '';
        const isAuthRequest = url.includes('/auth/');

        if (error.response?.status === 401 && !isAuthRequest && config) {
          const cfg = config as typeof config & { _retry?: boolean };
          if (!cfg._retry) {
            cfg._retry = true;
            const refresh = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
            if (refresh) {
              try {
                const base = this.api.defaults.baseURL ?? '';
                const { data: raw } = await axios.post(
                  `${base}/api/auth/refresh`,
                  { refresh_token: refresh },
                  { headers: { 'Content-Type': 'application/json' } },
                );
                const data = unwrapEnvelope<AuthTokenResponseDto>(raw);
                localStorage.setItem('user-token', data.access_token);
                localStorage.setItem(
                  AUTH_REFRESH_TOKEN_KEY,
                  data.refresh_token,
                );
                store.dispatch(
                  loginSuccess({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    user: data.user,
                  }),
                );
                cfg.headers = cfg.headers ?? {};
                cfg.headers.Authorization = `Bearer ${data.access_token}`;
                return this.api.request(cfg);
              } catch {
                this.handleUnauthorized();
              }
            } else {
              this.handleUnauthorized();
            }
          } else {
            this.handleUnauthorized();
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private handleUnauthorized(): void {
    // 清除认证信息 - 不再强制跳转到登录页，让业务组件自行处理
    localStorage.removeItem('user-token');
    store.dispatch(logout());
    // 注意：不再强制跳转，由需要登录的页面自行处理
  }

  // GET 请求
  public async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  // POST 请求
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  // PUT 请求
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  // DELETE 请求
  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  // PATCH 请求
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  // 设置 baseURL
  public setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.api.defaults.baseURL = baseURL;
  }

  // 获取原始 axios 实例（如果需要更复杂的操作）
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// 导出单例实例
export const httpService = new HttpService();
export default httpService;

/**
 * orval mutator — 供自动生成的 API 代码使用。
 * orval 生成的每个请求函数都会调用此 mutator，确保所有请求
 * 经过统一的拦截器（token 注入、401 处理、响应解包）。
 */
export const httpMutator = <T>(config: AxiosRequestConfig): Promise<T> => {
  return httpService
    .getAxiosInstance()
    .request(config)
    .then((res) => unwrapEnvelope<T>(res.data));
};
