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
            <th>Action</th>
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
            <td>
              <button class="view-profile-btn" @click="openProfileModal(provider.id)">View Profile</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <!-- Provider Profile Modal -->
  <div v-if="showProfileModal" class="profile-modal-overlay">
    <div class="profile-modal-container">
      <button class="close-modal-btn" @click="closeProfileModal">&times;</button>
      <div v-if="profileLoading" class="modal-loading">Loading profile...</div>
      <div v-else-if="profileError" class="modal-error">{{ profileError }}</div>
      <div v-else-if="selectedProviderProfile" class="modal-profile-content">
        <div class="modal-profile-top">
          <div class="modal-profile-avatar">
            <img v-if="selectedProviderProfile.profilePicture" :src="selectedProviderProfile.profilePicture" alt="Profile Picture" />
            <div v-else class="modal-placeholder-img"><i class="fas fa-user"></i></div>
          </div>
          <div class="modal-profile-name-email">
            <h2>{{ selectedProviderProfile.firstName }} {{ selectedProviderProfile.lastName }}</h2>
            <div class="modal-profile-email">{{ selectedProviderProfile.email }}</div>
          </div>
        </div>
        <div class="modal-section-card">
          <h3><i class="fas fa-id-card"></i> Personal Information</h3>
          <div class="modal-profile-details-grid">
            <div><span class="modal-label">Phone:</span> {{ selectedProviderProfile.phone || 'Not provided' }}</div>
            <div><span class="modal-label">Headline:</span> {{ selectedProviderProfile.headline || '—' }}</div>
            <div><span class="modal-label">Hourly Rate:</span> ${{ selectedProviderProfile.hourlyRate || 0 }}/hr</div>
            <div class="modal-bio"><span class="modal-label">Bio:</span> {{ selectedProviderProfile.bio || '—' }}</div>
          </div>
        </div>
        <div class="modal-section-card">
          <h3><i class="fas fa-briefcase"></i> Work Experience</h3>
          <div v-if="selectedProviderProfile.workExperience?.length">
            <div v-for="exp in selectedProviderProfile.workExperience" :key="exp.id" class="modal-exp-item">
              <div class="modal-exp-title">{{ exp.position }} <span class="at-company">@ {{ exp.company }}</span></div>
              <div class="modal-exp-dates">{{ exp.startDate }} - {{ exp.isCurrentPosition ? 'Present' : exp.endDate }}</div>
              <div class="modal-exp-desc">{{ exp.description }}</div>
            </div>
          </div>
          <div v-else class="modal-no-data">No work experience listed.</div>
        </div>
        <div class="modal-section-card">
          <h3><i class="fas fa-graduation-cap"></i> Education</h3>
          <div v-if="selectedProviderProfile.education?.length">
            <div v-for="edu in selectedProviderProfile.education" :key="edu.id" class="modal-edu-item">
              <div class="modal-edu-title">{{ edu.degree }} <span v-if="edu.fieldOfStudy">in {{ edu.fieldOfStudy }}</span></div>
              <div class="modal-edu-school">{{ edu.institution }}</div>
              <div class="modal-edu-dates">{{ edu.startDate }} - {{ edu.isCurrentlyStudying ? 'Present' : edu.endDate }}</div>
            </div>
          </div>
          <div v-else class="modal-no-data">No education listed.</div>
        </div>
        <div class="modal-section-card">
          <h3><i class="fas fa-tools"></i> Skills</h3>
          <div v-if="selectedProviderProfile.skills?.length" class="modal-skills-list">
            <span v-for="skill in selectedProviderProfile.skills" :key="skill.id" class="modal-skill-tag">{{ skill.name }}</span>
          </div>
          <div v-else class="modal-no-data">No skills listed.</div>
        </div>
        <div class="modal-section-card">
          <h3><i class="fas fa-folder-open"></i> Portfolio</h3>
          <div v-if="selectedProviderProfile.portfolio?.length">
            <div v-for="item in selectedProviderProfile.portfolio" :key="item.id" class="modal-portfolio-item">
              <div class="modal-portfolio-title">{{ item.title }}</div>
              <div class="modal-portfolio-desc">{{ item.description }}</div>
              <div v-if="item.projectUrl" class="modal-portfolio-link"><a :href="item.projectUrl" target="_blank">View Project</a></div>
              <div v-if="item.files && item.files.length" class="modal-portfolio-files">
                <ul>
                  <li v-for="file in item.files" :key="file.id">
                    <a :href="file.fileUrl" target="_blank">{{ file.fileUrl.split('/').pop() }}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div v-else class="modal-no-data">No portfolio items listed.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { providerService } from '../../services/apiService';

const API_BASE_URL = 'http://localhost:5500/api';
const providers = ref([]);
const loading = ref(true);
const error = ref('');

