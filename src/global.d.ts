/// <reference types="react-scripts" />

declare module "js-cookie";
declare module "braft-extensions/dist/code-highlighter";
declare module "editor.md/editormd.amd";

interface MobileValue {
  countryCode: number;
  phone: string;
}

interface Window {
  document: any;
}

interface HttpConfigType {
  domain?: string;
  headers?: Record<string, string>;
  timeout?: number;
  interceptors?: {
    request?: any;
    response?: any;
  };
}

interface IArticleItemtype {
  id: string;
  title: string;
  description: string;
  author: string;
  updateTime: string;
  createTime: string;
  cover: string;
}

interface FetchReponse {
  code: number;
  message: string;
  data: Record<string, any> | null;
  success: boolean;
}