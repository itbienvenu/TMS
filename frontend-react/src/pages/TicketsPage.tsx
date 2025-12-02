import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { Ticket as TicketIcon, Loader } from 'lucide-react';
import '../pages/DashboardPage.css';

const TicketsPage = () => {
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['all-tickets'],
        queryFn: ticketsApi.getAll,
    });

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading tickets...</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">All Tickets</h1>
                <p className="page-subtitle">Manage all system tickets</p>
            </div>

            {tickets && tickets.length > 0 ? (
                <div className="tickets-list">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="ticket-item card">
                            <div className="ticket-info">
                                <div className="ticket-id">Ticket #{ticket.id.slice(0, 8)}</div>
                                <div className="ticket-route">
                                    {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                </div>
                                <div className="ticket-date">
                                    {new Date(ticket.created_at).toLocaleDateString()} - {ticket.full_name || 'Guest'}
                                </div>
                            </div>
                            <div className="ticket-status">
                                <span className={`badge badge-${ticket.status === 'active' ? 'success' : 'warning'}`}>
                                    {ticket.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <TicketIcon size={64} />
                    <h3>No tickets found</h3>
                    <p>No tickets have been booked yet</p>
                </div>
            )}
        </div>
    );
};

export default TicketsPage;
