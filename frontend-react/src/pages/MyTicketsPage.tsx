import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { Ticket as TicketIcon, Loader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">My Tickets</h1>
                <p className="text-muted">View and manage your booked tickets</p>
            </div>

            {tickets && tickets.length > 0 ? (
                <div className="d-flex flex-column gap-4">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="card shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="row align-items-center">
                                    <div className="col-lg-8">
                                        <h3 className="h5 fw-bold mb-3">
                                            Ticket #{ticket.id.slice(0, 8)}
                                        </h3>
                                        <div className="row g-3">
                                            <div className="col-sm-6">
                                                <div className="small text-muted mb-1">Route</div>
                                                <div className="fw-bold text-dark">
                                                    {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="small text-muted mb-1">Bus</div>
                                                <div className="fw-bold text-dark">{ticket.bus || 'N/A'}</div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="small text-muted mb-1">Date</div>
                                                <div className="fw-bold text-dark">{new Date(ticket.created_at).toLocaleString()}</div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="small text-muted mb-1">Status</div>
                                                <div>
                                                    <span className={`badge rounded-pill bg-${ticket.status === 'active' ? 'success' : 'warning'} text-white`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 mt-4 mt-lg-0 text-center border-start-lg ps-lg-4">
                                        <div className="bg-white p-2 d-inline-block border rounded">
                                            <QRCodeSVG value={ticket.qr_code} size={120} />
                                        </div>
                                        <div className="mt-2 small text-muted">
                                            Scan at boarding
                                        </div>
                                    </div>
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
                    <h3 className="h5 fw-bold text-dark">No tickets yet</h3>
                    <p className="text-muted">Book your first ticket to get started!</p>
                </div>
            )}
        </div>
    );
};

export default MyTicketsPage;
