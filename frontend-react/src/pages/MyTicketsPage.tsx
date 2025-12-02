import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { Ticket as TicketIcon, Loader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import '../pages/DashboardPage.css';

const MyTicketsPage = () => {
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: ticketsApi.getMyTickets,
    });

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading your tickets...</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">My Tickets</h1>
                <p className="page-subtitle">View and manage your booked tickets</p>
            </div>

            {tickets && tickets.length > 0 ? (
                <div className="tickets-list">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card">
                            <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
                                        Ticket #{ticket.id.slice(0, 8)}
                                    </h3>
                                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                                        <div>
                                            <strong>Route:</strong> {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>Bus:</strong> {ticket.bus || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>Date:</strong> {new Date(ticket.created_at).toLocaleString()}
                                        </div>
                                        <div>
                                            <strong>Status:</strong>{' '}
                                            <span className={`badge badge-${ticket.status === 'active' ? 'success' : 'warning'}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <QRCodeSVG value={ticket.qr_code} size={120} />
                                    <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                        Scan at boarding
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <TicketIcon size={64} />
                    <h3>No tickets yet</h3>
                    <p>Book your first ticket to get started!</p>
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage;
