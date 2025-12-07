import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bus, User, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom">
            <div className="container">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center">
                        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
                            <Bus className="text-primary" size={32} />
                            <span className="h5 mb-0 font-weight-bold text-dark">BusTicket</span>
                        </Link>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                <div className="d-flex align-items-center gap-2 text-secondary">
                                    <User size={20} />
                                    <span className="d-none d-md-block font-weight-medium">{user?.full_name}</span>
                                </div>
                                <Link
                                    to="/my-tickets"
                                    className="text-secondary text-decoration-none font-weight-medium small"
                                >
                                    My Tickets
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-link text-danger text-decoration-none font-weight-medium small p-0 d-flex align-items-center gap-1"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-secondary text-decoration-none font-weight-medium"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
