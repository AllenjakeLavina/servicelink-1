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
          <button @click="openProfileModal(provider)">View Profile</button>
          <button @click="verifyProvider(provider.id)" :disabled="actionLoading === provider.id">Verify Provider</button>
          <button @click="rejectProvider(provider.id)" :disabled="actionLoading === provider.id">Reject</button>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal">&times;</button>
        <div v-if="selectedProvider">
          <h3>{{ selectedProvider.user.firstName }} {{ selectedProvider.user.lastName }}</h3>
          <p>Email: {{ selectedProvider.user.email }}</p>
          <p>Phone: {{ selectedProvider.user.phone || 'Not provided' }}</p>
          <h4>Documents</h4>
          <div v-if="uniqueDocs.length">
            <div v-for="doc in uniqueDocs" :key="doc.id" style="margin-bottom: 12px;">
              <template v-if="isImage(doc.fileUrl)">
                <img :src="getFileUrl(doc.fileUrl)" :alt="doc.title || 'Document'" style="max-width: 220px; max-height: 180px; display: block; margin-bottom: 4px;" @error="onImgError" />
                <div>{{ doc.title || doc.fileUrl }}</div>
              </template>
              <template v-else>
                <a :href="getFileUrl(doc.fileUrl)" target="_blank">{{ doc.title || doc.fileUrl }}</a>
              </template>
            </div>
          </div>
          <div v-else>No documents uploaded</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const API_BASE_URL = 'http://localhost:5500/api';
const FILE_SERVER_URL = 'http://localhost:5500';
const providers = ref([]);
const loading = ref(true);
const error = ref('');
const actionLoading = ref('');

const showModal = ref(false);
const selectedProvider = ref(null);

// Filter unique documents by id
const uniqueDocs = computed(() =>
  selectedProvider.value?.documents
    ? Array.from(new Map(selectedProvider.value.documents.map(doc => [doc.id, doc])).values())
    : []
);

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

function isImage(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return FILE_SERVER_URL + path;
}

function onImgError(e) {
  e.target.style.display = 'none';
}

function openProfileModal(provider) {
  selectedProvider.value = provider;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedProvider.value = null;
}

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: linear-gradient(135deg, #e0f7fa 0%, #f1f8e9 100%);
  padding: 40px 0 60px 0;
  border-radius: 0;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-top: 70px; /* Fix navbar overlap, adjust as needed */
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
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 10px;
  padding: 32px 40px;
  min-width: 340px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(33,150,243,0.18);
  position: relative;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 18px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
}
</style>
