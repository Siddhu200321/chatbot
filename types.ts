export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type Source = {
  uri: string;
  title: string;
};

export type GeneratedImage = {
  url:string;
  alt: string;
};

export interface Message {
  id: string;
  role: Role;
  text: string;
  images?: GeneratedImage[];
  sources?: Source[];
  isLoading?: boolean;
  isError?: boolean;
}

export interface SessionMetadata {
  title: string;
  createdAt: number;
}

export interface Session {
  id: string;
  metadata: SessionMetadata;
  messages: Message[];
  chat: any; // Opaque type for the chat instance
}

export interface History {
    activeChatId: string | null;
    sessions: Record<string, Omit<Session, 'id' | 'chat'>>;
}
