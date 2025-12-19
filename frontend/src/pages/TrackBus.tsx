import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
// import api from '../api/axios'; // Unused for now

// Fix for default marker icon in React-Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Traffic Status
const createBusIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const Icons = {
    green: createBusIcon('green'),
    orange: createBusIcon('orange'),
    red: createBusIcon('red'),
    default: DefaultIcon
};

interface BusLocation {
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
    traffic_status?: 'green' | 'orange' | 'red';
    heading?: number;
    next_stop_name?: string;
}

// Helper to smooth pan the map
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 1.5 });
    }, [lat, lng, map]);
    return null;
};

const TrackBus: React.FC = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const [location, setLocation] = useState<BusLocation | null>(null);
    const [busId, setBusId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Initializing...');
    const ws = useRef<WebSocket | null>(null);

    // Mock bus/driver info (In real app, fetch from API)
    const driverInfo = {
        name: "John Doe",
        rating: 4.8,
        busPlate: "RAA 123B",
        photo: "https://randomuser.me/api/portraits/men/32.jpg"
    };

    useEffect(() => {
        // In a real app, we would fetch the Bus ID associated with the Ticket ID here.
        // For MVP/Demo, we assume a fixed test bus or derived ID.
        setBusId('test-bus-1');
        setStatus('Connecting to satellite...');
    }, [ticketId]);

    useEffect(() => {
        if (!busId) return;

        // Use Env var or default to the known IP
        const wsBase = import.meta.env.VITE_WS_URL || 'ws://3.12.248.83:8009';
        const wsUrl = `${wsBase}/ws/tracking/${busId}`;

        console.log(`Connecting to ${wsUrl}`);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            setStatus('Live Connected');
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.latitude && data.longitude) {
                    setLocation(prev => ({ ...prev, ...data }));
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.current.onclose = () => {
            setStatus('Connection Signal Lost');
        };

        ws.current.onerror = (err) => {
            console.error("WS Error", err);
            setStatus('Connection Error');
        };

        return () => {
            ws.current?.close();
        };
    }, [busId]);

    if (!location) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="mt-3 text-muted">{status}</h4>
                <p className="text-secondary small">Waiting for bus signal...</p>
            </div>
        );
    }

    const trafficColor = location.traffic_status || 'green';
    const statusText = trafficColor === 'red' ? 'Heavy Traffic' : trafficColor === 'orange' ? 'Moderate Traffic' : 'Moving Freely';

    return (
        <div className="position-relative" style={{ height: 'calc(100vh - 60px)', width: '100%' }}>
            {/* Map Background */}
            <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={15}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false}
            >
                {/* Dark Mode / Premium Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <RecenterMap lat={location.latitude} lng={location.longitude} />

                <Marker
                    position={[location.latitude, location.longitude]}
                    icon={Icons[trafficColor as keyof typeof Icons] || Icons.default}
                >
                    <Popup>
                        <strong>Bus {driverInfo.busPlate}</strong><br />
                        Speed: {Math.round((location.speed || 0) * 3.6)} km/h
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Premium Overlay Card */}
            <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-white border-top shadow-lg"
                style={{ zIndex: 1000, borderTopLeftRadius: '20px', borderTopRightRadius: '20px', transition: 'transform 0.3s ease-in-out' }}>
                <div className="container">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <div>
                            <span className={`badge bg-${trafficColor === 'green' ? 'success' : trafficColor === 'red' ? 'danger' : 'warning'} mb-1`}>
                                {statusText}
                            </span>
                            <h5 className="mb-0 fw-bold">Arriving in ~12 mins</h5>
                        </div>
                        <div className="text-end">
                            <h3 className="mb-0 fw-bold text-primary">{Math.round((location.speed || 0) * 3.6)} <small className="fs-6 text-muted">km/h</small></h3>
                        </div>
                    </div>

                    <hr className="my-2" />

                    <div className="d-flex align-items-center mt-3">
                        <img
                            src={driverInfo.photo}
                            alt="Driver"
                            className="rounded-circle border border-2 border-white shadow-sm"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <div className="ms-3 flex-grow-1">
                            <h6 className="mb-0 fw-bold">{driverInfo.name}</h6>
                            <small className="text-muted">{driverInfo.busPlate} • ⭐ {driverInfo.rating}</small>
                        </div>
                        <button className="btn btn-outline-primary rounded-circle p-2">
                            <i className="bi bi-telephone-fill"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Status Bar */}
            <div className="position-absolute top-0 start-0 end-0 p-3" style={{ zIndex: 1000, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}>
                <div className="d-flex justify-content-between text-white">
                    <span className="fw-bold"><i className="bi bi-geo-alt-fill me-1"></i> Live Tracking</span>
                    <span className="badge bg-light text-dark shadow-sm">Updated Just Now</span>
                </div>
            </div>
        </div>
    );
};

export default TrackBus;

