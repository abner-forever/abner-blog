import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

// HTTP 服务配置
class HttpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器 - 自动添加认证 token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("admin-token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器 - 处理认证错误
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const token = localStorage.getItem("admin-token");
          if (token) {
            // 只有已登录用户 token 过期才跳转
            localStorage.removeItem("admin-token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // 获取原始 axios 实例
  public getAxiosInstance() {
    return this.api;
  }
}

// 导出单例实例
export const httpService = new HttpService();
export default httpService;

/**
 * API 响应结构
 */
interface ApiResponse<T> {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

/**
 * orval mutator — 供自动生成的 API 代码使用。
 * 返回 response.data（包含 success/code/message/data/timestamp）
 * 自动解包返回 data 字段
 */
export const httpMutator = <T>(config: AxiosRequestConfig): Promise<T> => {
  return httpService
    .getAxiosInstance()
    .request<T>(config)
    .then((res) => {
      // 解包返回 data 字段
      const responseData = res.data as ApiResponse<T>;
      if (responseData && responseData.data !== undefined) {
        return responseData.data as T;
      }
      return res.data as T;
    });
};
