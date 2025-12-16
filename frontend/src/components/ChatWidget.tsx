import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageCircle, X, Loader } from 'lucide-react';
import api from '../api/axios';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'assistant', content: 'Hello! Need help finding a bus or checking your ticket?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const [sessionId, setSessionId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Generate or retrieve session ID
        let storedSessionId = localStorage.getItem('chat_session_id');
        if (!storedSessionId) {
            storedSessionId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', storedSessionId);
        }
        setSessionId(storedSessionId);
        scrollToBottom();

        // Check Login
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);
    }, [messages, isOpen]);

    // ... handleSubmit ... (Keep existing handleSubmit logic, simplified here for context)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Use axios instance (handles encryption if configured)
            const res = await api.post('/chat/', {
                message: userMsg.content,
                role: "customer", // Backend will override if token is present
                session_id: sessionId
            });

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: res.data.response
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting to the server. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) return null; // Don't verify render if not logged in

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px' }}
                >
                    <MessageCircle size={30} />
                </button>
            )}

            {isOpen && (
                <div className="card shadow-lg" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fs-6">Ticketing Assistant</h5>
                        <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="card-body p-3 overflow-auto flex-grow-1" style={{ backgroundColor: '#f8f9fa' }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                                <div
                                    className={`p-2 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}
                                    style={{ maxWidth: '80%', fontSize: '0.9rem' }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="mb-0 ps-3" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="mb-0 ps-3" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="d-flex justify-content-start mb-3">
                                <div className="bg-white border p-2 rounded-3">
                                    <Loader className="animate-spin" size={16} /> Typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="card-footer p-2 bg-white">
                        <form onSubmit={handleSubmit} className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Ask about buses..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
