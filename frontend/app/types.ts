export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachmentType[];
  username?: string;
  profilePicture?: string;
}

export interface AttachmentType {
  type: 'file' | 'sticker';
  url: string;
  name: string;
}

export interface StickerType {
  id: string;
  url: string;
  name: string;
}

export interface User {
  username: string;
  age: number;
  profession: string;
  email: string;
  phonenumber: string;
  description?: string;
  profile_picture?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
}