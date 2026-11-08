import { defineStore } from 'pinia';
import { ref } from 'vue';

import { listSuppliers } from '@/services/supplierService';
import type { Supplier, SupplierFilters } from '@/types';

export const useSupplierStore = defineStore('suppliers', () => {
  const suppliers = ref<Supplier[]>([]);
  const loading = ref(false);
  const error = ref('');
  let latestRequest = 0;

  async function load(filters: Partial<SupplierFilters> = {}): Promise<void> {
    const requestId = ++latestRequest;
    loading.value = true;
    error.value = '';
    try {
      const results = await listSuppliers(filters);
      if (requestId === latestRequest) suppliers.value = results;
    } catch (cause) {
      if (requestId === latestRequest)
        error.value = cause instanceof Error ? cause.message : 'Unable to load suppliers.';
      throw cause;
    } finally {
      if (requestId === latestRequest) loading.value = false;
    }
  }

  return { suppliers, loading, error, load };
});
