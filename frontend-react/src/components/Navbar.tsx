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
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <Bus className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">BusTicket</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User className="h-5 w-5" />
                                    <span className="hidden md:block font-medium">{user?.full_name}</span>
                                </div>
                                <Link
                                    to="/my-tickets"
                                    className="text-gray-600 hover:text-blue-600 font-medium text-sm"
                                >
                                    My Tickets
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-blue-600 font-medium"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition"
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
