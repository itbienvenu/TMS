import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Loader } from 'lucide-react';

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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8008/api/v1/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    role: "customer"
                })
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting to the server. please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

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
                                    {msg.content}
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
