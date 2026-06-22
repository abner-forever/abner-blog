import { httpMutator } from "./http";

export interface Page {
  id: number;
  title: string;
  slug: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  cover?: string;
  schema: string;
  status: "draft" | "published" | "archived";
  locale: string;
  translationGroupId?: number;
  reviewStatus: "draft" | "reviewing" | "approved" | "rejected";
  reviewComment?: string;
  reviewedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  deleted?: boolean;
  locale?: string;
  reviewStatus?: string;
  translationGroupId?: number;
}

export interface CreatePageDto {
  title: string;
  slug: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  locale?: string;
}

export interface UpdatePageDto {
  title?: string;
  slug?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  cover?: string;
  locale?: string;
  schema?: string;
}

export interface PublishPageDto {
  schema: string;
  cover?: string;
}

/* ==================== 模板 API ==================== */

export interface Template {
  id: number;
  name: string;
  category: string;
  description?: string;
  thumbnail?: string;
  components: string;
  html?: string;
  css?: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  category?: string;
  description?: string;
  thumbnail?: string;
  components: string;
  html?: string;
  css?: string;
}

export const templateApi = {
  /** 获取模板列表 */
  list: (category?: string) =>
    httpMutator<Template[]>({
      url: "/api/page-templates",
      method: "GET",
      params: category ? { category } : undefined,
    }),

  /** 获取模板详情 */
  getById: (id: number) =>
    httpMutator<Template>({ url: `/api/page-templates/${id}`, method: "GET" }),

  /** 创建模板 */
  create: (dto: CreateTemplateDto) =>
    httpMutator<Template>({
      url: "/api/page-templates",
      method: "POST",
      data: dto,
    }),

  /** 删除模板 */
  remove: (id: number) =>
    httpMutator<void>({ url: `/api/page-templates/${id}`, method: "DELETE" }),
};

