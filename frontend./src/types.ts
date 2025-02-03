export interface User {
  email: string;
  username: string;
  age: number;
  profession: string;
  phonenumber: string;
  description?: string;
  profile_picture?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: any;
  type?: 'text' | 'sticker' | 'file' | 'audio';
  fileName?: string;
  timestamp?: string;
}