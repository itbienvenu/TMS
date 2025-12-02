import { useQuery } from '@tanstack/react-query';
import { stationsApi } from '../api/stations';
import { MapPin, Loader } from 'lucide-react';
import '../pages/DashboardPage.css';

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
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Bus Stations</h1>
                <p className="page-subtitle">View all bus stations</p>
            </div>

            {stations && stations.length > 0 ? (
                <div className="buses-grid">
                    {stations.map((station) => (
                        <div key={station.id} className="bus-card card">
                            <div className="bus-icon">
                                <MapPin size={32} />
                            </div>
                            <div className="bus-info">
                                <div className="bus-plate">{station.name}</div>
                                {station.location && (
                                    <div className="bus-company">{station.location}</div>
                                )}
                                <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                    Created: {new Date(station.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <MapPin size={64} />
                    <h3>No stations found</h3>
                    <p>There are no bus stations configured yet</p>
                </div>
            )}
        </div>
    );
};

export default StationsPage;
