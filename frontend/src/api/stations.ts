import api from '../utils/axios';
import type { StationCreate } from '../types';

export default {
    getAll() {
        return api.get('/stations/');
    },
    create(data: StationCreate) {
        return api.post('/stations/', data);
    },
    delete(id: string) {
        return api.delete(`/stations/${id}`);
    }
};
