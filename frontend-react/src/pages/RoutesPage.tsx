import { useQuery } from '@tanstack/react-query';
import { routesApi } from '../api/routes';
import { Route as RouteIcon, Loader, MapPin } from 'lucide-react';
import '../pages/DashboardPage.css';

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
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Routes</h1>
                <p className="page-subtitle">View all available routes</p>
            </div>

            {routes && routes.length > 0 ? (
                <div className="tickets-list">
                    {routes.map((route) => (
                        <div key={route.id} className="card" style={{ padding: 'var(--spacing-xl)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--secondary-100) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--primary-600)',
                                    flexShrink: 0
                                }}>
                                    <RouteIcon size={32} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <MapPin size={20} />
                                        {route.origin || 'Unknown'} → {route.destination || 'Unknown'}
                                    </h3>
                                    <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                        Route ID: {route.id?.slice(0, 8)}
                                    </div>
                                    {route.created_at && (
                                        <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                                            Created: {new Date(route.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <RouteIcon size={64} />
                    <h3>No routes available</h3>
                    <p>There are no routes configured yet</p>
                </div>
            )}
        </div>
    );
};

export default RoutesPage;
