import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { LogIn, Mail, Lock, Loader } from 'lucide-react';
import './AuthPages.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            setAuth(data.user, data.access_token);
            navigate('/dashboard');
        },
        onError: (error: any) => {
            setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        loginMutation.mutate({
            email,
            password_hash: password,
        });
    };

    return (
        <div className="auth-form fade-in">
            <div className="auth-form-header">
                <div className="auth-icon">
                    <LogIn size={32} />
                </div>
                <h2 className="auth-form-title">Welcome Back</h2>
                <p className="auth-form-subtitle">Sign in to your account to continue</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="email" className="form-label">
                        <Mail size={16} />
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password" className="form-label">
                        <Lock size={16} />
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? (
                        <>
                            <Loader className="spinner-icon" size={20} />
                            Signing in...
                        </>
                    ) : (
                        <>
                            <LogIn size={20} />
                            Sign In
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-link">
                        Create one now
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
