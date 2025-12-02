import api from '../utils/axios';
import type { ScheduleCreate } from '../types';

export default {
    create(data: ScheduleCreate) {
        return api.post('/schedules/', data);
    }
};
