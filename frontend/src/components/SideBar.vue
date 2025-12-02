<template>
  <div class="bg-dark text-white d-flex flex-column p-3" style="width: 250px; min-width: 250px;">
    <div class="mb-4 px-2">
      <h4 class="fw-bold">Ticketing App</h4>
    </div>
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item mb-1">
        <router-link to="/dashboard" class="nav-link text-white" active-class="active">
          <i class="bi bi-speedometer2 me-2"></i> Dashboard
        </router-link>
      </li>
      
      <!-- Super Admin Links -->
      <template v-if="authStore.isSuperAdmin">
        <li class="nav-item mb-1">
          <router-link to="/dashboard/companies" class="nav-link text-white" active-class="active">
            <i class="bi bi-building me-2"></i> Companies
          </router-link>
        </li>
        <li class="nav-item mb-1">
          <router-link to="/dashboard/stations" class="nav-link text-white" active-class="active">
            <i class="bi bi-geo-alt me-2"></i> Stations
          </router-link>
        </li>
      </template>

      <!-- Company Admin Links -->
      <template v-if="authStore.isCompanyAdmin">
        <li class="nav-item mb-1">
          <router-link to="/dashboard/buses" class="nav-link text-white" active-class="active">
            <i class="bi bi-bus-front me-2"></i> Buses
          </router-link>
        </li>
        <li class="nav-item mb-1">
          <router-link to="/dashboard/routes" class="nav-link text-white" active-class="active">
            <i class="bi bi-map me-2"></i> Routes
          </router-link>
        </li>
        <li class="nav-item mb-1">
          <router-link to="/dashboard/company/tickets" class="nav-link text-white" active-class="active">
            <i class="bi bi-ticket-perforated me-2"></i> Tickets
          </router-link>
        </li>
      </template>

      <!-- User Links -->
      <template v-if="authStore.isUser">
        <li class="nav-item mb-1">
          <router-link to="/dashboard/tickets/new" class="nav-link text-white" active-class="active">
            <i class="bi bi-search me-2"></i> Book Ticket
          </router-link>
        </li>
        <li class="nav-item mb-1">
          <router-link to="/dashboard/tickets/my" class="nav-link text-white" active-class="active">
            <i class="bi bi-ticket-detailed me-2"></i> My Tickets
          </router-link>
        </li>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
const authStore = useAuthStore();
</script>

<style scoped>
.nav-link.active {
  background-color: var(--bs-primary);
}
</style>
