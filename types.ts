export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate: number | null;
  priority: 'low' | 'medium' | 'high' | null;
  notes: string | null;
}

export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system' // For tool outputs or errors
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isToolOutput?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

// Tool Arguments
export interface AddTaskArgs {
  text: string;
  dueDate?: string; // ISO Date String
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface RemoveTaskArgs {
  id: string;
}

export interface ToggleTaskArgs {
  id: string;
  completed: boolean;
}