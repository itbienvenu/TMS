import { useQuery } from '@tanstack/react-query';
import { busesApi } from '../api/buses';
import { Bus as BusIcon, Loader } from 'lucide-react';

const BusesPage = () => {
    const { data: buses, isLoading } = useQuery({
        queryKey: ['buses-public'],
        queryFn: busesApi.getAllPublic,
    });

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading buses...</p>
            </div>
        );
    }

    return (
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">Available Buses</h1>
                <p className="text-muted">Browse all available buses</p>
            </div>

            {buses && buses.length > 0 ? (
                <div className="row g-4">
                    {buses.map((bus) => (
                        <div key={bus.id} className="col-md-6 col-lg-4">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="p-3 rounded-circle bg-light border">
                                            <BusIcon size={32} className="text-primary" />
                                        </div>
                                    </div>
                                    <h5 className="card-title fw-bold mb-1">{bus.plate_number}</h5>
                                    <p className="card-text text-muted mb-3">{bus.company?.name || 'Unknown Company'}</p>
                                    <div className="mb-3">
                                        <span className="fw-bold text-dark">{bus.available_seats}</span>
                                        <span className="text-muted"> / {bus.capacity} seats available</span>
                                    </div>
                                    <div>
                                        <span className={`badge rounded-pill bg-${bus.available_seats > 0 ? 'success' : 'danger'}`}>
                                            {bus.available_seats > 0 ? 'Available' : 'Full'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-3 text-muted opacity-50">
                        <BusIcon size={64} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">No buses available</h3>
                    <p className="text-muted">There are no buses in the system yet</p>
                </div>
            )}
        </div>
    );
};

export default BusesPage;
