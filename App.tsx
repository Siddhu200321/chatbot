
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GenerateContentResponse, Content } from '@google/genai';
import { createChatSession, generateImagesFromPrompt } from './services/geminiService';
import { Welcome } from './components/Welcome';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput, ChatMode } from './components/ChatInput';
import { HistorySidebar } from './components/HistorySidebar';
import { Message, Role, Source, History as HistoryType } from './types';
import { Icon } from './components/Icon';

const STORAGE_KEY = 'gemini-chat-history';

const generateTitle = (prompt: string) => {
  const words = prompt.split(' ');
  return words.slice(0, 5).join(' ');
}

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryType>({ activeChatId: null, sessions: {} });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<ReturnType<typeof createChatSession> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistoryJson = localStorage.getItem(STORAGE_KEY);
      if (savedHistoryJson) {
        const savedHistory: HistoryType = JSON.parse(savedHistoryJson);
        if (savedHistory.activeChatId && savedHistory.sessions[savedHistory.activeChatId]) {
          setHistory(savedHistory);
          const activeSession = savedHistory.sessions[savedHistory.activeChatId];
          setMessages(activeSession.messages);
          const geminiHistory = activeSession.messages
            .filter(m => !m.isError && !m.isLoading)
            .map(msg => ({
              role: msg.role,
              parts: [{ text: msg.text }]
            }));
          setCurrentChat(createChatSession(geminiHistory as Content[]));
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    if (Object.keys(history.sessions).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } else {
      // If all sessions are deleted, remove the key from storage
      if (localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [history]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const updateCurrentSessionMessages = useCallback((updateFn: (prevMessages: Message[]) => Message[]) => {
    setMessages(prevMessages => {
      const newMessages = updateFn(prevMessages);

      setHistory(prevHistory => {
        if (!prevHistory.activeChatId || !prevHistory.sessions[prevHistory.activeChatId]) {
          return prevHistory;
        }

        const activeSession = prevHistory.sessions[prevHistory.activeChatId];

        return {
          ...prevHistory,
          sessions: {
            ...prevHistory.sessions,
            [prevHistory.activeChatId]: {
              ...activeSession,
              messages: newMessages.filter(m => !m.isLoading),
            },
          },
        };
      });

      return newMessages;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`;
    setHistory(prev => ({
      ...prev,
      activeChatId: newChatId,
      sessions: {
        ...prev.sessions,
        [newChatId]: {
          metadata: { title: 'New Chat', createdAt: Date.now() },
          messages: [],
        }
      }
    }));
    setMessages([]);
    setCurrentChat(createChatSession());
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setHistory(prevHistory => {
      if (chatId === prevHistory.activeChatId) return prevHistory;

      const selectedSession = prevHistory.sessions[chatId];
      if (selectedSession) {
        setMessages(selectedSession.messages);
        const geminiHistory = selectedSession.messages
          .filter(m => !m.isError && !m.isLoading)
          .map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
        setCurrentChat(createChatSession(geminiHistory as Content[]));
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        return { ...prevHistory, activeChatId: chatId };
      }
      return prevHistory;
    });
  }, []);

  const handleDeleteChat = useCallback((chatId: string) => {
    setHistory(prevHistory => {
      const newSessions = { ...prevHistory.sessions };
      delete newSessions[chatId];
      let newActiveId = prevHistory.activeChatId;

      if (chatId === prevHistory.activeChatId) {
        const remainingChats = Object.entries(newSessions).sort((a, b) => b[1].metadata.createdAt - a[1].metadata.createdAt);
        if (remainingChats.length > 0) {
          newActiveId = remainingChats[0][0];
          const nextSession = newSessions[newActiveId];
          setMessages(nextSession.messages);
          const geminiHistory = nextSession.messages
            .filter(m => !m.isError && !m.isLoading)
            .map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
          setCurrentChat(createChatSession(geminiHistory as Content[]));
        } else {
          newActiveId = null;
          setMessages([]);
          setCurrentChat(null);
        }
      }
      return { activeChatId: newActiveId, sessions: newSessions };
    });
  }, []);


  const handleSendMessage = async (prompt: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: `user-${Date.now()}`, role: Role.USER, text: prompt };
    const aiPlaceholder: Message = { id: `ai-${Date.now()}`, role: Role.MODEL, text: '...', isLoading: true };

    let chatSession = currentChat;

    // Step 1: Prepare session and update UI state atomically.
    if (!history.activeChatId) {
      // New chat flow: create session and update all related state.
      const newChatId = `chat-${Date.now()}`;
      chatSession = createChatSession();
      const newTitle = generateTitle(prompt);
      
      setCurrentChat(chatSession);
      setMessages([userMessage, aiPlaceholder]);
      setHistory(prev => ({
        ...prev,
        activeChatId: newChatId,
        sessions: {
          ...prev.sessions,
          [newChatId]: {
            metadata: { title: newTitle, createdAt: Date.now() },
            messages: [userMessage], // Persist user message immediately.
          },
        },
      }));
    } else {
      // Existing chat flow.
      let messagesWithUser: Message[] = [];
      setMessages(prev => {
        messagesWithUser = [...prev, userMessage, aiPlaceholder];
        return messagesWithUser;
      });

      setHistory(prev => {
        const newMessages = prev.sessions[prev.activeChatId!].messages.concat(userMessage);
        let newTitle = prev.sessions[prev.activeChatId!].metadata.title;
        if (prev.sessions[prev.activeChatId!].messages.length === 0) {
            newTitle = generateTitle(prompt);
        }

        return {
          ...prev,
          sessions: {
            ...prev.sessions,
            [prev.activeChatId!]: {
              ...prev.sessions[prev.activeChatId!],
              metadata: { ...prev.sessions[prev.activeChatId!].metadata, title: newTitle },
              messages: newMessages,
            },
          },
        };
      });
    }
    
    // Step 2: Make API call.
    try {
      if (!chatSession) throw new Error("Chat session not initialized.");

      let aiMessage: Message;

      if (mode === 'image') {
        const base64Images = await generateImagesFromPrompt(prompt);
        const imageUrls = base64Images.map(bytes => ({
          url: `data:image/jpeg;base64,${bytes}`,
          alt: prompt,
        }));
        aiMessage = { ...aiPlaceholder, text: `Generated ${imageUrls.length} image(s) for: "${prompt}"`, isLoading: false, images: imageUrls };
      } else if (mode === 'search') {
        const response: GenerateContentResponse = await chatSession.sendMessage({
          message: prompt,
          config: { tools: [{ googleSearch: {} }] },
        });
        const sources: Source[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map(chunk => chunk.web)
          .filter((web): web is { uri: string; title: string } => !!web?.uri)
          .map(web => ({ uri: web.uri, title: web.title || 'Untitled Source' })) ?? [];
        aiMessage = { ...aiPlaceholder, text: response.text, isLoading: false, sources };
      } else { // 'chat' mode
        const response: GenerateContentResponse = await chatSession.sendMessage({ message: prompt });
        aiMessage = { ...aiPlaceholder, text: response.text, isLoading: false };
      }
      
      updateCurrentSessionMessages(prev => prev.map(m => (m.id === aiPlaceholder.id ? aiMessage : m)));
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      
      let errorMessage = "An unknown error occurred.";
      const apiError = error as { error?: { status?: string, message?: string } };

      if (apiError?.error?.status === 'RESOURCE_EXHAUSTED') {
        errorMessage = "You've exceeded your API quota. Please check your plan and billing details.";
      } else if (apiError?.error?.message) {
        errorMessage = apiError.error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      const aiError: Message = { ...aiPlaceholder, text: `Error: ${errorMessage}`, isLoading: false, isError: true };
      updateCurrentSessionMessages(prev => prev.map(m => (m.id === aiPlaceholder.id ? aiError : m)));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string, modeOverride?: ChatMode) => {
    const targetMode = modeOverride || 'chat';
    setMode(targetMode);
    handleSendMessage(prompt);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-screen text-brand-text-primary overflow-hidden">
      <div
        className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-brand-surface ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
        style={{ transition: 'width 300ms ease-in-out'}}
      >
        <HistorySidebar
          sessions={history.sessions}
          activeChatId={history.activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      <main className="flex-1 flex flex-col bg-brand-bg relative">
        <button
          onClick={toggleSidebar}
          className="absolute top-3 left-3 z-20 p-2 bg-brand-surface/80 hover:bg-brand-border rounded-full transition-colors"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>
          )}
        </button>
        
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isLoading ? (
            <Welcome onPromptClick={handlePromptClick} />
          ) : (
            <div>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 bg-brand-bg border-t border-brand-border">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            mode={mode}
            setMode={setMode}
          />
        </div>
      </main>
    </div>
  );
};

export default App;