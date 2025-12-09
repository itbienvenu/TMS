import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../api/routes';
import { Route as RouteIcon, Loader, MapPin } from 'lucide-react';

const RoutesPage = () => {
    const { data: routes, isLoading } = useQuery({
        queryKey: ['routes'],
        queryFn: routesApi.getAll,
    });

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loader className="spinner" size={48} />
                <p>Loading routes...</p>
            </div>
        );
    }

    return (
        <div className="container py-4 fade-in">
            <div className="mb-5">
                <h1 className="h2 fw-bold text-dark mb-1">Routes</h1>
                <p className="text-muted">View all available routes</p>
            </div>

            {routes && routes.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {routes.map((route) => (
                        <div key={route.id} className="card shadow-sm border-0 p-4">
                            <div className="d-flex align-items-center">
                                <div className="p-3 rounded-circle bg-light border me-4">
                                    <RouteIcon size={32} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="h5 fw-bold mb-2 d-flex align-items-center gap-2">
                                        <MapPin size={20} className="text-secondary" />
                                        {route.origin || 'Unknown'} → {route.destination || 'Unknown'}
                                    </h3>
                                    <div className="small text-muted mb-1">
                                        Route ID: {route.id?.slice(0, 8)}
                                    </div>
                                    {route.created_at && (
                                        <div className="small text-muted">
                                            Created: {new Date(route.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card shadow-sm border-0 p-5 text-center">
                    <div className="mb-3 text-muted opacity-50">
                        <RouteIcon size={64} />
                    </div>
                    <h3 className="h5 fw-bold text-dark">No routes available</h3>
                    <p className="text-muted">There are no routes configured yet</p>
                </div>
            )}
        </div>
    );
};

export default RoutesPage;
