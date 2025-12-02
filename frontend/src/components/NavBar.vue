<template>
  <nav class="navbar navbar-expand-lg navbar-white bg-white border-bottom px-4">
    <div class="container-fluid">
      <span class="navbar-brand fw-bold text-primary">Dashboard</span>
      <div class="d-flex align-items-center">
        <div class="dropdown">
          <button
            class="btn btn-link dropdown-toggle text-decoration-none text-dark"
            type="button"
            id="userDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {{ authStore.user?.full_name || 'User' }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><router-link class="dropdown-item" to="/dashboard/profile">Profile</router-link></li>
            <li><hr class="dropdown-divider" /></li>
            <li><a class="dropdown-item text-danger" href="#" @click.prevent="logout">Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const logout = () => {
  authStore.logout();
  router.push('/auth/login');
};
</script>
