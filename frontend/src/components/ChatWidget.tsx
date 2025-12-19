import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageCircle, X, Loader, Mic, MicOff } from 'lucide-react';
import api from '../api/axios';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'assistant', content: 'Hello! I can help you find buses, check prices, or track your ride. You can also use voice!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const [sessionId, setSessionId] = useState('');

    useEffect(() => {
        let storedSessionId = localStorage.getItem('chat_session_id');
        if (!storedSessionId) {
            storedSessionId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', storedSessionId);
        }
        setSessionId(storedSessionId);
        scrollToBottom();
    }, [messages, isOpen]);

    // Speech Recognition Logic
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice search is not supported in this browser. Try Chrome.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            // Optional: Auto-submit
            // handleSubmit(null, transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSubmit = async (e: React.FormEvent | null, overrideInput?: string) => {
        if (e) e.preventDefault();
        const textToSend = overrideInput || input;

        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/chat/', {
                message: userMsg.content,
                role: "customer",
                session_id: sessionId,
                context: {}
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
                content: "Sorry, I'm having trouble connecting to the brain. Please try again."
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
                    className="btn btn-primary rounded-circle shadow-lg p-3 d-flex align-items-center justify-content-center position-relative"
                    style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)' }}
                >
                    <MessageCircle size={30} className="text-white" />
                    <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                    </span>
                </button>
            )}

            {isOpen && (
                <div className="card shadow-lg border-0" style={{ width: '360px', height: '550px', display: 'flex', flexDirection: 'column', borderRadius: '15px', overflow: 'hidden' }}>
                    <div className="card-header text-white d-flex justify-content-between align-items-center p-3"
                        style={{ background: 'linear-gradient(135deg, #0d6efd, #6610f2)' }}>
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-white bg-opacity-25 rounded-circle p-1">
                                <MessageCircle size={18} />
                            </div>
                            <h6 className="mb-0 fw-bold">Trip Assistant AI</h6>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white opacity-75 hover-opacity-100">
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
                                    className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                    style={{
                                        maxWidth: '85%',
                                        fontSize: '0.95rem',
                                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '1rem',
                                        borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '1rem'
                                    }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="mb-0 ps-3" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="mb-0 ps-3" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-decoration-underline" style={{ color: 'inherit' }} {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="d-flex justify-content-start mb-3">
                                <div className="bg-white px-3 py-2 rounded-4 shadow-sm border">
                                    <div className="d-flex align-items-center gap-2 text-muted small">
                                        <Loader className="animate-spin" size={14} />
                                        <span>AI is thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="card-footer p-3 bg-white border-top">
                        {isListening && (
                            <div className="text-center mb-2">
                                <span className="badge bg-danger animate-pulse">Listening... Speak now</span>
                            </div>
                        )}
                        <form onSubmit={(e) => handleSubmit(e)} className="d-flex gap-2 align-items-center">
                            <button
                                type="button"
                                className={`btn btn-light rounded-circle p-2 ${isListening ? 'text-danger shadow-sm' : 'text-secondary'}`}
                                onClick={startListening}
                                title="Use Voice"
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                            <input
                                type="text"
                                className="form-control rounded-pill bg-light border-0 px-3"
                                placeholder="Type or say a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary rounded-circle p-2 flex-shrink-0" disabled={isLoading || (!input.trim())}>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
