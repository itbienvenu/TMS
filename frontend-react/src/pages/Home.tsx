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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Hero Section */}
            <div className="bg-blue-600 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Travel Across the Country with Ease
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 opacity-90">
                        Book bus tickets instantly from the best operators.
                    </p>

                    {/* Search Widget */}
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto text-gray-800">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">From</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
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

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">To</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Destination</option>
                                        {stations.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
                                >
                                    <Search className="h-5 w-5" />
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
                    <p className="text-gray-600">Book your tickets in seconds and get instant confirmation via SMS and Email.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🛡️</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                    <p className="text-gray-600">We support all major payment methods including Mobile Money and Cards.</p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🚌</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Top Operators</h3>
                    <p className="text-gray-600">Choose from a wide range of verified bus operators for a comfortable journey.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
