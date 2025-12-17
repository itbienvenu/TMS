import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from = location.state?.from || '/';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', {
                email: email,
                password_hash: password,
                user_type: 'user'
            });

            const { access_token } = res.data;
            // Set token first to allow authenticated requests
            try {
                localStorage.setItem('access_token', access_token);
            } catch (e) {
                console.error("Storage access denied");
            }

            // Fetch user details immediately to populate store
            const userRes = await api.get('/auth/me');
            const user = userRes.data;

            login(access_token, user);
            navigate(from, { replace: true });

        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h2 className="h3 fw-bold text-dark">Welcome Back</h2>
                <p className="text-muted mt-2">Sign in to your account to continue</p>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small" role="alert">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                    <label className="form-label fw-medium small text-secondary">Email Address</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <Mail className="text-secondary" size={18} />
                        </span>
                        <input
                            type="email"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label fw-medium small text-secondary">Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <Lock className="text-secondary" size={18} />
                        </span>
                        <input
                            type="password"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 fw-bold py-2 mt-2"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="mt-4 text-center small text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary text-decoration-none fw-bold">
                    Sign up
                </Link>
            </div>
        </AuthLayout>
    );
};

export default Login;
