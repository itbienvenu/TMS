import { useQuery } from '@tanstack/react-query';
import { stationsApi } from '../api/stations';
import { MapPin, Loader } from 'lucide-react';

const StationsPage = () => {
    const { data: stations, isLoading } = useQuery({
        queryKey: ['stations'],
        queryFn: stationsApi.getAll,
    });

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading stations...</p>
            </div>
        );
    }

    return (
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">Bus Stations</h1>
                <p className="text-muted">View all bus stations</p>
            </div>

            {stations && stations.length > 0 ? (
                <div className="row g-4">
                    {stations.map((station) => (
                        <div key={station.id} className="col-md-6 col-lg-4">
                            <div className="card shadow-sm border-0 h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex justify-content-center mb-3">
                                        <div className="p-3 rounded-circle bg-light border">
                                            <MapPin size={32} className="text-primary" />
                                        </div>
                                    </div>
                                    <h5 className="card-title fw-bold mb-1">{station.name}</h5>
                                    {station.location && (
                                        <p className="card-text text-muted mb-3">{station.location}</p>
                                    )}
                                    <div className="small text-muted">
                                        Created: {new Date(station.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-3 text-muted opacity-50">
                        <MapPin size={64} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">No stations found</h3>
                    <p className="text-muted">There are no bus stations configured yet</p>
                </div>
            )}
        </div>
    );
};

export default StationsPage;
