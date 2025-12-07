import { Bus } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div className="row g-0">
                        <div className="col-lg-6 d-none d-lg-flex bg-primary text-white p-5 flex-column justify-content-center position-relative overflow-hidden">
                            <div className="position-relative z-1">
                                <div className="d-flex align-items-center gap-2 mb-4">
                                    <Bus size={40} />
                                    <span className="h1 fw-bold mb-0">TicketHub</span>
                                </div>
                                <h1 className="display-6 fw-bold mb-3">Modern Bus Ticketing System</h1>
                                <p className="lead mb-5 opacity-75">
                                    Book your bus tickets seamlessly. Fast, secure, and reliable ticketing platform
                                    for all your travel needs.
                                </p>
                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white bg-opacity-25 rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>✓</div>
                                        <span className="fw-medium">Instant Booking</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white bg-opacity-25 rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>✓</div>
                                        <span className="fw-medium">Secure Payments</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-white bg-opacity-25 rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>✓</div>
                                        <span className="fw-medium">Real-time Updates</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 p-5 d-flex align-items-center justify-content-center bg-white">
                            <div className="w-100" style={{ maxWidth: '400px' }}>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
