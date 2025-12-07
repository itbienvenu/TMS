import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { Ticket as TicketIcon, Loader } from 'lucide-react';

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
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">All Tickets</h1>
                <p className="text-muted">Manage all system tickets</p>
            </div>

            {tickets && tickets.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card shadow-sm border-0 p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-bold text-dark">Ticket #{ticket.id.slice(0, 8)}</div>
                                    <div className="small text-muted mb-1">
                                        {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                    </div>
                                    <div className="small text-muted">
                                        {new Date(ticket.created_at).toLocaleDateString()} - {ticket.full_name || 'Guest'}
                                    </div>
                                </div>
                                <div>
                                    <span className={`badge rounded-pill bg-${ticket.status === 'active' ? 'success' : 'warning'} text-white`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card shadow-sm border-0 p-5 text-center">
                    <div className="mb-3 text-muted opacity-50">
                        <TicketIcon size={64} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">No tickets found</h3>
                    <p className="text-muted">No tickets have been booked yet</p>
                </div>
            )}
        </div>
    );
};

export default TicketsPage;
