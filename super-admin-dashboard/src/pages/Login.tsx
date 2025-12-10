import { useState } from 'react';
import api from '../services/api';
import { Button, TextField, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // We reload window on success to re-trigger AuthProvider check or we can just set state manually

    const handleLoginStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/company-login/start', {
                login_email: email,
                password: password
            });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/company-login/verify', {
                login_email: email,
                code: otp
            });

            const token = response.data.access_token;
            localStorage.setItem('super_admin_token', token);

            // Verify role
            const meResponse = await api.get('/companies/me');
            const roles = meResponse.data.roles || [];
            const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');

            if (isSuperAdmin) {
                window.location.href = '/'; // Reload to init auth state
            } else {
                setError('You are not authorized as Super Admin');
                localStorage.removeItem('super_admin_token');
            }

        } catch (err: any) {
            setError(err.response?.data?.detail || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f3f4f6' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" align="center" gutterBottom color="primary">
                    Super Admin Portal
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {step === 'credentials' ? (
                    <form onSubmit={handleLoginStart}>
                        <TextField
                            fullWidth
                            label="Username or Email"
                            variant="outlined"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            OTP sent to registered email for <b>{email}</b>
                        </Alert>
                        <TextField
                            fullWidth
                            label="Enter OTP Code"
                            variant="outlined"
                            margin="normal"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
                        </Button>
                        <Button
                            fullWidth
                            color="secondary"
                            onClick={() => { setStep('credentials'); setOtp(''); }}
                            sx={{ mt: 1 }}
                        >
                            Back
                        </Button>
                    </form>
                )}
            </Paper>
        </Box>
    );
};

export default Login;
