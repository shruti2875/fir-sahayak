export type Language = 'en' | 'hi' | 'mr';

export interface User {
  stationName: string;
  location: string;
  contact: string;
  officerName: string;
  email: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: string[];
}

export interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
}
