<template>
  <div class="unverified-providers">
    <h2>Providers Awaiting Verification</h2>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="providers.length === 0">No providers awaiting verification</div>
      <div v-for="provider in providers" :key="provider.id" class="provider-card">
        <div class="provider-info">
          <h3>{{ provider.user.firstName }} {{ provider.user.lastName }}</h3>
          <p>Email: {{ provider.user.email }}</p>
          <p>Phone: {{ provider.user.phone || 'Not provided' }}</p>
          <p>ID Documents: {{ provider.documents && provider.documents.length > 0 ? provider.documents.length + ' document(s)' : 'No documents uploaded' }}</p>
        </div>
        <div class="provider-actions">
          <button @click="verifyProvider(provider.id)" :disabled="actionLoading === provider.id">Verify Provider</button>
          <button @click="rejectProvider(provider.id)" :disabled="actionLoading === provider.id">Reject</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_BASE_URL = 'http://localhost:5500/api';
const providers = ref([]);
const loading = ref(true);
const error = ref('');
const actionLoading = ref('');

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
    const res = await fetch(`${API_BASE_URL}/admin/providers/unverified`, {
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

const verifyProvider = async (id) => {
  if (!confirm('Are you sure you want to verify this provider?')) return;
  actionLoading.value = id;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/providers/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ providerId: id })
    });
    const data = await res.json();
    if (data.success) {
      providers.value = providers.value.filter(p => p.id !== id);
      alert('Provider verified successfully');
    } else {
      alert(data.message || 'Failed to verify provider');
    }
  } catch (e) {
    alert('Failed to verify provider');
  } finally {
    actionLoading.value = '';
  }
};

const rejectProvider = async (id) => {
  const reason = prompt('Please provide a reason for rejection:');
  if (!reason) return;
  actionLoading.value = id;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/providers/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ providerId: id, reason })
    });
    const data = await res.json();
    if (data.success) {
      providers.value = providers.value.filter(p => p.id !== id);
      alert('Provider rejection sent successfully');
    } else {
      alert(data.message || 'Failed to reject provider');
    }
  } catch (e) {
    alert('Failed to reject provider');
  } finally {
    actionLoading.value = '';
  }
};

onMounted(fetchProviders);
</script>

<style scoped>
.unverified-providers {
  max-width: 800px;
  margin: 0 auto;
}
.loading {
  padding: 20px;
}
.error {
  color: red;
  padding: 20px;
}
.provider-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  background: #fff;
}
.provider-info {
  flex: 1;
}
.provider-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
