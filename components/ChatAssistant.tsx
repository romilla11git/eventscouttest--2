"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { processChatQueryAction } from '@/app/actions/chat';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatAssistantProps {
    user: User;
}

/**
 * SafeMarkdown — zero XSS risk markdown renderer.
 * Converts **bold**, `code`, headings, and bullet lines
 * into typed React elements. No dangerouslySetInnerHTML used.
 */
function SafeMarkdown({ text }: { text: string }) {
    const lines = text.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Heading (## or #)
                if (line.startsWith('## ')) {
                    return <p key={i} className="font-black text-sm mt-2">{renderInline(line.slice(3))}</p>;
                }
                if (line.startsWith('# ')) {
                    return <p key={i} className="font-black text-base mt-2">{renderInline(line.slice(2))}</p>;
                }
                // Bullet lines
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <div key={i} className="flex gap-2 text-sm">
                            <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60 mt-[6px]" />
                            <span>{renderInline(line.slice(2))}</span>
                        </div>
                    );
                }
                // Numbered list
                const numMatch = line.match(/^(\d+)\.\s(.+)/);
                if (numMatch) {
                    return (
                        <div key={i} className="flex gap-2 text-sm">
                            <span className="shrink-0 font-bold opacity-60">{numMatch[1]}.</span>
                            <span>{renderInline(numMatch[2])}</span>
                        </div>
                    );
                }
                // Empty line
                if (!line.trim()) return <div key={i} className="h-1" />;
                // Default paragraph
                return <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>;
            })}
        </div>
    );
}

/** Renders inline bold (**text**) and inline code (`code`) safely. */
function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Split on **bold** and `code` tokens
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        const token = match[0];
        if (token.startsWith('**')) {
            parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`')) {
            parts.push(
                <code key={key++} className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">
                    {token.slice(1, -1)}
                </code>
            );
        }
        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ user }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: `Greetings ${user.name}. I am the iWorth Intelligence Network Assistant. I am monitoring the Nairobi tech sector database. How can I assist your operations today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const result = await processChatQueryAction(userMessage);

            if (result.success && result.text) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.text! }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + (result.error || "Neural link dropped.") }]);
            }
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: "System communication failure." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-500">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative">
                    <i className="fas fa-brain text-cyan-500"></i>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                </div>
                <div>
                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Intelligence Terminal</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Connected: iWorth Central DB</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-950/50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-2xl rounded-2xl p-5 ${msg.role === 'user'
                            ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md shadow-cyan-600/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700'
                            }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center space-x-2 mb-3 opacity-60">
                                    <i className="fas fa-robot text-xs"></i>
                                    <span className="text-[9px] font-black uppercase tracking-widest">System Response</span>
                                </div>
                            )}
                            <div className="font-medium leading-relaxed">
                                <SafeMarkdown text={msg.content} />
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm p-5 border border-gray-200 dark:border-gray-700 flex space-x-2 items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Interrogate intelligence database..."
                        className="w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pl-6 pr-16 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm font-medium border border-gray-200 dark:border-gray-800 shadow-inner"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 w-10 h-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-xl flex items-center justify-center transition-colors shadow-md shadow-cyan-500/20 active:scale-95 disabled:active:scale-100"
                    >
                        <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatAssistant;
