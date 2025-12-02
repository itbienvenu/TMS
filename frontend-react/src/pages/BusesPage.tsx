import { useQuery } from '@tanstack/react-query';
import { busesApi } from '../api/buses';
import { Bus as BusIcon, Loader } from 'lucide-react';
import '../pages/DashboardPage.css';

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
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Available Buses</h1>
                <p className="page-subtitle">Browse all available buses</p>
            </div>

            {buses && buses.length > 0 ? (
                <div className="buses-grid">
                    {buses.map((bus) => (
                        <div key={bus.id} className="bus-card card">
                            <div className="bus-icon">
                                <BusIcon size={32} />
                            </div>
                            <div className="bus-info">
                                <div className="bus-plate">{bus.plate_number}</div>
                                <div className="bus-company">{bus.company?.name || 'Unknown Company'}</div>
                                <div className="bus-seats">
                                    <strong>{bus.available_seats}</strong> / {bus.capacity} seats available
                                </div>
                                <div style={{ marginTop: 'var(--spacing-md)' }}>
                                    <span className={`badge ${bus.available_seats > 0 ? 'badge-success' : 'badge-error'}`}>
                                        {bus.available_seats > 0 ? 'Available' : 'Full'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <BusIcon size={64} />
                    <h3>No buses available</h3>
                    <p>There are no buses in the system yet</p>
                </div>
            )}
        </div>
    );
};

export default BusesPage;
