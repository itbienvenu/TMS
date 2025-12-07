import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Search, MapPin, Calendar } from 'lucide-react';

interface Station {
    id: string;
    name: string;
    location: string;
}

const Home = () => {
    const navigate = useNavigate();
    const [stations, setStations] = useState<Station[]>([]);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const res = await api.get('/search/stations');
                setStations(res.data);
            } catch (err) {
                console.error("Failed to fetch stations", err);
            }
        };
        fetchStations();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (origin && destination && date) {
            navigate(`/search?origin=${origin}&destination=${destination}&date=${date}`);
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            {/* Hero Section */}
            <div className="bg-primary text-white py-5">
                <div className="container text-center">
                    <h1 className="display-4 fw-bold mb-4">
                        Travel Across the Country with Ease
                    </h1>
                    <p className="lead mb-5 opacity-75">
                        Book bus tickets instantly from the best operators.
                    </p>

                    {/* Search Widget */}
                    <div className="bg-white p-4 p-md-5 rounded shadow text-dark mx-auto" style={{ maxWidth: '800px' }}>
                        <form onSubmit={handleSearch} className="row g-3 align-items-end">
                            <div className="col-md-3 text-start">
                                <label className="form-label fw-bold small text-muted">From</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <MapPin className="text-secondary" size={18} />
                                    </span>
                                    <select
                                        className="form-select border-start-0 ps-0"
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Origin</option>
                                        {stations.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-3 text-start">
                                <label className="form-label fw-bold small text-muted">To</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <MapPin className="text-secondary" size={18} />
                                    </span>
                                    <select
                                        className="form-select border-start-0 ps-0"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        required
                                    >
                                        <option value="">Destination</option>
                                        {stations.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-3 text-start">
                                <label className="form-label fw-bold small text-muted">Date</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <Calendar className="text-secondary" size={18} />
                                    </span>
                                    <input
                                        type="date"
                                        className="form-control border-start-0 ps-0"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="col-md-3">
                                <button
                                    type="submit"
                                    className="btn btn-warning text-white w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                                >
                                    <Search size={20} />
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="container py-5">
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card h-100 text-center p-4 border-0 shadow-sm">
                            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle" style={{ width: '64px', height: '64px' }}>
                                <span className="fs-3">⚡</span>
                            </div>
                            <h3 className="h5 fw-bold mb-2">Instant Booking</h3>
                            <p className="text-muted mb-0">Book your tickets in seconds and get instant confirmation via SMS and Email.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 text-center p-4 border-0 shadow-sm">
                            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle" style={{ width: '64px', height: '64px' }}>
                                <span className="fs-3">🛡️</span>
                            </div>
                            <h3 className="h5 fw-bold mb-2">Secure Payments</h3>
                            <p className="text-muted mb-0">We support all major payment methods including Mobile Money and Cards.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 text-center p-4 border-0 shadow-sm">
                            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle" style={{ width: '64px', height: '64px' }}>
                                <span className="fs-3">🚌</span>
                            </div>
                            <h3 className="h5 fw-bold mb-2">Top Operators</h3>
                            <p className="text-muted mb-0">Choose from a wide range of verified bus operators for a comfortable journey.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
