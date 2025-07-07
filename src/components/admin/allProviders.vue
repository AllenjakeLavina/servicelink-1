<template>
  <div class="all-providers">
    <h2 class="page-title">All Service Providers</h2>
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
  width: 100%;
  margin: 0;
  background: #fff;
  border-radius: 0;
  box-shadow: none;
  padding: 20px 30px;
  border: none;
  min-height: calc(100vh - 80px);
}
.page-title {
  text-align: center;
  color: #4a5568;
  margin-bottom: 30px;
  font-size: 2.6rem;
  font-weight: 800;
  position: relative;
  padding-bottom: 15px;
  letter-spacing: -0.02em;
}
.page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
}
.loading {
  padding: 40px 0;
  text-align: center;
  color: #888;
}
.error {
  color: #e74c3c;
  background: #fff5f5;
  border-radius: 8px;
  padding: 18px 0;
  text-align: center;
  margin-bottom: 18px;
  font-weight: 500;
  border-left: 5px solid #e74c3c;
}
.providers-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  margin-top: 18px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(44, 62, 80, 0.06);
}
.providers-table th, .providers-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #ececec;
  text-align: left;
  font-size: 1rem;
}
.providers-table th {
  background: #f8f9fa;
  font-weight: 700;
  color: #1976d2;
  border-bottom: 2px solid #ececec;
}
.providers-table tr:last-child td {
  border-bottom: none;
}
.providers-table tr:hover {
  background: #f4f8f6;
}
@media (max-width: 900px) {
  .all-providers {
    padding: 15px;
    border-radius: 0;
  }
  .providers-table th, .providers-table td {
    padding: 10px 6px;
    font-size: 0.97rem;
  }
  .all-providers h2 {
    font-size: 1.3rem;
    margin-bottom: 18px;
  }
}
</style>
