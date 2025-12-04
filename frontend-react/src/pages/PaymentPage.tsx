import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments';
import { ticketsApi } from '../api/tickets';
import { CreditCard, Smartphone, Loader, CheckCircle, XCircle } from 'lucide-react';
import './DashboardPage.css';

const PaymentPage = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<'momo' | 'tigocash'>('momo');

    // Get ticket details
    const { data: ticket, isLoading: ticketLoading } = useQuery({
        queryKey: ['ticket', ticketId],
        queryFn: () => ticketsApi.getById(ticketId!),
        enabled: !!ticketId,
    });

    // Create payment mutation
    const createPaymentMutation = useMutation({
        mutationFn: paymentsApi.create,
        onSuccess: () => {
            // Poll for payment status
            setTimeout(() => {
                navigate('/my-tickets');
            }, 2000);
        },
        onError: (error: any) => {
            alert(error.response?.data?.detail || 'Failed to initiate payment');
        },
    });

    // Poll payment status
    const { data: payment } = useQuery({
        queryKey: ['payment', ticketId],
        queryFn: async () => {
            // Try to get payment for this ticket
            const payments = await paymentsApi.getMyPayments();
            return payments.find((p) => p.ticket_id === ticketId);
        },
        enabled: !!ticketId && createPaymentMutation.isSuccess,
        refetchInterval: (query) => {
            const paymentData = query.state.data;
            // Stop polling if payment is successful or failed
            if (paymentData?.status === 'success' || paymentData?.status === 'failed') {
                return false;
            }
            return 3000; // Poll every 3 seconds
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !ticketId) {
            alert('Please enter phone number');
            return;
        }

        createPaymentMutation.mutate({
            ticket_id: ticketId,
            phone_number: phoneNumber,
            provider: selectedProvider,
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
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Complete Payment</h1>
                <p className="page-subtitle">Pay for your ticket to confirm your booking</p>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Ticket Summary */}
                <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Ticket Summary</h2>
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--gray-600)' }}>Ticket ID:</span>
                            <span style={{ fontWeight: 600 }}>#{ticket.id.slice(0, 8)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--gray-600)' }}>Route:</span>
                            <span style={{ fontWeight: 600 }}>
                                {ticket.route?.origin || 'N/A'} → {ticket.route?.destination || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, paddingTop: 'var(--spacing-md)', borderTop: '2px solid var(--gray-200)' }}>
                            <span>Total Amount:</span>
                            <span style={{ color: 'var(--primary-600)' }}>{price} FCFA</span>
                        </div>
                    </div>
                </div>

                {/* Payment Status */}
                {payment && (
                    <div
                        className="card"
                        style={{
                            padding: 'var(--spacing-xl)',
                            marginBottom: 'var(--spacing-xl)',
                            backgroundColor: payment.status === 'success' ? 'var(--success-50)' : payment.status === 'failed' ? 'var(--error-50)' : 'var(--warning-50)',
                            border: `2px solid ${payment.status === 'success' ? 'var(--success-600)' : payment.status === 'failed' ? 'var(--error-600)' : 'var(--warning-600)'}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            {payment.status === 'success' ? (
                                <CheckCircle size={32} style={{ color: 'var(--success-600)' }} />
                            ) : payment.status === 'failed' ? (
                                <XCircle size={32} style={{ color: 'var(--error-600)' }} />
                            ) : (
                                <Loader className="spinner" size={32} />
                            )}
                            <div>
                                <h3 style={{ margin: 0 }}>
                                    Payment {payment.status === 'success' ? 'Successful' : payment.status === 'failed' ? 'Failed' : 'Pending'}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--gray-600)' }}>
                                    {payment.status === 'success'
                                        ? 'Your ticket has been confirmed!'
                                        : payment.status === 'failed'
                                        ? 'Payment failed. Please try again.'
                                        : 'Waiting for payment confirmation...'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Form */}
                {!payment && (
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Payment Method</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                                    Select Payment Provider
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProvider('momo')}
                                        style={{
                                            padding: 'var(--spacing-lg)',
                                            border: `2px solid ${selectedProvider === 'momo' ? 'var(--primary-600)' : 'var(--gray-300)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: selectedProvider === 'momo' ? 'var(--primary-50)' : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                        }}
                                    >
                                        <Smartphone size={24} />
                                        <span style={{ fontWeight: 600 }}>Mobile Money</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProvider('tigocash')}
                                        style={{
                                            padding: 'var(--spacing-lg)',
                                            border: `2px solid ${selectedProvider === 'tigocash' ? 'var(--primary-600)' : 'var(--gray-300)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: selectedProvider === 'tigocash' ? 'var(--primary-50)' : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                        }}
                                    >
                                        <CreditCard size={24} />
                                        <span style={{ fontWeight: 600 }}>Tigo Cash</span>
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--gray-300)',
                                        fontSize: '1rem',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={createPaymentMutation.isPending || !phoneNumber}
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--primary-600)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    cursor: createPaymentMutation.isPending ? 'not-allowed' : 'pointer',
                                    opacity: createPaymentMutation.isPending ? 0.6 : 1,
                                }}
                            >
                                {createPaymentMutation.isPending ? 'Processing...' : `Pay ${price} FCFA`}
                            </button>
                        </form>
                    </div>
                )}

                {payment?.status === 'success' && (
                    <button
                        onClick={() => navigate('/my-tickets')}
                        style={{
                            width: '100%',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--primary-600)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        View My Tickets
                    </button>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;

