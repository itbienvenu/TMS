import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { busesApi } from '../api/buses';
import { routesApi } from '../api/routes';
import { Ticket, Bus, Route as RouteIcon, TrendingUp, Loader } from 'lucide-react';

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
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">Dashboard</h1>
                <p className="text-muted">Welcome back! Here's your overview</p>
            </div>

            {/* Stats Grid */}
            <div className="row g-4 mb-5">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.title} className="col-md-4">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className={`p-3 rounded-3 bg-${stat.color} bg-opacity-10 me-3`}>
                                            <Icon size={24} className={`text-${stat.color}`} />
                                        </div>
                                        <div>
                                            <h6 className="card-subtitle text-muted mb-1">{stat.title}</h6>
                                            <h3 className="card-title fw-bold mb-0">{stat.value}</h3>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center text-success small">
                                        <TrendingUp size={16} className="me-1" />
                                        <span className="fw-semibold me-1">{stat.trend}</span>
                                        <span className="text-muted">from last month</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Tickets */}
            <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 fw-bold text-dark mb-0">Recent Tickets</h2>
                    <a href="/my-tickets" className="text-decoration-none fw-bold">
                        View all →
                    </a>
                </div>
                <div className="d-flex flex-column gap-3">
                    {tickets && tickets.length > 0 ? (
                        tickets.slice(0, 5).map((ticket) => (
                            <div key={ticket.id} className="card shadow-sm border-0">
                                <div className="card-body d-flex align-items-center justify-content-between">
                                    <div>
                                        <div className="fw-bold text-dark">Ticket #{ticket.id.slice(0, 8)}</div>
                                        <div className="small text-muted mb-1">
                                            {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                        </div>
                                        <div className="small text-muted">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`badge rounded-pill bg-${ticket.status === 'active' ? 'success' : 'warning'} text-white`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <Ticket size={48} className="mb-3 opacity-50" />
                            <p>No tickets yet. Book your first ticket!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Available Buses */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 fw-bold text-dark mb-0">Available Buses</h2>
                    <a href="/buses" className="text-decoration-none fw-bold">
                        View all →
                    </a>
                </div>
                <div className="row g-4">
                    {buses && buses.length > 0 ? (
                        buses.slice(0, 6).map((bus) => (
                            <div key={bus.id} className="col-md-6 col-lg-4">
                                <div className="card shadow-sm border-0 h-100">
                                    <div className="card-body text-center">
                                        <div className="d-flex justify-content-center mb-3">
                                            <div className="p-3 rounded-circle bg-light">
                                                <Bus size={32} className="text-primary" />
                                            </div>
                                        </div>
                                        <h5 className="card-title fw-bold mb-1">{bus.plate_number}</h5>
                                        <p className="card-text text-muted small mb-2">{bus.company?.name || 'Unknown'}</p>
                                        <p className="card-text fw-bold text-dark small">
                                            {bus.available_seats}/{bus.capacity} seats available
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center py-5 text-muted">
                            <Bus size={48} className="mb-3 opacity-50" />
                            <p>No buses available at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
