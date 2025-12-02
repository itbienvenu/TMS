import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/auth',
        component: () => import('../layouts/AuthLayout.vue'),
        children: [
            {
                path: 'login',
                name: 'Login',
                component: () => import('../views/auth/LoginView.vue'),
            },
            {
                path: 'register',
                name: 'Register',
                component: () => import('../views/auth/RegisterView.vue'),
            },
        ],
    },
    {
        path: '/dashboard',
        component: () => import('../layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('../views/DashboardView.vue'), // Will redirect or show role-specific dashboard
            },
            {
                path: 'super-admin',
                name: 'SuperAdminDashboard',
                component: () => import('../views/admin/SuperAdminDashboard.vue'),
                meta: { role: 'super_admin' },
            },
            {
                path: 'company-admin',
                name: 'CompanyAdminDashboard',
                component: () => import('../views/company/CompanyAdminDashboard.vue'),
                meta: { role: 'company_admin' },
            },
            {
                path: 'user',
                name: 'UserDashboard',
                component: () => import('../views/user/UserDashboard.vue'),
                meta: { role: 'user' },
            },
            // Companies
            {
                path: 'companies',
                name: 'CompaniesList',
                component: () => import('../views/admin/CompaniesList.vue'),
                meta: { role: 'super_admin' },
            },
            {
                path: 'companies/new',
                name: 'CompanyCreate',
                component: () => import('../views/admin/CompanyForm.vue'),
                meta: { role: 'super_admin' },
            },
            {
                path: 'companies/:id',
                name: 'CompanyDetails',
                component: () => import('../views/admin/CompanyDetails.vue'),
                meta: { role: 'super_admin' },
            },
            // Buses
            {
                path: 'buses',
                name: 'BusesList',
                component: () => import('../views/company/BusesList.vue'),
                meta: { role: 'company_admin' },
            },
            {
                path: 'buses/new',
                name: 'BusCreate',
                component: () => import('../views/company/BusForm.vue'),
                meta: { role: 'company_admin' },
            },
            // Routes
            {
                path: 'routes',
                name: 'RoutesList',
                component: () => import('../views/shared/RoutesList.vue'),
            },
            {
                path: 'routes/new',
                name: 'RouteCreate',
                component: () => import('../views/shared/RouteForm.vue'),
                meta: { role: 'company_admin' }, // Assuming only company admin creates routes? Or super admin?
            },
            // Tickets
            {
                path: 'tickets/new',
                name: 'TicketCreate',
                component: () => import('../views/user/TicketBooking.vue'),
                meta: { role: 'user' },
            },
            {
                path: 'tickets/my',
                name: 'MyTickets',
                component: () => import('../views/user/MyTickets.vue'),
                meta: { role: 'user' },
            },
            {
                path: 'company/tickets',
                name: 'CompanyTickets',
                component: () => import('../views/company/CompanyTickets.vue'),
                meta: { role: 'company_admin' },
            },
            // Stations
            {
                path: 'stations',
                name: 'StationsList',
                component: () => import('../views/admin/StationsList.vue'),
                meta: { role: 'super_admin' },
            },
            // Profile
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/ProfileView.vue'),
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/auth/login');
    } else {
        if (!authStore.user && authStore.isAuthenticated) {
            try {
                await authStore.fetchUser();
            } catch (e) {
                next('/auth/login');
                return;
            }
        }

        if (to.meta.role && authStore.user?.role !== to.meta.role) {
            // Redirect to appropriate dashboard if role doesn't match
            if (authStore.isSuperAdmin) next('/dashboard/super-admin');
            else if (authStore.isCompanyAdmin) next('/dashboard/company-admin');
            else next('/dashboard/user');
        } else {
            next();
        }
    }
});

export default router;
