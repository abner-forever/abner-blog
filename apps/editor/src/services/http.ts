import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import { store } from "../store";
import { logout } from "../store/authSlice";

class HttpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "",
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        // 优先从 Redux store 读取（dispatch 后立即可用），再 fallback 到 localStorage
        const reduxToken = store.getState().auth.token;
        const storageToken = localStorage.getItem("editor-token");
        const token = reduxToken && reduxToken !== "sso-session"
          ? reduxToken
          : (storageToken && storageToken !== "sso-session" ? storageToken : null);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // /api/sso/status 返回 401 是正常的（未登录），不触发登出
        const url = error.config?.url ?? "";
        if (error.response?.status === 401 && !url.includes("/sso/status")) {
          localStorage.removeItem("editor-token");
          store.dispatch(logout());
        }
        return Promise.reject(error);
      },
    );
  }

  public getAxiosInstance() {
    return this.api;
  }
}

export const httpService = new HttpService();
export default httpService;

interface ApiResponse<T> {
  data?: T;
  message?: string;
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
  if (Array.isArray(message) && message.length > 0) return message.join("，");
  if (typeof message === "string" && message.trim()) return message;
  return null;
};

export const httpMutator = <T>(config: AxiosRequestConfig): Promise<T> => {
  return httpService
    .getAxiosInstance()
    .request<T>(config)
    .then((res) => {
      const responseData = res.data as ApiResponse<T>;
      if (responseData && responseData.data !== undefined) {
        return responseData.data as T;
      }
      return res.data as T;
    })
    .catch((error: unknown) => {
      if (axios.isAxiosError(error)) {
        const apiMessage = getApiMessage(error);
        console.error("[API Error]", {
          url: config.url,
          method: config.method,
          status: error.response?.status,
          message: apiMessage ?? error.message,
        });
        throw new ApiRequestError(
          apiMessage ?? error.message ?? "Request failed",
          error.response?.status,
        );
      }
      throw error;
    });
};
