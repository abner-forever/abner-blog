import type { AssistantCard } from './components/ResultCards';
import type { CreateBlogDto } from '@services/generated/model';

export enum VendorType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  MINIMAX = 'minimax',
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayContent: string;
  thinkingContent?: string;
  thinkingStatus?: 'idle' | 'streaming' | 'done';
  answerStatus?: 'idle' | 'streaming' | 'done';
  /** 联网检索阶段（预留：首条正文流式前展示检索态） */
  webSearchStatus?: 'idle' | 'searching' | 'done';
  timestamp: number;
  isComplete?: boolean;
  card?: AssistantCard;
  images?: Array<{ mimeType: string; previewUrl: string }>;
  /** 从 ```abner-blog-publish``` 解析，用于对话内发帖确认 */
  blogPublishDraft?: CreateBlogDto | null;
  /** 用户已通过聊天内按钮成功发布 */
  blogPublished?: { id: number; title: string } | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  model: string;
}

export interface ModelVendor {
  label: string;
  value: VendorType;
  models: { label: string; value: string }[];
}

export type StreamEventName =
  | 'intent'
  | 'clarification_needed'
  | 'todo_created'
  | 'event_created'
  | 'todo_updated'
  | 'event_updated'
  | 'todo_deleted'
  | 'event_deleted'
  | 'schedule_query'
  | 'thinking_delta'
  | 'chat_delta'
  | 'web_search_status'
  | 'done'
  | 'error';

export interface StreamEvent {
  event: StreamEventName;
  payload?: Record<string, unknown>;
}

export type IntentName =
  | 'create_todo'
  | 'create_event'
  | 'update_todo'
  | 'update_event'
  | 'delete_todo'
  | 'delete_event'
  | 'query_schedule'
  | 'query_weather'
  | 'chat';