/** 上传图片到页面目录 */
export const uploadPageImage = (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  return httpMutator<{ url: string }>({
    url: "/api/pages/upload",
    method: "POST",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const pageApi = {
  /** 创建页面 */
  create: (dto: CreatePageDto) =>
    httpMutator<Page>({ url: "/api/pages", method: "POST", data: dto }),

  /** 获取页面列表（分页） */
  list: (query?: PageQuery) =>
    httpMutator<PaginatedResponse<Page>>({
      url: "/api/pages",
      method: "GET",
      params: query,
    }),

  /** 获取页面详情 */
  getById: (id: number) =>
    httpMutator<Page>({ url: `/api/pages/${id}`, method: "GET" }),

  /** 根据 slug 获取页面（管理端预览） */
  getBySlug: (slug: string) =>
    httpMutator<Page>({ url: `/api/pages/slug/${slug}`, method: "GET" }),

  /** 更新页面 */
  update: (id: number, dto: UpdatePageDto) =>
    httpMutator<Page>({ url: `/api/pages/${id}`, method: "PATCH", data: dto }),

  /** 发布页面 */
  publish: (id: number, dto: PublishPageDto) =>
    httpMutator<Page>({
      url: `/api/pages/${id}/publish`,
      method: "PATCH",
      data: dto,
    }),

  /** 归档页面 */
  archive: (id: number) =>
    httpMutator<Page>({ url: `/api/pages/${id}/archive`, method: "PATCH" }),

  /** 删除页面 */
  remove: (id: number) =>
    httpMutator<void>({ url: `/api/pages/${id}`, method: "DELETE" }),

  /** 克隆页面 */
  clone: (id: number) =>
    httpMutator<Page>({ url: `/api/pages/${id}/clone`, method: "POST" }),

  /** 恢复已删除页面 */
  restore: (id: number) =>
    httpMutator<Page>({ url: `/api/pages/${id}/restore`, method: "POST" }),

  /** 永久删除页面 */
  hardRemove: (id: number) =>
    httpMutator<void>({ url: `/api/pages/${id}/hard`, method: "DELETE" }),
};

/* ==================== 版本 API ==================== */

export interface PageVersion {
  id: number;
  pageId: number;
  versionNumber: number;
  title?: string;
  schema: string;
  status?: string;
  createdAt: string;
}

export const versionApi = {
  /** 获取版本列表 */
  list: (pageId: number) =>
    httpMutator<PageVersion[]>({
      url: `/api/pages/${pageId}/versions`,
      method: "GET",
    }),

  /** 获取版本详情 */
  getById: (versionId: number) =>
    httpMutator<PageVersion>({
      url: `/api/page-versions/${versionId}`,
      method: "GET",
    }),

  /** 恢复到指定版本 */
  restore: (pageId: number, versionId: number) =>
    httpMutator<Page>({
      url: `/api/pages/${pageId}/versions/${versionId}/restore`,
      method: "POST",
    }),
};

/* ==================== 统计 API ==================== */

export interface DailyPV {
  date: string;
  count: number;
}

export const statsApi = {
  /** 获取总访问量 */
  getTotal: (pageId: number) =>
    httpMutator<{ pageId: number; total: number }>({
      url: `/api/pages/${pageId}/stats/total`,
      method: "GET",
    }),

  /** 获取日访问量趋势 */
  getDaily: (pageId: number, days?: number) =>
    httpMutator<{ pageId: number; daily: DailyPV[] }>({
      url: `/api/pages/${pageId}/stats/daily`,
      method: "GET",
      params: days ? { days } : undefined,
    }),

  /** 批量获取 PV */
  getBatch: (ids: number[]) =>
    httpMutator<Record<string, number>>({
      url: `/api/pages/stats/batch`,
      method: "GET",
      params: { ids: ids.join(",") },
    }),
};

/* ==================== 自定义组件 API ==================== */

export interface CustomComponent {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  html: string;
  css?: string;
  script?: string;
  type: "system" | "user";
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export const componentApi = {
  /** 获取自定义组件列表 */
  list: (type?: string) =>
    httpMutator<CustomComponent[]>({
      url: "/api/page-components",
      method: "GET",
      params: type ? { type } : undefined,
    }),

  /** 获取组件详情 */
  getById: (id: number) =>
    httpMutator<CustomComponent>({
      url: `/api/page-components/${id}`,
      method: "GET",
    }),

  /** 注册组件 */
  create: (dto: {
    name: string;
    description?: string;
    thumbnail?: string;
    html: string;
    css?: string;
    script?: string;
  }) =>
    httpMutator<CustomComponent>({
      url: "/api/page-components",
      method: "POST",
      data: dto,
    }),

  /** 删除组件 */
  remove: (id: number) =>
    httpMutator<void>({
      url: `/api/page-components/${id}`,
      method: "DELETE",
    }),
};

/* ==================== 多语言 API ==================== */

export const translationApi = {
  /** 获取页面翻译版本列表 */
  list: (pageId: number) =>
    httpMutator<Page[]>({
      url: `/api/pages/${pageId}/translations`,
      method: "GET",
    }),

  /** 创建页面翻译版本 */
  create: (pageId: number, dto: { locale: string; title: string; slug: string; description?: string }) =>
    httpMutator<Page>({
      url: `/api/pages/${pageId}/translations`,
      method: "POST",
      data: dto,
    }),
};

/* ==================== 审批 API ==================== */

export const reviewApi = {
  /** 提交审核 */
  submit: (pageId: number) =>
    httpMutator<Page>({
      url: `/api/pages/${pageId}/submit-review`,
      method: "PATCH",
    }),

  /** 审核通过 */
  approve: (pageId: number, comment: string) =>
    httpMutator<Page>({
      url: `/api/pages/${pageId}/approve`,
      method: "PATCH",
      data: { comment },
    }),

  /** 驳回 */
  reject: (pageId: number, comment: string) =>
    httpMutator<Page>({
      url: `/api/pages/${pageId}/reject`,
      method: "PATCH",
      data: { comment },
    }),

  /** 获取待审核列表 */
  pendingList: (query?: PageQuery) =>
    httpMutator<PaginatedResponse<Page>>({
      url: `/api/pages/review/pending`,
      method: "GET",
      params: query,
    }),
};
