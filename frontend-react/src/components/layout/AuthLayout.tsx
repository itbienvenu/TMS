import { Bus } from 'lucide-react';
import './AuthLayout.css';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-left">
                    <div className="auth-branding">
                        <div className="auth-logo">
                            <Bus className="auth-logo-icon" />
                            <span className="auth-logo-text">TicketHub</span>
                        </div>
                        <h1 className="auth-title">Modern Bus Ticketing System</h1>
                        <p className="auth-description">
                            Book your bus tickets seamlessly. Fast, secure, and reliable ticketing platform
                            for all your travel needs.
                        </p>
                        <div className="auth-features">
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>Instant Booking</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>Secure Payments</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">✓</div>
                                <span>Real-time Updates</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="auth-right">
                    <div className="auth-form-container">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
