import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routesApi } from '../api/routes';
import { schedulesApi } from '../api/schedules';
import type { ScheduleSearchResult } from '../api/schedules';
import { ticketsApi } from '../api/tickets';
import { useAuthStore } from '../store/authStore';
import { Search, Calendar, MapPin, Clock, Bus, Loader, AlertCircle } from 'lucide-react';
import './DashboardPage.css';

const BookTicketPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    
    const [selectedRoute, setSelectedRoute] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    
    // Get all routes
    const { data: routes } = useQuery({
        queryKey: ['routes'],
        queryFn: routesApi.getAll,
    });

    // Search schedules
    const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useQuery({
        queryKey: ['schedules-search', selectedRoute, selectedDate],
        queryFn: () => schedulesApi.search({
            route_id: selectedRoute || undefined,
            date: selectedDate || undefined,
        }),
        enabled: !!selectedRoute && !!selectedDate,
    });

    // Book ticket mutation
    const bookTicketMutation = useMutation({
        mutationFn: ticketsApi.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
            navigate(`/payment/${data.id}`);
        },
        onError: (error: any) => {
            alert(error.response?.data?.detail || 'Failed to book ticket');
        },
    });

    const handleSearch = () => {
        if (!selectedRoute || !selectedDate) {
            alert('Please select a route and date');
            return;
        }
        refetchSchedules();
    };

    const handleBookTicket = (schedule: ScheduleSearchResult) => {
        if (!user?.id) {
            alert('Please login to book a ticket');
            navigate('/login');
            return;
        }

        if (schedule.available_seats <= 0) {
            alert('No seats available');
            return;
        }

        if (confirm(`Book ticket for ${schedule.origin} → ${schedule.destination}?\nPrice: ${schedule.price} FCFA`)) {
            bookTicketMutation.mutate({
                user_id: user.id,
                bus_id: schedule.bus_id,
                route_id: schedule.route_id,
                schedule_id: schedule.id,
            });
        }
    };

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Book a Ticket</h1>
                <p className="page-subtitle">Search for available schedules and book your journey</p>
            </div>

            {/* Search Form */}
            <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)', gridTemplateColumns: '1fr 1fr auto' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                            <MapPin size={16} style={{ display: 'inline', marginRight: 'var(--spacing-xs)' }} />
                            Select Route
                        </label>
                        <select
                            value={selectedRoute}
                            onChange={(e) => setSelectedRoute(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--gray-300)',
                                fontSize: '1rem',
                            }}
                        >
                            <option value="">Choose a route...</option>
                            {routes?.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.origin || 'Unknown'} → {route.destination || 'Unknown'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                            <Calendar size={16} style={{ display: 'inline', marginRight: 'var(--spacing-xs)' }} />
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            min={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--gray-300)',
                                fontSize: '1rem',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            onClick={handleSearch}
                            disabled={!selectedRoute || !selectedDate || schedulesLoading}
                            style={{
                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                backgroundColor: 'var(--primary-600)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: (!selectedRoute || !selectedDate || schedulesLoading) ? 'not-allowed' : 'pointer',
                                opacity: (!selectedRoute || !selectedDate || schedulesLoading) ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                            }}
                        >
                            <Search size={20} />
                            {schedulesLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            {schedulesLoading && (
                <div className="loading-container">
                    <Loader className="spinner" size={48} />
                    <p>Searching schedules...</p>
                </div>
            )}

            {schedules && schedules.length > 0 && (
                <div>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.5rem' }}>
                        Available Schedules
                    </h2>
                    <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="card"
                                style={{
                                    padding: 'var(--spacing-xl)',
                                    border: '1px solid var(--gray-200)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                            <MapPin size={20} style={{ color: 'var(--primary-600)' }} />
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                                                    {schedule.origin} → {schedule.destination}
                                                </h3>
                                                <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                                    {schedule.company_name}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <Clock size={16} style={{ color: 'var(--gray-500)' }} />
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Departure</div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {new Date(schedule.departure_time).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {schedule.arrival_time && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    <Clock size={16} style={{ color: 'var(--gray-500)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Arrival</div>
                                                        <div style={{ fontWeight: 600 }}>
                                                            {new Date(schedule.arrival_time).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <Bus size={16} style={{ color: 'var(--gray-500)' }} />
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Bus</div>
                                                    <div style={{ fontWeight: 600 }}>{schedule.bus_plate_number}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Available Seats</div>
                                                <div style={{ fontWeight: 600, color: schedule.available_seats > 0 ? 'var(--success-600)' : 'var(--error-600)' }}>
                                                    {schedule.available_seats} / {schedule.bus_capacity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right', marginLeft: 'var(--spacing-xl)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-600)', marginBottom: 'var(--spacing-md)' }}>
                                            {schedule.price} FCFA
                                        </div>
                                        <button
                                            onClick={() => handleBookTicket(schedule)}
                                            disabled={schedule.available_seats <= 0 || bookTicketMutation.isPending}
                                            style={{
                                                padding: 'var(--spacing-md) var(--spacing-xl)',
                                                backgroundColor: schedule.available_seats > 0 ? 'var(--primary-600)' : 'var(--gray-400)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: schedule.available_seats > 0 ? 'pointer' : 'not-allowed',
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {bookTicketMutation.isPending ? 'Booking...' : schedule.available_seats > 0 ? 'Book Now' : 'Sold Out'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {schedules && schedules.length === 0 && selectedRoute && selectedDate && (
                <div className="empty-state card">
                    <AlertCircle size={64} />
                    <h3>No schedules found</h3>
                    <p>No available schedules for the selected route and date. Please try a different date.</p>
                </div>
            )}

            {!selectedRoute || !selectedDate ? (
                <div className="empty-state card">
                    <Search size={64} />
                    <h3>Search for schedules</h3>
                    <p>Select a route and date to search for available schedules</p>
                </div>
            ) : null}
        </div>
    );
};

export default BookTicketPage;

