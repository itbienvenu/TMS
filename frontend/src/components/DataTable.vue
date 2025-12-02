<template>
  <div class="card shadow-sm">
    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
      <h5 class="mb-0 fw-bold">{{ title }}</h5>
      <slot name="actions"></slot>
    </div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="bg-light">
            <tr>
              <th v-for="col in columns" :key="col.key" scope="col" class="border-0 py-3 px-4 text-secondary text-uppercase small fw-bold">
                {{ col.label }}
              </th>
              <th v-if="hasActions" scope="col" class="border-0 py-3 px-4 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="columns.length + (hasActions ? 1 : 0)" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td :colspan="columns.length + (hasActions ? 1 : 0)" class="text-center py-5 text-muted">
                No data available
              </td>
            </tr>
            <tr v-else v-for="item in items" :key="item.id">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3">
                <slot :name="`cell-${col.key}`" :item="item">
                  {{ item[col.key] }}
                </slot>
              </td>
              <td v-if="hasActions" class="px-4 py-3 text-end">
                <slot name="actions-cell" :item="item"></slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  columns: { key: string; label: string }[];
  items: any[];
  loading?: boolean;
  hasActions?: boolean;
}>();
</script>
