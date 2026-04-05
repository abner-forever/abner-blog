import type { User } from "./user";

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  user: User;
  createdAt: string;
  updatedAt: string;
}
