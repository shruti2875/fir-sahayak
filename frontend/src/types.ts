export type Language = 'en' | 'hi' | 'mr';

export interface User {
  station_id: number;
  stationName: string;
  location: string;
  contact: string;
  officer_id: number;
  officerName: string;
  email: string;
  rank: string;
}


export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  meta?: {
    fir: string;
    missing_info: string[] | string;
    suggestions: string[] | string;
    confidence: string;
    similar_cases: { description: string }[];
    ipc_sections?: IPCSection[];
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  createdAt: Date;
}

// ✅ NEW: Image Analysis Types
export interface ImageAnalysisResult {
  extracted_info: string;
  suggestions: string;
  error?: string;
}

// ✅ NEW: Enhanced Message with evidence
export interface EvidenceItem {
  id: string;
  type: 'image' | 'text';
  content: string;
  extractedInfo?: string;
  timestamp: Date;
}

export interface IPCSection {
  ipc_section: string;
  offense: string;
  description: string;
  punishment: string;
  score: number;
}