import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { busesApi } from '../api/buses';
import { routesApi } from '../api/routes';
import { Ticket, Bus, Route as RouteIcon, TrendingUp, Loader } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
    const { data: tickets, isLoading: ticketsLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: ticketsApi.getMyTickets,
    });

    const { data: buses, isLoading: busesLoading } = useQuery({
        queryKey: ['buses-public'],
        queryFn: busesApi.getAllPublic,
    });

    const { data: routes, isLoading: routesLoading } = useQuery({
        queryKey: ['routes'],
        queryFn: routesApi.getAll,
    });

    const stats = [
        {
            title: 'My Tickets',
            value: tickets?.length || 0,
            icon: Ticket,
            color: 'primary',
            trend: '+12%',
        },
        {
            title: 'Available Buses',
            value: buses?.length || 0,
            icon: Bus,
            color: 'secondary',
            trend: '+5%',
        },
        {
            title: 'Active Routes',
            value: routes?.length || 0,
            icon: RouteIcon,
            color: 'success',
            trend: '+8%',
        },
    ];

    if (ticketsLoading || busesLoading || routesLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's your overview</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className={`stat-card stat-${stat.color}`}>
                            <div className="stat-icon">
                                <Icon size={32} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-label">{stat.title}</div>
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-trend">
                                    <TrendingUp size={16} />
                                    <span>{stat.trend} from last month</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Tickets */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Recent Tickets</h2>
                    <a href="/my-tickets" className="section-link">
                        View all →
                    </a>
                </div>
                <div className="tickets-list">
                    {tickets && tickets.length > 0 ? (
                        tickets.slice(0, 5).map((ticket) => (
                            <div key={ticket.id} className="ticket-item card">
                                <div className="ticket-info">
                                    <div className="ticket-id">Ticket #{ticket.id.slice(0, 8)}</div>
                                    <div className="ticket-route">
                                        {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                    </div>
                                    <div className="ticket-date">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="ticket-status">
                                    <span className={`badge badge-${ticket.status === 'active' ? 'success' : 'warning'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Ticket size={48} />
                            <p>No tickets yet. Book your first ticket!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Available Buses */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2 className="section-title">Available Buses</h2>
                    <a href="/buses" className="section-link">
                        View all →
                    </a>
                </div>
                <div className="buses-grid">
                    {buses && buses.length > 0 ? (
                        buses.slice(0, 6).map((bus) => (
                            <div key={bus.id} className="bus-card card">
                                <div className="bus-icon">
                                    <Bus size={32} />
                                </div>
                                <div className="bus-info">
                                    <div className="bus-plate">{bus.plate_number}</div>
                                    <div className="bus-company">{bus.company?.name || 'Unknown'}</div>
                                    <div className="bus-seats">
                                        {bus.available_seats}/{bus.capacity} seats available
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Bus size={48} />
                            <p>No buses available at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
