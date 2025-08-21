import React from 'react';
import { Icon } from './Icon';
import { SessionMetadata } from '../types';

interface HistorySidebarProps {
  sessions: Record<string, { metadata: SessionMetadata }>;
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}) => {
  const sortedSessions = Object.entries(sessions).sort(
    (a, b) => b[1].metadata.createdAt - a[1].metadata.createdAt
  );

  return (
    <div className="w-64 bg-brand-surface border-r border-brand-border flex flex-col h-screen">
      <div className="p-2 border-b border-brand-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg hover:bg-brand-border transition-colors duration-200"
          aria-label="Start new chat"
        >
          <Icon name="new-chat" className="w-5 h-5" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {sortedSessions.map(([id, { metadata }]) => (
            <div key={id} className="group relative">
              <button
                onClick={() => onSelectChat(id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md truncate ${
                  id === activeChatId ? 'bg-brand-primary/20 text-brand-primary-hover' : 'text-brand-text-secondary hover:bg-brand-border'
                }`}
              >
                {metadata.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete chat: ${metadata.title}`}
                title="Delete chat"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-2 border-t border-brand-border">
        <p className="text-xs text-center text-brand-text-secondary">
          Gemini Chat
        </p>
      </div>
    </div>
  );
};
