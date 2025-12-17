import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Lock, Mail, User, Phone, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                password: formData.password,
                user_type: 'user'
            });

            // Redirect to login on success
            navigate('/login');

        } catch (err: any) {
            console.error("Registration failed", err);
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-4">
                <h2 className="h3 fw-bold text-dark">Create Account</h2>
                <p className="text-muted mt-2">Join us to book your next journey</p>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small" role="alert">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                    <label className="form-label fw-medium small text-secondary">Full Name</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <User className="text-secondary" size={18} />
                        </span>
                        <input
                            type="text"
                            name="full_name"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="John Doe"
                            value={formData.full_name}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label fw-medium small text-secondary">Email Address</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <Mail className="text-secondary" size={18} />
                        </span>
                        <input
                            type="email"
                            name="email"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label fw-medium small text-secondary">Phone Number</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <Phone className="text-secondary" size={18} />
                        </span>
                        <input
                            type="tel"
                            name="phone_number"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="+254 7..."
                            value={formData.phone_number}
                            onChange={handleChange}
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
                            name="password"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="form-label fw-medium small text-secondary">Confirm Password</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <Lock className="text-secondary" size={18} />
                        </span>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            className="form-control border-start-0 ps-0"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 fw-bold py-2 mt-2"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>

            <div className="mt-4 text-center small text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary text-decoration-none fw-bold">
                    Sign in
                </Link>
            </div>
        </AuthLayout>
    );
};

export default Register;
