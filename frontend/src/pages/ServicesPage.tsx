import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type ScheduleSearchResult, schedulesApi } from '../api/schedules';
import { ticketsApi } from '../api/tickets';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MapPin, Calendar, Bus, Search } from 'lucide-react';
import { Modal } from 'react-bootstrap';

const ServicesPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSearchResult | null>(null);

    // Fetch schedules
    const { data: schedules, isLoading } = useQuery({
        queryKey: ['schedules-search-all'],
        queryFn: async () => {
            // Assuming empty object returns all or relevant schedules
            return await schedulesApi.search({});
        }
    });

    const bookTicketMutation = useMutation({
        mutationFn: ticketsApi.create,
        onSuccess: (data) => {
            navigate(`/payment/${data.id}`);
        },
        onError: (error: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msg = error.response?.data?.detail || 'Failed to book ticket';
            alert(msg);
        },
    });

    const filteredSchedules = schedules?.filter(schedule => {
        const matchesSearch =
            schedule.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
            schedule.destination.toLowerCase().includes(searchTerm.toLowerCase());

        const isFuture = new Date(schedule.departure_time) > new Date();

        return matchesSearch && isFuture;
    });

    const handleViewLocation = (schedule: ScheduleSearchResult) => {
        if (!isAuthenticated) {
            const confirmLogin = window.confirm("You must be logged in to view the bus location. Login now?");
            if (confirmLogin) navigate('/login');
            return;
        }
        setSelectedSchedule(schedule);
        setShowMapModal(true);
    };

    const handleBook = (schedule: ScheduleSearchResult) => {
        if (!isAuthenticated || !user?.id) {
            const confirmLogin = window.confirm("You must be logged in to book. Login now?");
            if (confirmLogin) navigate('/login');
            return;
        }

        if (schedule.available_seats <= 0) {
            alert('No seats available');
            return;
        }

        if (confirm(`Book ticket for ${schedule.origin} -> ${schedule.destination}?\nPrice: ${schedule.price} RWF`)) {
            bookTicketMutation.mutate({
                user_id: user.id,
                bus_id: schedule.bus_id,
                route_id: schedule.route_id,
                schedule_id: schedule.id,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5 fade-in">
            <div className="row mb-5 align-items-end">
                <div className="col-md-6 mb-3 mb-md-0">
                    <h2 className="display-6 fw-bold mb-2">Bus Services</h2>
                    <p className="text-muted mb-0">Explore schedules and track your ride</p>
                </div>
                <div className="col-md-6">
                    <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0 ps-3">
                            <Search size={18} className="text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-2"
                            placeholder="Search by company, origin, or destination..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ height: '50px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {filteredSchedules?.map(schedule => (
                    <div key={schedule.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm border-0 hover-shadow transition-all" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill font-monospace">
                                        {schedule.company_name}
                                    </span>
                                    <span className="fw-bold text-success fs-5">
                                        {schedule.price.toLocaleString()} RWF
                                    </span>
                                </div>

                                <div className="d-flex align-items-center justify-content-between mb-4 position-relative">
                                    <div className="text-start" style={{ minWidth: '80px' }}>
                                        <div className="fw-bold fs-5">{schedule.origin}</div>
                                        <div className="text-muted small">
                                            {new Date(schedule.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div className="flex-grow-1 text-center px-2 position-relative d-flex align-items-center justify-content-center">
                                        <div className="border-top border-2 w-100 position-absolute" style={{ zIndex: 0, borderStyle: 'dashed' }}></div>
                                        <div className="bg-white p-1 position-relative" style={{ zIndex: 1 }}>
                                            <Bus size={20} className="text-muted" />
                                        </div>
                                    </div>

                                    <div className="text-end" style={{ minWidth: '80px' }}>
                                        <div className="fw-bold fs-5">{schedule.destination}</div>
                                        <div className="text-muted small">
                                            {new Date(schedule.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center bg-light rounded p-3 mb-4">
                                    <div className="d-flex align-items-center gap-2">
                                        <Bus size={16} className="text-muted" />
                                        <span className="small fw-medium text-dark">{schedule.bus_plate_number}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Calendar size={16} className="text-muted" />
                                        <span className="small fw-medium text-dark">
                                            {new Date(schedule.departure_time).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-medium"
                                        onClick={() => handleViewLocation(schedule)}
                                    >
                                        <MapPin size={18} />
                                        Track
                                    </button>
                                    <button
                                        className="btn btn-dark flex-grow-1 fw-medium"
                                        onClick={() => handleBook(schedule)}
                                        disabled={bookTicketMutation.isPending || schedule.available_seats <= 0 || (schedule.status && schedule.status !== 'Scheduled' && schedule.status !== 'Boarding')}
                                    >
                                        {bookTicketMutation.isPending && selectedSchedule?.id === schedule.id ? 'Booking...'
                                            : schedule.available_seats <= 0 ? 'Full'
                                                : (schedule.status && schedule.status !== 'Scheduled' && schedule.status !== 'Boarding') ? (schedule.status === 'In_Transit' ? 'Departed' : schedule.status)
                                                    : 'Book'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSchedules?.length === 0 && (
                    <div className="col-12 text-center py-5">
                        <div className="mb-3 text-muted opacity-50">
                            <Search size={48} />
                        </div>
                        <h4 className="text-muted">No schedules found</h4>
                        <p className="text-muted small">Try adjusting your search terms</p>
                    </div>
                )}
            </div>

            {/* Map Modal */}
            <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="h5 fw-bold">
                        Locating Bus: <span className="text-primary">{selectedSchedule?.bus_plate_number}</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0 position-relative" style={{ height: '450px' }}>
                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center flex-column">
                        <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                            <MapPin size={48} className="text-danger" />
                        </div>
                        <h5 className="fw-bold text-dark mb-1">Live Tracking Unavailable</h5>
                        <p className="text-muted small max-w-md text-center px-4">
                            We are connecting to the GPS system. This is a simulated view for the bus en route from
                            <span className="fw-bold text-dark mx-1">{selectedSchedule?.origin}</span>
                            to
                            <span className="fw-bold text-dark mx-1">{selectedSchedule?.destination}</span>.
                        </p>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ServicesPage;
