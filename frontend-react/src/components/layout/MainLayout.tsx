import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    LayoutDashboard,
    Ticket,
    Bus,
    Route as RouteIcon,
    MapPin,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import './MainLayout.css';

const MainLayout = () => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/my-tickets', icon: Ticket, label: 'My Tickets' },
        { path: '/tickets', icon: Ticket, label: 'All Tickets', adminOnly: true },
        { path: '/buses', icon: Bus, label: 'Buses' },
        { path: '/routes', icon: RouteIcon, label: 'Routes' },
        { path: '/stations', icon: MapPin, label: 'Stations' },
    ];

    return (
        <div className="main-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <Bus className="logo-icon" />
                        <span className="logo-text">TicketHub</span>
                    </div>
                    <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-details">
                            <div className="user-name">{user?.full_name}</div>
                            <div className="user-email">{user?.email}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Top Bar */}
                <header className="top-bar">
                    <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="top-bar-title">
                        <h1>Bus Ticketing System</h1>
                    </div>
                    <div className="top-bar-actions">
                        <div className="user-badge">
                            <div className="user-avatar-small">
                                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="user-name-small">{user?.full_name}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
};

export default MainLayout;