// Modal state
const showProfileModal = ref(false);
const selectedProviderProfile = ref(null);
const profileLoading = ref(false);
const profileError = ref('');

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

const openProfileModal = async (providerId) => {
  showProfileModal.value = true;
  selectedProviderProfile.value = null;
  profileLoading.value = true;
  profileError.value = '';
  try {
    const res = await providerService.getProviderDetails(providerId);
    if (res.success) {
      selectedProviderProfile.value = res.data;
    } else {
      profileError.value = res.message || 'Failed to load profile';
    }
  } catch (e) {
    profileError.value = 'Failed to load profile';
  } finally {
    profileLoading.value = false;
  }
};

const closeProfileModal = () => {
  showProfileModal.value = false;
  selectedProviderProfile.value = null;
  profileError.value = '';
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
/* Modal Styles */
.profile-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-modal-container {
  background: #fff;
  border-radius: 18px;
  max-width: 700px;
  width: 95vw;
  max-height: 92vh;
  overflow-y: auto;
  padding: 0 0 32px 0;
  position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  border: 1.5px solid #e0e0e0;
}
.close-modal-btn {
  position: absolute;
  top: 18px;
  right: 28px;
  font-size: 2.2rem;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s;
}
.close-modal-btn:hover { color: #e74c3c; }
.modal-loading, .modal-error {
  text-align: center;
  padding: 40px 0;
  color: #888;
}
.modal-error { color: #e74c3c; }
.modal-profile-content {
  padding: 0 32px;
  margin-top: 32px;
}
.modal-profile-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 18px;
}
.modal-profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  background: #e0e0e0;
  box-shadow: 0 2px 12px rgba(39,174,96,0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.modal-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.modal-placeholder-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.2rem;
  color: #aaa;
}
.modal-profile-name-email h2 {
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #222;
  text-align: center;
}
.modal-profile-email {
  color: #27ae60;
  font-size: 1.05rem;
  text-align: center;
  margin-bottom: 2px;
}
.modal-section-card {
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(39,174,96,0.04);
  padding: 22px 22px 12px 22px;
  margin-bottom: 18px;
  border: 1px solid #e0e0e0;
}
.modal-section-card h3 {
  margin: 0 0 16px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #27ae60;
  display: flex;
  align-items: center;
  gap: 10px;
}
.modal-profile-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
  margin-bottom: 8px;
}
.modal-label {
  color: #888;
  font-weight: 600;
  margin-right: 4px;
}
.modal-bio {
  grid-column: 1 / -1;
  color: #444;
  margin-top: 4px;
}
.modal-exp-item, .modal-edu-item, .modal-portfolio-item {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}
.modal-exp-item:last-child, .modal-edu-item:last-child, .modal-portfolio-item:last-child {
  border-bottom: none;
}
.modal-exp-title {
  font-weight: 700;
  color: #1976d2;
  font-size: 1.08rem;
}
.at-company {
  color: #888;
  font-weight: 500;
  font-size: 0.98rem;
}
.modal-exp-dates, .modal-edu-dates {
  color: #27ae60;
  font-size: 0.97rem;
  margin-bottom: 2px;
}
.modal-exp-desc {
  color: #444;
  font-size: 0.97rem;
}
.modal-edu-title {
  font-weight: 700;
  color: #1976d2;
  font-size: 1.08rem;
}
.modal-edu-school {
  color: #888;
  font-weight: 500;
  font-size: 0.98rem;
}
.modal-portfolio-title {
  font-weight: 700;
  color: #1976d2;
  font-size: 1.08rem;
}
.modal-portfolio-desc {
  color: #444;
  font-size: 0.97rem;
  margin-bottom: 4px;
}
.modal-portfolio-link a {
  color: #27ae60;
  font-weight: 600;
  text-decoration: underline;
  font-size: 0.98rem;
}
.modal-portfolio-files ul {
  padding-left: 18px;
  margin: 0;
}
.modal-portfolio-files a {
  color: #1976d2;
  text-decoration: underline;
  font-size: 0.97rem;
}
.modal-skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.modal-skill-tag {
  display: inline-block;
  background: #e8f5e9;
  color: #27ae60;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(39,174,96,0.07);
  border: 1px solid #b2dfdb;
}
.modal-no-data {
  color: #888;
  font-style: italic;
  margin: 8px 0;
  padding-left: 2px;
}
@media (max-width: 600px) {
  .modal-profile-content { padding: 0 6px; }
  .profile-modal-container { padding: 0 0 18px 0; }
  .modal-section-card { padding: 12px 6px 8px 6px; }
  .modal-profile-details-grid { grid-template-columns: 1fr; gap: 8px 0; }
}
</style>
