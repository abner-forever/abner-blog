declare module 'js-cookie';
declare module 'braft-extensions/dist/code-highlighter';
interface HttpConfigType{
  HOST:string;
  headers: any;
  timeout?: number;
  interceptors: Record<string,any>;
}