import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

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

class HttpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('user-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (
          response.data &&
          typeof response.data === 'object' &&
          'code' in response.data
        ) {
          if (
            Number(response.data.code) === 0 ||
            response.data.success === true
          ) {
            response.data = response.data.data;
          }
        }
        return response;
      },
      (error) => {
        const config = error.config;
        const url = typeof config?.url === 'string' ? config.url : '';
        const isAuthRequest = url.includes('/auth/');

        if (error.response?.status === 401 && !isAuthRequest) {
          localStorage.removeItem('user-token');
          localStorage.removeItem('user-info');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  public async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }
}

export const httpService = new HttpService();
export default httpService;

export const httpMutator = <T>(config: AxiosRequestConfig): Promise<T> => {
  return httpService
    .getAxiosInstance()
    .request(config)
    .then((res) => unwrapEnvelope<T>(res.data));
};
