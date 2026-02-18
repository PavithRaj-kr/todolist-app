'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Loader2, Sparkles, X } from 'lucide-react';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text?: string;
    suggestions?: string[];
}

interface ChatbotProps {
    messages: Message[];
    isPending: boolean;
    isAdding: boolean;
    onSendMessage: (text: string) => void;
    onAddTodo: (messageId: string, task: string) => void;
    onAddAll: (tasks: string[]) => void;
    onRemoveSuggestion: (messageId: string, task: string) => void;
}

export default function Chatbot({
    messages,
    isPending,
    isAdding,
    onSendMessage,
    onAddTodo,
    onAddAll,
    onRemoveSuggestion,
}: ChatbotProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isPending) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full w-full relative">

            {/* Header */}
            <div className="flex-none px-4 py-3 border-b border-white/20 bg-white/10 backdrop-blur-sm flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <Sparkles size={14} className="text-primary" />
                </div>
                <div>
                    <h3 className="font-bold text-stone-700 text-xs tracking-wide">AI Planner</h3>
                    {/* <p className="text-[10px] text-stone-500 font-medium leading-none mt-0.5">Powered by </p> */}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <div className="p-3 rounded-full bg-white/50 ring-1 ring-primary/20">
                            <Sparkles size={24} className="text-primary" />
                        </div>
                        <p className="text-xs text-stone-500 font-medium">How can I help you plan?</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 `}
                    >
                        {/* Message Bubble */}
                        {msg.text && (
                            <div
                                className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm backdrop-blur-sm ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-sm shadow-primary/20'
                                        : 'bg-white/80 text-stone-700 border border-white/60 rounded-tl-sm shadow-stone-200/50'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        )}

                        {/* Suggestion Cards */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="w-full mt-2 pl-1">
                                <div className="bg-white/40 rounded-xl border border-white/40 overflow-hidden ring-1 ring-white/20 shadow-sm backdrop-blur-md">
                                    <div className="bg-white/30 p-2 flex justify-between items-center border-b border-white/20">
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles size={10} /> Suggestions
                                        </span>
                                        <button
                                            onClick={() => onAddAll(msg.suggestions!)}
                                            disabled={isAdding}
                                            className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10 px-2 py-1 rounded-md transition-all font-semibold flex items-center gap-1"
                                        >
                                            {isAdding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                                            Add All
                                        </button>
                                    </div>
                                    <div className="divide-y divide-white/20">
                                        {msg.suggestions.map((task, idx) => (
                                            <div key={idx} className="p-2.5 flex items-center justify-between gap-2 group hover:bg-white/40 transition-colors">
                                                <div className="flex items-center gap-2.5">
                                                    <button
                                                        onClick={() => onAddTodo(msg.id, task)}
                                                        disabled={isAdding}
                                                        className="p-1 rounded-md text-stone-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <span className="text-xs text-stone-600 font-medium group-hover:text-stone-800 transition-colors">
                                                        {task}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveSuggestion(msg.id, task)}
                                                    className="p-1 rounded-md text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading Indicator */}
                {isPending && (
                    <div className="flex justify-start">
                        <div className="bg-white/60 px-3 py-2 rounded-2xl rounded-tl-sm border border-white/40 flex items-center gap-2 shadow-sm">
                            <Loader2 size={14} className="animate-spin text-primary" />
                            <span className="text-xs text-stone-500 font-medium animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-none p-3 bg-white/40 backdrop-blur-md border-t border-white/20">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full pl-3 pr-10 py-2.5 bg-white/70 border border-white/50 rounded-xl text-xs sm:text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                        disabled={isPending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isPending}
                        className="absolute right-1.5 p-1.5 bg-primary text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-md shadow-primary/20"
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
