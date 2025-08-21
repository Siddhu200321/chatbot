import React, { useState } from 'react';
import { Message, Role } from '../types';
import { Icon } from './Icon';

interface ChatMessageProps {
  message: Message;
}

const Avatar: React.FC<{ role: Role; isError?: boolean }> = ({ role, isError }) => {
  const isUser = role === Role.USER;

  const bgColor = isUser ? 'bg-brand-primary' : isError ? 'bg-red-500' : 'bg-green-500';
  const iconName = isUser ? 'user' : isError ? 'error' : 'ai';

  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${bgColor}`}>
      <Icon name={iconName} className="w-5 h-5 text-white" />
    </div>
  );
};

const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900 rounded-md my-2 text-white">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-700/50 rounded-t-md">
        <span className="text-xs text-gray-400 font-sans">{lang || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          {copied ? (
            <>
              <Icon name="check" className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Icon name="copy" className="w-4 h-4" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto"><code className="font-mono text-sm">{code}</code></pre>
    </div>
  );
};

const formatInlineText = (text: string) => {
  const html = text
    .trim()
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-brand-border text-brand-primary-hover px-1 py-0.5 rounded-sm font-mono text-xs">$1</code>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};

const parseMessage = (text: string) => {
  const parts: { type: 'text' | 'code'; lang?: string; content: string }[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1], content: match[2].trim() });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  if (parts.length === 0 && text) {
     parts.push({ type: 'text', content: text });
  }

  return parts;
};

const MessageContent: React.FC<{ message: Message }> = ({ message }) => {
  const parts = parseMessage(message.text);

  return (
    <div>
      {/* Render text and code blocks */}
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return <CodeBlock key={index} lang={part.lang || ''} code={part.content} />;
        }
        return <div key={index} dangerouslySetInnerHTML={formatInlineText(part.content)} />;
      })}

      {/* Render generated images */}
      {message.images && message.images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {message.images.map((image, i) => (
            <div key={`${message.id}-img-${i}`} className="group relative">
                <img src={image.url} alt={image.alt} className="rounded-lg object-cover aspect-square transition-transform group-hover:scale-105" />
                <a 
                    href={image.url}
                    download={`ai-image-${message.id}-${i}.jpeg`}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download image"
                    aria-label="Download image"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Icon name="download" className="w-4 h-4" />
                </a>
                <a 
                    href={image.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0"
                    aria-label={`View full image: ${image.alt}`}
                ></a>
            </div>
          ))}
        </div>
      )}

      {/* Render search sources */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-brand-border/50">
          <h4 className="font-semibold text-sm text-brand-text-secondary mb-2">Sources</h4>
          <ul className="space-y-1.5">
            {message.sources.map((source, i) => (
              <li key={i} className="text-sm truncate flex items-start gap-2">
                <span className="text-brand-text-secondary">{i + 1}.</span>
                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline" title={source.uri}>
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const wrapperBg = message.role === Role.MODEL && !message.isError ? 'bg-brand-surface' : 'bg-transparent';
  const isError = message.isError;

  return (
    <div className={`py-6 ${isError ? 'bg-red-900/20' : wrapperBg} border-b border-brand-border`}>
      <div className="max-w-4xl mx-auto flex items-start gap-4 px-4 sm:px-6 md:px-8">
        <Avatar role={message.role} isError={isError} />
        <div className="flex-1 pt-0.5 prose prose-invert prose-sm max-w-none">
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5 py-1">
              <div className="w-2 h-2 bg-brand-text-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-brand-text-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-brand-text-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <MessageContent message={message} />
          )}
        </div>
      </div>
    </div>
  );
};
