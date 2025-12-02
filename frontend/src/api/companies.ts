import api from '../utils/axios';
import type { CompanyCreate } from '../types';

export default {
    getAll() {
        return api.get('/companies/');
    },
    get(id: string) {
        return api.get(`/companies/${id}`);
    },
    create(data: any) { // Body_create_new_company_with_admin...
        return api.post('/companies/create_company', data);
    },
    delete(id: string) {
        return api.delete(`/companies/${id}`);
    },
    getUsers(companyId: string) {
        return api.get(`/companies/${companyId}/users`);
    },
    createUser(data: any) {
        return api.post('/companies/company-user', data);
    }
};
