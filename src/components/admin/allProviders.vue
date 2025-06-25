<template>
  <div class="all-providers">
    <h2>All Service Providers</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="providers.length === 0">No providers found</div>
      <table v-else class="providers-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Services</th>
            <th>Skills</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="provider in providers" :key="provider.id">
            <td>{{ provider.user.firstName }} {{ provider.user.lastName }}</td>
            <td>{{ provider.user.email }}</td>
            <td>{{ provider.user.phone || 'Not provided' }}</td>
            <td>{{ provider.isProviderVerified ? 'Verified' : 'Pending Verification' }}</td>
            <td>{{ provider.services ? provider.services.length : 0 }} service(s)</td>
            <td>{{ provider.skills && provider.skills.length ? provider.skills.map(s => s.name).join(', ') : 'No skills listed' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_BASE_URL = 'http://localhost:5500/api';
const providers = ref([]);
const loading = ref(true);
const error = ref('');

const fetchProviders = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      error.value = 'Not authenticated';
      loading.value = false;
      return;
    }
    const res = await fetch(`${API_BASE_URL}/admin/providers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      providers.value = data.data;
    } else {
      error.value = data.message || 'Failed to load providers';
    }
  } catch (e) {
    error.value = 'Failed to load providers';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProviders);
</script>

<style scoped>
.all-providers {
  max-width: 1000px;
  margin: 0 auto;
}
.loading {
  padding: 20px;
}
.error {
  color: red;
  padding: 20px;
}
.providers-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin-top: 20px;
}
.providers-table th, .providers-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.providers-table th {
  background: #f5f5f5;
}
</style>
