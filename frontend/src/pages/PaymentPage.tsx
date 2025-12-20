import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments';
import { ticketsApi } from '../api/tickets';
import { CreditCard, Smartphone, Loader, CheckCircle, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


const PaymentPage = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<'momo' | 'tigocash' | 'card' | 'paypal'>('momo');

    // Get ticket details
    const { data: ticket, isLoading: ticketLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => ticketsApi.getById(ticketId!),
        enabled: !!ticketId,
        refetchInterval: (query) => {
            const t = query.state.data;
            if (t?.status === 'paid' || t?.status === 'active') return false;
            return 3000;
        }
    });

    // Create payment mutation
    const createPaymentMutation = useMutation({
        mutationFn: paymentsApi.create,
        onSuccess: () => {
            // Poll for payment status (handled by ticket polling)
            setTimeout(() => {
                navigate('/my-tickets');
            }, 2000);
        },
        onError: (error: any) => {
            alert(error.response?.data?.detail || 'Failed to initiate payment');
        },
    });

    const paymentStatus = ticket?.status === 'paid' || ticket?.status === 'active' ? 'success' : 'pending';



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Phone number required only for mobile money
        if ((selectedProvider === 'momo' || selectedProvider === 'tigocash') && !phoneNumber) {
            alert('Please enter phone number');
            return;
        }
        if (!ticketId) return;

        // Generate Idempotency Key
        const idempotencyKey = uuidv4();

        createPaymentMutation.mutate({
            ticket_id: ticketId,
            phone_number: (selectedProvider === 'momo' || selectedProvider === 'tigocash') ? phoneNumber : undefined,
            provider: selectedProvider,
            idempotency_key: idempotencyKey
        });
    };

    if (ticketLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading ticket...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="empty-state card">
                <XCircle size={64} />
                <h3>Ticket not found</h3>
                <p>The ticket you're looking for doesn't exist</p>
            </div>
        );
    }

    // Get route price from ticket route data
    const price = typeof ticket.route === 'object' && ticket.route !== null
        ? (ticket.route as any).price || 0
        : 0;

    return (
        <div className="container py-4">
            <div className="text-center mb-5">
                <h1 className="h3 fw-bold text-dark">Complete Payment</h1>
                <p className="text-muted">Pay for your ticket to confirm your booking</p>
            </div>

            <div className="mx-auto" style={{ maxWidth: '600px' }}>
                {/* Ticket Summary */}
                <div className="card shadow-sm border-0 p-4 mb-4">
                    <h2 className="h5 fw-bold mb-3 border-bottom pb-2">Ticket Summary</h2>
                    <div className="d-flex flex-column gap-2 text-sm">
                        <div className="d-flex justify-content-between">
                            <span className="text-muted">Ticket ID:</span>
                            <span className="fw-bold">#{ticket.id.slice(0, 8)}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                            <span className="text-muted">Route:</span>
                            <span className="fw-bold">
                                {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                            </span>
                        </div>
                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                            <span className="h5 fw-bold">Total Amount:</span>
                            <span className="h5 fw-bold text-primary">{price} RWF</span>
                        </div>
                    </div>
                </div>

                {/* Payment Status */}
                {(paymentStatus === 'success' || createPaymentMutation.isSuccess) && (
                    <div className={`alert ${paymentStatus === 'success' ? 'alert-success' : 'alert-warning'} d-flex align-items-center mb-4`} role="alert">
                        <div className="me-3">
                            {paymentStatus === 'success' ? (
                                <CheckCircle size={32} />
                            ) : (
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="alert-heading h6 fw-bold mb-1">
                                Payment {paymentStatus === 'success' ? 'Successful' : 'Processing'}
                            </h4>
                            <p className="mb-0 small">
                                {paymentStatus === 'success'
                                    ? 'Your ticket has been confirmed!'
                                    : 'Waiting for payment confirmation...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Payment Form */}
                {paymentStatus !== 'success' && (
                    <div className="card shadow-sm border-0 p-4">
                        <h2 className="h5 fw-bold mb-3">Payment Method</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary">
                                    Select Payment Provider
                                </label>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProvider('momo')}
                                            className={`btn w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3 border ${selectedProvider === 'momo' ? 'btn-primary bg-opacity-10 text-primary border-primary' : 'btn-light text-secondary'}`}
                                        >
                                            <Smartphone size={24} />
                                            <span className="fw-bold small">MTN Momo</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProvider('tigocash')}
                                            className={`btn w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3 border ${selectedProvider === 'tigocash' ? 'btn-primary bg-opacity-10 text-primary border-primary' : 'btn-light text-secondary'}`}
                                        >
                                            <Smartphone size={24} />
                                            <span className="fw-bold small">Airtel Money</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProvider('card')}
                                            className={`btn w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3 border ${selectedProvider === 'card' ? 'btn-primary bg-opacity-10 text-primary border-primary' : 'btn-light text-secondary'}`}
                                        >
                                            <CreditCard size={24} />
                                            <span className="fw-bold small">Card</span>
                                        </button>
                                    </div>
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProvider('paypal')}
                                            className={`btn w-100 d-flex flex-column align-items-center justify-content-center gap-2 p-3 border ${selectedProvider === 'paypal' ? 'btn-primary bg-opacity-10 text-primary border-primary' : 'btn-light text-secondary'}`}
                                        >
                                            <CreditCard size={24} />
                                            <span className="fw-bold small">PayPal</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                {(selectedProvider === 'momo' || selectedProvider === 'tigocash') && (
                                    <>
                                        <label className="form-label fw-bold small text-secondary">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter your phone number"
                                            required
                                            className="form-control"
                                        />
                                    </>
                                )}
                                {(selectedProvider === 'card') && (
                                    <div className="p-3 bg-light text-center rounded text-muted">
                                        Mock Payment: Click Pay to simulate Card success.
                                    </div>
                                )}
                                {(selectedProvider === 'paypal') && (
                                    <div className="p-3 bg-light text-center rounded text-muted">
                                        Mock Payment: Click Pay to simulate PayPal success.
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={createPaymentMutation.isPending || ((selectedProvider === 'momo' || selectedProvider === 'tigocash') && !phoneNumber)}
                                className="btn btn-primary w-100 fw-bold py-2"
                            >
                                {createPaymentMutation.isPending ? 'Processing...' : `Pay ${price} RWF`}
                            </button>
                        </form>
                    </div>
                )}

                {paymentStatus === 'success' && (
                    <button
                        onClick={() => navigate('/my-tickets')}
                        className="btn btn-primary w-100 fw-bold py-2 mt-4"
                    >
                        View My Tickets
                    </button>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;

