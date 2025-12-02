<template>
  <div class="d-flex vh-100">
    <SideBar />
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <NavBar />
      <main class="flex-grow-1 overflow-auto p-4 bg-light">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavBar from '../components/NavBar.vue';
import SideBar from '../components/SideBar.vue';
</script>
