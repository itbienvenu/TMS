import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import { paymentsApi } from '../api/payments';
import { Loader, Printer, Eye, X, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';
import type { Ticket, PaymentCreate } from '../types';

const MyTicketsPage = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [paymentTicket, setPaymentTicket] = useState<Ticket | null>(null);

    // Payment Form State
    const [paymentProvider, setPaymentProvider] = useState<'card' | 'momo' | 'tigocash' | 'paypal'>('momo');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentError, setPaymentError] = useState('');

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['my-tickets'],
        queryFn: ticketsApi.getMyTickets,
    });

    const paymentMutation = useMutation({
        mutationFn: paymentsApi.processMock,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            setPaymentTicket(null);
            setPhoneNumber('');
            setPaymentError('');
            alert('Payment Successful!');
        },
        onError: (error: any) => {
            setPaymentError(error.response?.data?.detail || 'Payment failed');
        }
    });

    const handlePrint = () => {
        window.print();
    };

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentTicket) return;

        // Basic validation
        if ((paymentProvider === 'momo' || paymentProvider === 'tigocash') && !phoneNumber) {
            setPaymentError('Phone number is required for Mobile Money');
            return;
        }

        const paymentData: PaymentCreate = {
            ticket_id: paymentTicket.id,
            provider: paymentProvider,
            phone_number: (paymentProvider === 'momo' || paymentProvider === 'tigocash') ? phoneNumber : undefined
        };

        paymentMutation.mutate(paymentData);
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
                                        const isPaid = ticket.status.toLowerCase() === 'paid' || ticket.status.toLowerCase() === 'active'; // 'booked' is unpaid

                                        // Adjust logic: 'booked' implies unpaid
                                        // 'paid' implies paid
                                        // Assuming initial status is 'booked'
                                        const showPayButton = ticket.status.toLowerCase() === 'booked';

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
                                                    <span className={`badge rounded-pill bg-${isPaid ? 'success' : 'warning'}`}>
                                                        {ticket.status === 'booked' ? 'Pending Payment' : ticket.status}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        {showPayButton && (
                                                            <button
                                                                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                                                                onClick={() => setPaymentTicket(ticket)}
                                                            >
                                                                <Wallet size={16} />
                                                                Pay
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                                                            onClick={() => setSelectedTicket(ticket)}
                                                        >
                                                            <Eye size={16} />
                                                            View
                                                        </button>
                                                    </div>
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

            {/* Payment Modal */}
            {paymentTicket && (
                <div className="ticket-modal-overlay">
                    <div className="ticket-modal-backdrop" onClick={() => setPaymentTicket(null)}></div>
                    <div className="ticket-modal-content bg-white p-4 rounded-3 shadow-lg" style={{ maxWidth: '500px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="h4 fw-bold mb-0">Complete Payment</h3>
                            <button className="btn btn-light rounded-circle p-2" onClick={() => setPaymentTicket(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-light p-3 rounded-2 mb-4 border">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Ticket ID</span>
                                <span className="font-monospace">#{paymentTicket.id.slice(0, 8)}</span>
                            </div>
                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>Total Amount</span>
                                <span className="text-success">{paymentTicket.route?.price?.toLocaleString()} RWF</span>
                            </div>
                        </div>

                        <form onSubmit={handlePaySubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-bold">Select Payment Method</label>
                                <div className="d-grid gap-2 grid-cols-2" style={{ gridTemplateColumns: '1fr 1fr', display: 'grid' }}>
                                    <button
                                        type="button"
                                        className={`btn text-start p-3 d-flex align-items-center gap-2 ${paymentProvider === 'momo' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setPaymentProvider('momo')}
                                    >
                                        <Smartphone size={20} />
                                        MTN Momo
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn text-start p-3 d-flex align-items-center gap-2 ${paymentProvider === 'tigocash' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setPaymentProvider('tigocash')}
                                    >
                                        <Smartphone size={20} />
                                        Airtel Money
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn text-start p-3 d-flex align-items-center gap-2 ${paymentProvider === 'card' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setPaymentProvider('card')}
                                    >
                                        <CreditCard size={20} />
                                        Card
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn text-start p-3 d-flex align-items-center gap-2 ${paymentProvider === 'paypal' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setPaymentProvider('paypal')}
                                    >
                                        <Wallet size={20} />
                                        PayPal
                                    </button>
                                </div>
                            </div>

                            {/* Details Input based on Provider */}
                            {(paymentProvider === 'momo' || paymentProvider === 'tigocash') && (
                                <div className="mb-4 fade-in">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-control form-control-lg"
                                        placeholder="07..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {(paymentProvider === 'card') && (
                                <div className="mb-4 fade-in p-3 bg-light rounded text-center text-muted">
                                    <CreditCard size={32} className="mb-2" />
                                    <p className="mb-0">Card payment simulation. Click pay to proceed.</p>
                                </div>
                            )}

                            {(paymentProvider === 'paypal') && (
                                <div className="mb-4 fade-in p-3 bg-light rounded text-center text-muted">
                                    <Wallet size={32} className="mb-2" />
                                    <p className="mb-0">PayPal simulation. Click pay to proceed.</p>
                                </div>
                            )}

                            {paymentError && <div className="alert alert-danger py-2">{paymentError}</div>}

                            <button
                                type="submit"
                                className="btn btn-success btn-lg w-100 py-3 fw-bold"
                                disabled={paymentMutation.isPending}
                            >
                                {paymentMutation.isPending ? <Loader className="spinner" size={24} /> : `Pay ${paymentTicket.route?.price?.toLocaleString()} RWF`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
