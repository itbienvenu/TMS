import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, TextField, Fab, CircularProgress, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const AdminChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'assistant', content: 'Super Admin Assistant initialized. I can run queries and analyze data.' }
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
            // In production, configure proxy or env var
            const res = await fetch('http://localhost:8008/api/v1/chat/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    role: "super_admin"
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
                content: "Error connecting to AI Service."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!isOpen && (
                <Fab
                    color="primary"
                    aria-label="chat"
                    onClick={() => setIsOpen(true)}
                    sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1200 }}
                >
                    <ChatIcon />
                </Fab>
            )}

            {isOpen && (
                <Paper
                    elevation={6}
                    sx={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        width: 380,
                        height: 500,
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1200,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SmartToyIcon />
                            <Typography variant="subtitle1" fontWeight="bold">System AI</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f3f4f6' }}>
                        {messages.map((msg) => (
                            <Box
                                key={msg.id}
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 2
                                }}
                            >
                                <Paper
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '85%',
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                                        color: msg.role === 'user' ? 'white' : 'text.primary',
                                        borderRadius: 2
                                    }}
                                >
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                                </Paper>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <Paper sx={{ p: 1, bgcolor: 'white' }}>
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={12} /> Thinking...
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1 }}
                    >
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Run SQL query (e.g. SELECT * FROM users)..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoComplete="off"
                        />
                        <Button type="submit" variant="contained" disabled={isLoading} sx={{ minWidth: 'auto', px: 2 }}>
                            <SendIcon fontSize="small" />
                        </Button>
                    </Box>
                </Paper>
            )}
        </>
    );
};

export default AdminChatWidget;
