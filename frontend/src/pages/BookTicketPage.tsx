import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routesApi } from '../api/routes';
import { schedulesApi } from '../api/schedules';
import type { ScheduleSearchResult } from '../api/schedules';
import { ticketsApi } from '../api/tickets';
import { useAuthStore } from '../store/authStore';
import { Search, Calendar, MapPin, Clock, Bus, AlertCircle } from 'lucide-react';

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

        if (confirm(`Book ticket for ${schedule.origin} → ${schedule.destination}?\nPrice: ${schedule.price} RWF`)) {
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
        <div className="container py-4">
            <div className="mb-4">
                <h1 className="h3 fw-bold text-dark">Book a Ticket</h1>
                <p className="text-muted">Search for available schedules and book your journey</p>
            </div>

            {/* Search Form */}
            <div className="card shadow-sm border-0 p-4 mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-md-5">
                        <label className="form-label fw-bold small text-secondary">
                            <MapPin size={16} className="d-inline me-1" />
                            Select Route
                        </label>
                        <select
                            className="form-select"
                            value={selectedRoute}
                            onChange={(e) => setSelectedRoute(e.target.value)}
                        >
                            <option value="">Choose a route...</option>
                            {routes?.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.origin || 'Unknown'} → {route.destination || 'Unknown'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-5">
                        <label className="form-label fw-bold small text-secondary">
                            <Calendar size={16} className="d-inline me-1" />
                            Select Date
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={selectedDate}
                            min={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="col-md-2">
                        <button
                            onClick={handleSearch}
                            disabled={!selectedRoute || !selectedDate || schedulesLoading}
                            className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                        >
                            {schedulesLoading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <Search size={20} />}
                            {schedulesLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            {schedulesLoading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Searching schedules...</p>
                </div>
            )}

            {schedules && schedules.length > 0 && (
                <div>
                    <h2 className="h4 fw-bold mb-3 text-dark">
                        Available Schedules
                    </h2>
                    <div className="d-flex flex-column gap-3">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="card shadow-sm border-0 p-4">
                                <div className="row align-items-center gy-4">
                                    <div className="col-lg-8">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <MapPin size={20} className="text-primary" />
                                            <div>
                                                <h3 className="h6 fw-bold mb-0 text-dark">
                                                    {schedule.origin} → {schedule.destination}
                                                </h3>
                                                <div className="small text-muted">
                                                    {schedule.company_name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-sm-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Clock size={16} className="text-secondary" />
                                                    <div>
                                                        <div className="small text-muted">Departure</div>
                                                        <div className="fw-bold text-dark">
                                                            {new Date(schedule.departure_time).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {schedule.arrival_time && (
                                                <div className="col-sm-4">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Clock size={16} className="text-secondary" />
                                                        <div>
                                                            <div className="small text-muted">Arrival</div>
                                                            <div className="fw-bold text-dark">
                                                                {new Date(schedule.arrival_time).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="col-sm-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Bus size={16} className="text-secondary" />
                                                    <div>
                                                        <div className="small text-muted">Bus</div>
                                                        <div className="fw-bold text-dark">{schedule.bus_plate_number}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-sm-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="small text-muted">Seats:</div>
                                                    <div className={`fw-bold ${schedule.available_seats > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {schedule.available_seats} / {schedule.bus_capacity}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4 text-lg-end text-center border-start-lg ps-lg-4">
                                        <div className="h3 fw-bold text-primary mb-3">
                                            {schedule.price} RWF
                                        </div>
                                        <button
                                            onClick={() => handleBookTicket(schedule)}
                                            disabled={schedule.available_seats <= 0 || bookTicketMutation.isPending}
                                            className={`btn ${schedule.available_seats > 0 ? 'btn-primary' : 'btn-secondary'} w-100 fw-bold`}
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
                <div className="card shadow-sm border-0 p-5 text-center">
                    <div className="mb-3 text-muted">
                        <AlertCircle size={48} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">No schedules found</h3>
                    <p className="text-muted">No available schedules for the selected route and date. Please try a different date.</p>
                </div>
            )}

            {!selectedRoute || !selectedDate ? (
                <div className="card shadow-sm border-0 p-5 text-center mt-4">
                    <div className="mb-3 text-muted opacity-50">
                        <Search size={48} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">Search for schedules</h3>
                    <p className="text-muted">Select a route and date to search for available schedules</p>
                </div>
            ) : null}
        </div>
    );
};

export default BookTicketPage;

