import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Bus as BusIcon, AlertCircle } from 'lucide-react';

interface Trip {
    schedule_id: string;
    company_name: string;
    origin_station: string;
    destination_station: string;
    departure_time: string;
    arrival_time: string;
    price: number;
    available_seats: number;
    bus_plate: string;
    route_id: string;
}

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const originId = searchParams.get('origin');
    const destinationId = searchParams.get('destination');
    const date = searchParams.get('date');

    useEffect(() => {
        const fetchTrips = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get(`/search/trips`, {
                    params: {
                        origin_id: originId,
                        destination_id: destinationId,
                        travel_date: date,
                    },
                });
                setTrips(res.data);
            } catch (err) {
                console.error("Failed to fetch trips", err);
                setError('Failed to load trips. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (originId && destinationId) {
            fetchTrips();
        }
    }, [originId, destinationId, date]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start: string, end: string) => {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const handleBook = (trip: Trip) => {
        // Navigate to booking page (to be implemented)
        // For now, let's just log it or show an alert if not logged in
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: `/book/${trip.schedule_id}` } });
        } else {
            navigate(`/book/${trip.schedule_id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Search Results
                    </h2>
                    <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                        {date} • {trips.length} Buses Found
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                ) : trips.length === 0 ? (
                    <div className="bg-white p-10 rounded-lg shadow-sm text-center">
                        <BusIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-800 mb-2">No buses found</h3>
                        <p className="text-gray-500">Try changing your search criteria or date.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Go back to search
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map((trip) => (
                            <div key={trip.schedule_id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border border-gray-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                    {/* Company Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{trip.company_name}</h3>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <BusIcon className="h-4 w-4" />
                                            {trip.bus_plate} • {trip.available_seats} seats left
                                        </div>
                                    </div>

                                    {/* Journey Info */}
                                    <div className="flex-2 flex items-center gap-8 text-center">
                                        <div>
                                            <div className="text-xl font-bold text-gray-800">{formatTime(trip.departure_time)}</div>
                                            <div className="text-xs text-gray-500">{trip.origin_station}</div>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <div className="text-xs text-gray-400 mb-1">{calculateDuration(trip.departure_time, trip.arrival_time)}</div>
                                            <div className="w-24 h-px bg-gray-300 relative">
                                                <div className="absolute -top-1.5 right-0 w-3 h-3 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xl font-bold text-gray-800">{formatTime(trip.arrival_time)}</div>
                                            <div className="text-xs text-gray-500">{trip.destination_station}</div>
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="flex-1 flex flex-col items-end gap-2">
                                        <div className="text-2xl font-bold text-blue-600">
                                            KES {trip.price.toLocaleString()}
                                        </div>
                                        <button
                                            onClick={() => handleBook(trip)}
                                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md transition"
                                        >
                                            Select Seat
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
