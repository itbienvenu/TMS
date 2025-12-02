import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { UserPlus, Mail, Lock, User, Phone, Loader } from 'lucide-react';
import './AuthPages.css';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: () => {
            navigate('/login');
        },
        onError: (error: any) => {
            setError(error.response?.data?.detail || 'Registration failed. Please try again.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        registerMutation.mutate({
            full_name: formData.full_name,
            email: formData.email,
            phone_number: formData.phone_number,
            password: formData.password,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="auth-form fade-in">
            <div className="auth-form-header">
                <div className="auth-icon">
                    <UserPlus size={32} />
                </div>
                <h2 className="auth-form-title">Create Account</h2>
                <p className="auth-form-subtitle">Join us and start booking your tickets</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="full_name" className="form-label">
                        <User size={16} />
                        Full Name
                    </label>
                    <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        className="form-input"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email" className="form-label">
                        <Mail size={16} />
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-input"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone_number" className="form-label">
                        <Phone size={16} />
                        Phone Number
                    </label>
                    <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        className="form-input"
                        placeholder="+255 XXX XXX XXX"
                        value={formData.phone_number}
                        onChange={handleChange}
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
                        name="password"
                        type="password"
                        className="form-input"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                        <Lock size={16} />
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="form-input"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={registerMutation.isPending}
                >
                    {registerMutation.isPending ? (
                        <>
                            <Loader className="spinner-icon" size={20} />
                            Creating account...
                        </>
                    ) : (
                        <>
                            <UserPlus size={20} />
                            Create Account
                        </>
                    )}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">
                        Sign in instead
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
