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

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

const getApiMessage = (error: AxiosError): string | null => {
  const data = error.response?.data as
    | { message?: string | string[] }
    | undefined;
  const message = data?.message;

  if (Array.isArray(message) && message.length > 0) {
    return message.join("，");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return null;
};

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
    })
    .catch((error: unknown) => {
      if (axios.isAxiosError(error)) {
        const apiMessage = getApiMessage(error);
        // 先打印底层错误，便于排查接口异常
        console.error("[API Error]", {
          url: config.url,
          method: config.method,
          status: error.response?.status,
          message: apiMessage ?? error.message,
          error,
        });
        throw new ApiRequestError(
          apiMessage ?? error.message ?? "Request failed",
          error.response?.status,
        );
      }
      throw error;
    });
};
