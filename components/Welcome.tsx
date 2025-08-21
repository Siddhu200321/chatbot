import React from 'react';
import { Icon } from './Icon';
import { ChatMode } from './ChatInput';

const examplePrompts = [
    {
        title: "Create a vibrant image",
        prompt: "A photorealistic image of a futuristic city skyline at sunset, with flying cars.",
        mode: 'image' as ChatMode,
    },
    {
        title: "Find a code snippet",
        prompt: "Using web search, find a Javascript code snippet to create a confetti effect on a button click.",
        mode: 'search' as ChatMode,
    },
    {
        title: "Explain a concept",
        prompt: "Explain the concept of quantum entanglement in simple terms.",
        mode: 'chat' as ChatMode,
    },
    {
        title: "Draft an email",
        prompt: "Draft an email to my team asking for project status updates.",
        mode: 'chat' as ChatMode,
    },
];

interface WelcomeProps {
    onPromptClick: (prompt: string, mode?: ChatMode) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onPromptClick }) => {
    return (
        <div className="flex flex-col justify-center items-center h-full text-center p-4">
            <div className="flex-1 flex flex-col justify-center items-center">
                <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-brand-primary">
                    <Icon name="ai" className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-brand-text-primary mb-10">How can I help you today?</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-4xl">
                    {examplePrompts.map(({ title, prompt, mode }, i) => (
                        <button
                            key={i}
                            onClick={() => onPromptClick(prompt, mode)}
                            className="p-4 bg-brand-surface border border-brand-border rounded-lg text-left hover:bg-brand-border transition-colors duration-200"
                        >
                            <p className="text-brand-text-primary font-medium text-sm">{title}</p>
                            <p className="text-brand-text-secondary text-sm mt-1">{prompt}</p>
                        </button>
                    ))}
                </div>
            </div>
            
            <footer className="text-xs text-brand-text-secondary py-4">
                Powered by Google Gemini
            </footer>
        </div>
    );
};
