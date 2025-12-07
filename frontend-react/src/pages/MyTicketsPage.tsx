import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { Loader, Printer, Eye, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';
import type { Ticket } from '../types';

const MyTicketsPage = () => {
    const { user } = useAuthStore();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: ticketsApi.getMyTickets,
    });

    const handlePrint = () => {
        window.print();
    };

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
            {/* Table View - Hidden when Printing */}
            <div className={`no-print ${selectedTicket ? 'd-none d-md-block' : ''}`}>
                <div className="mb-4">
                    <h1 className="h2 fw-bold text-dark mb-1">My Tickets</h1>
                    <p className="text-muted">Manage your bookings</p>
                </div>

                {tickets && tickets.length > 0 ? (
                    <div className="card border-0 shadow-sm overflow-hidden">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-0 py-3 ps-4">Ticket ID</th>
                                        <th className="border-0 py-3">Route</th>
                                        <th className="border-0 py-3">Date</th>
                                        <th className="border-0 py-3">Price</th>
                                        <th className="border-0 py-3">Status</th>
                                        <th className="border-0 py-3 text-end pe-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => {
                                        const date = new Date(ticket.created_at);
                                        return (
                                            <tr key={ticket.id}>
                                                <td className="ps-4 fw-medium text-muted font-monospace">
                                                    #{ticket.id.slice(0, 8)}
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold text-dark">
                                                            {ticket.route?.origin} → {ticket.route?.destination}
                                                        </span>
                                                        <small className="text-muted">{ticket.company_name || 'Bus Company'}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span>{date.toLocaleDateString()}</span>
                                                        <small className="text-muted">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                    </div>
                                                </td>
                                                <td className="fw-bold text-success">
                                                    {ticket.route?.price?.toLocaleString()} RWF
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill bg-${ticket.status.toLowerCase() === 'active' ? 'success' : 'secondary'}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                                                        onClick={() => setSelectedTicket(ticket)}
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 text-center bg-light rounded-3">
                        <p className="text-muted mb-0">No tickets found.</p>
                    </div>
                )}
            </div>

            {/* Ticket Detail Overlay/Modal - Visible when selected or printing */}
            {selectedTicket && (
                <div className="ticket-modal-overlay">
                    <div className="ticket-modal-backdrop" onClick={() => setSelectedTicket(null)}></div>
                    <div className="ticket-modal-content">
                        {/* Close Button (Screen Only) */}
                        <div className="d-flex justify-content-end mb-3 no-print">
                            <button className="btn btn-light rounded-circle shadow-sm" onClick={() => setSelectedTicket(null)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Classic Ticket Design */}
                        <div className="classic-ticket p-4 bg-white border shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                            {/* Header */}
                            <div className="text-center mb-4 pb-3 border-bottom border-2 border-dark">
                                <h2 className="fw-bold text-uppercase mb-1" style={{ fontSize: '1.8rem' }}>
                                    {selectedTicket.company_name || 'BUS TICKET'}
                                </h2>
                                <p className="mb-0 text-muted fw-bold">OFFICIAL TRAVEL DOCUMENT</p>
                            </div>

                            {/* Main Info Grid */}
                            <div className="row g-4 mb-4">
                                {/* Route */}
                                <div className="col-12">
                                    <div className="p-3 border border-dark rounded-2 bg-light">
                                        <div className="row align-items-center text-center">
                                            <div className="col-5">
                                                <div className="small text-uppercase fw-bold text-secondary">From</div>
                                                <div className="fs-4 fw-bolder text-dark text-break">{selectedTicket.route?.origin}</div>
                                            </div>
                                            <div className="col-2">
                                                <span className="fs-3">➝</span>
                                            </div>
                                            <div className="col-5">
                                                <div className="small text-uppercase fw-bold text-secondary">To</div>
                                                <div className="fs-4 fw-bolder text-dark text-break">{selectedTicket.route?.destination}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="col-6">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Date</div>
                                    <div className="fs-5 fw-bold text-dark">
                                        {new Date(selectedTicket.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Time</div>
                                    <div className="fs-5 fw-bold text-dark">
                                        {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* Bus & Seat */}
                                <div className="col-6">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Bus Plate</div>
                                    <div className="fs-5 fw-bold text-dark font-monospace bg-light d-inline-block px-2 rounded-1 border">
                                        {selectedTicket.bus || '---'}
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Price</div>
                                    <div className="fs-5 fw-bold text-dark">
                                        {selectedTicket.route?.price?.toLocaleString()} RWF
                                    </div>
                                </div>

                                {/* Passenger */}
                                <div className="col-12">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Passenger Name</div>
                                    <div className="fs-5 fw-bold text-dark border-bottom border-dark pb-1">
                                        {user?.full_name || 'Paid Passenger'}
                                    </div>
                                </div>

                                {/* Drivers (Optional) */}
                                {selectedTicket.drivers && selectedTicket.drivers.length > 0 && (
                                    <div className="col-12">
                                        <div className="small text-uppercase fw-bold text-secondary mb-1">Driver</div>
                                        <div className="fw-medium text-dark">
                                            {selectedTicket.drivers.join(', ')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer / QR Code */}
                            <div className="row align-items-center mt-4 pt-3 border-top border-2 border-dark border-dashed">
                                <div className="col-8">
                                    <div className="small text-uppercase fw-bold text-secondary mb-1">Ticket ID</div>
                                    <div className="font-monospace text-dark mb-2">{selectedTicket.id}</div>
                                    <div className="small text-muted fst-italic">
                                        Please present this ticket at boarding.
                                        Keep it safe.
                                    </div>
                                </div>
                                <div className="col-4 text-end">
                                    <QRCodeSVG value={selectedTicket.qr_code} size={100} />
                                </div>
                            </div>
                        </div>

                        {/* Print Button Wrapper */}
                        <div className="text-center mt-4 no-print">
                            <button onClick={handlePrint} className="btn btn-primary btn-lg shadow d-inline-flex align-items-center gap-2">
                                <Printer size={20} />
                                Print Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .ticket-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 1050;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }
                .ticket-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1051;
                }
                .ticket-modal-content {
                    position: relative;
                    z-index: 1052;
                    width: 100%;
                    max-width: 650px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .d-none.d-md-block {
                        display: none !important;
                    }
                    .ticket-modal-overlay {
                        position: static;
                        display: block;
                        width: auto;
                        height: auto;
                        padding: 0;
                    }
                    .ticket-modal-backdrop {
                        display: none;
                    }
                    .ticket-modal-content {
                        max-width: none;
                        max-height: none;
                        overflow: visible;
                    }
                    .classic-ticket {
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
};

export default MyTicketsPage;
