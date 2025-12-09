import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Bus as BusIcon, AlertCircle } from 'lucide-react';
import { schedulesApi, type ScheduleSearchResult } from '../api/schedules';
import { ticketsApi } from '../api/tickets';
import { useAuthStore } from '../store/authStore';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuthStore();

    const [trips, setTrips] = useState<ScheduleSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingId, setBookingId] = useState<string | null>(null);

    const originId = searchParams.get('origin');
    const destinationId = searchParams.get('destination');
    const date = searchParams.get('date');

    useEffect(() => {
        const fetchTrips = async () => {
            setLoading(true);
            setError('');
            try {
                // calls /api/v1/schedules/search
                const data = await schedulesApi.search({
                    origin_id: originId || undefined,
                    destination_id: destinationId || undefined,
                    date: date || undefined
                });
                setTrips(data);
            } catch (err) {
                console.error("Failed to fetch trips", err);
                setError('Failed to load trips. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (originId || destinationId || date) {
            fetchTrips();
        }
    }, [originId, destinationId, date]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start: string, end: string) => {
        if (!end) return 'N/A';
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const handleBook = async (trip: ScheduleSearchResult) => {
        if (!isAuthenticated || !user?.id) {
            // Redirect to login, retain current location to return here
            navigate('/login', { state: { from: location } });
            return;
        }

        if (trip.available_seats <= 0) {
            alert('Sorry, this bus is full.');
            return;
        }

        // Simple confirmation before booking
        if (window.confirm(`Confirm booking for ${trip.origin} → ${trip.destination}?\nPrice: ${trip.price} RWF`)) {
            setBookingId(trip.id);
            try {
                const ticket = await ticketsApi.create({
                    user_id: user.id,
                    bus_id: trip.bus_id,
                    route_id: trip.route_id,
                    schedule_id: trip.id
                });
                // Navigate directly to payment
                navigate(`/payment/${ticket.id}`);
            } catch (err: any) {
                console.error("Booking failed", err);
                alert(err.response?.data?.detail || 'Failed to book ticket.');
            } finally {
                setBookingId(null);
            }
        }
    };

    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container" style={{ maxWidth: '900px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h4 fw-bold text-dark mb-0">Search Results</h2>
                    <div className="badge bg-white text-secondary shadow-sm rounded-pill px-3 py-2 fw-normal border">
                        {date} <span className="mx-2">•</span> {trips.length} Buses Found
                    </div>
                </div>

                {loading ? (
                    <div className="d-flex justify-content-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                ) : trips.length === 0 ? (
                    <div className="card border-0 shadow-sm p-5 text-center">
                        <div className="mb-3">
                            <BusIcon className="text-secondary opacity-50" size={64} />
                        </div>
                        <h3 className="h5 fw-bold text-dark mb-2">No buses found</h3>
                        <p className="text-muted mb-4">Try changing your search criteria or date.</p>
                        <div className="d-inline-block">
                            <button
                                onClick={() => navigate('/')}
                                className="btn btn-link text-decoration-none fw-bold"
                            >
                                Go back to search
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {trips.map((trip) => (
                            <div key={trip.id} className="card border-0 shadow-sm p-4">
                                <div className="row align-items-center gy-4">
                                    {/* Company Info */}
                                    <div className="col-md-3">
                                        <h3 className="h6 fw-bold text-dark mb-1">{trip.company_name}</h3>
                                        <div className="small text-muted d-flex align-items-center gap-1">
                                            <BusIcon size={14} />
                                            {trip.bus_plate_number}
                                            <span className="mx-1">•</span>
                                            <span className={trip.available_seats > 0 ? "text-success" : "text-danger"}>
                                                {trip.available_seats} seats
                                            </span>
                                        </div>
                                    </div>

                                    {/* Journey Info */}
                                    <div className="col-md-6">
                                        <div className="d-flex align-items-center justify-content-center gap-4 text-center">
                                            <div className="flex-shrink-0">
                                                <div className="fw-bold fs-5 text-dark">{formatTime(trip.departure_time)}</div>
                                                <div className="small text-muted text-truncate" style={{ maxWidth: '100px' }}>{trip.origin}</div>
                                            </div>

                                            <div className="flex-grow-1 d-flex flex-column align-items-center px-3">
                                                <div className="small text-muted mb-1">{calculateDuration(trip.departure_time, trip.arrival_time)}</div>
                                                <div className="w-100 position-relative border-top">
                                                    <span className="position-absolute top-0 end-0 translate-middle-y" style={{ borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '6px solid #dee2e6' }}></span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                <div className="fw-bold fs-5 text-dark">{trip.arrival_time ? formatTime(trip.arrival_time) : '--:--'}</div>
                                                <div className="small text-muted text-truncate" style={{ maxWidth: '100px' }}>{trip.destination}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="col-md-3 text-md-end text-center">
                                        <div className="h4 fw-bold text-primary mb-3">
                                            {trip.price} RWF
                                        </div>
                                        <button
                                            onClick={() => handleBook(trip)}
                                            disabled={trip.available_seats <= 0 || bookingId === trip.id}
                                            className={`btn ${trip.available_seats > 0 ? 'btn-warning' : 'btn-secondary'} text-white fw-bold w-100`}
                                        >
                                            {bookingId === trip.id ? 'Booking...' : trip.available_seats > 0 ? 'Book Ticket' : 'Sold Out'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
