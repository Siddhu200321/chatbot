
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export type ChatMode = 'chat' | 'image' | 'search';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

const modeConfig = {
    chat: { placeholder: 'Message ai...' },
    image: { placeholder: 'Describe an image to generate...' },
    search: { placeholder: 'Search the web for...' },
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, mode, setMode }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const maxHeight = 200; // max height in pixels
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const ModeButton: React.FC<{
    label: string;
    targetMode: ChatMode;
    disabled?: boolean;
    tooltip?: string;
  }> = ({ label, targetMode, disabled, tooltip }) => {
    const isActive = mode === targetMode;
    const baseClasses = "px-3 py-1 text-sm rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary";
    const activeClasses = "bg-brand-primary text-white";
    const inactiveClasses = "bg-brand-surface hover:bg-brand-border text-brand-text-secondary";
    const disabledClasses = "bg-brand-surface opacity-50 cursor-not-allowed";

    return (
        <div className="relative group">
            <button
                onClick={() => !disabled && setMode(targetMode)}
                disabled={disabled || isLoading}
                className={`${baseClasses} ${disabled ? disabledClasses : isActive ? activeClasses : inactiveClasses}`}
            >
                {label}
            </button>
            {tooltip && <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-900 text-white text-xs rounded py-1 px-2">{tooltip}</div>}
        </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
            <ModeButton label="Chat" targetMode="chat" />
            <ModeButton label="Image" targetMode="image" />
            <ModeButton label="Search" targetMode="search" />
            <ModeButton label="Video" targetMode={'chat'} disabled={true} tooltip="Coming soon!" />
        </div>
        <form onSubmit={handleSubmit} className="relative flex items-end">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={modeConfig[mode].placeholder}
                rows={1}
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none transition-all duration-200 disabled:opacity-50"
                style={{maxHeight: '200px'}}
            />
            <button
                type="submit"
                disabled={isLoading || !text.trim()}
                aria-label="Send message"
                className="absolute right-3 bottom-3 p-2 rounded-full bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-text-secondary disabled:cursor-not-allowed transition-colors duration-200"
            >
                <Icon name="send" className="w-5 h-5 text-white" />
            </button>
        </form>
        <p className="text-center text-xs text-brand-text-secondary mt-2 px-2">
            AI can make mistakes. Consider checking important information.
        </p>
    </div>
  );
};
