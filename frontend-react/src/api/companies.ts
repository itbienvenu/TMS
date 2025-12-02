import api from './axios';
import type { Company, User } from '../types';

export const companiesApi = {
    // Get all companies (super admin)
    getAll: async (): Promise<Company[]> => {
        const response = await api.get('/companies/');
        return response.data;
    },

    // Get company by ID
    getById: async (id: string): Promise<Company> => {
        const response = await api.get(`/companies/${id}`);
        return response.data;
    },

    // Create company
    create: async (data: {
        company_data: { name: string; email?: string; phone_number?: string; address?: string };
        admin_data: { full_name: string; email: string; phone_number: string; password: string; role_name: string };
    }): Promise<Company> => {
        const response = await api.post('/companies/create_company', data);
        return response.data;
    },

    // Delete company
    delete: async (id: string): Promise<void> => {
        await api.delete(`/companies/${id}`);
    },

    // Get company users
    getUsers: async (companyId: string): Promise<User[]> => {
        const response = await api.get(`/companies/${companyId}/users`);
        return response.data;
    },

    // Create company user
    createUser: async (data: {
        full_name: string;
        email: string;
        phone_number: string;
        password: string;
        role_name: string;
        company_id?: string;
    }): Promise<void> => {
        await api.post('/companies/company-user', data);
    }
};
