<template>
  <div class="provider-services">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>My Services</h1>

      <!-- Verification Status Alert -->
      <div v-if="verificationStatus && !verificationStatus.isVerified" class="verification-alert">
        <p v-if="verificationStatus.pendingVerification">
          <strong>Your account is pending verification.</strong> You can create services, but they won't be visible to clients until your account is verified.
        </p>
        <p v-else>
          <strong>Your account is not verified.</strong> Please upload your identification documents to start the verification process.
        </p>
      </div>

      <!-- Create New Service Button -->
      <div class="action-buttons">
        <button class="primary-btn" @click="showCreateForm = true">Create New Service</button>
      </div>

      <!-- Service List -->
      <div v-if="myServices && myServices.length > 0" class="service-list">
        <div v-for="service in myServices" :key="service.id" class="service-card">
          <div class="service-header">
            <h3>{{ service.title }}</h3>
            <span :class="['status-badge', service.isActive ? 'active' : 'inactive']">
              {{ service.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <div class="service-details">
            <p><strong>Category:</strong> {{ service.category.name }}</p>
            <p><strong>Pricing:</strong> ${{ service.pricing }} / {{ formatPricingType(service.pricingType) }}</p>
            <p class="description">{{ truncateText(service.description, 150) }}</p>
            
            <div class="service-skills" v-if="service.skills && service.skills.length > 0">
              <strong>Skills:</strong>
              <div class="skills-list">
                <span v-for="skill in service.skills" :key="skill.id" class="skill-tag">{{ skill.name }}</span>
              </div>
            </div>
          </div>
          
          <div class="service-actions">
            <button class="edit-btn" @click="editService(service)">Edit</button>
            <button class="toggle-btn" @click="toggleServiceStatus(service)">
              {{ service.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-services">
        <p>You haven't created any services yet.</p>
      </div>

      <!-- Create Service Modal -->
      <div v-if="showCreateForm" class="modal">
        <div class="modal-content">
          <span class="close-btn" @click="showCreateForm = false">&times;</span>
          <h2>Create New Service</h2>
          
          <form @submit.prevent="createService" class="service-form">
            <div class="form-group">
              <label for="title">Service Title*</label>
              <input id="title" v-model="serviceForm.title" required />
            </div>
            
            <div class="form-group">
              <label for="category">Category*</label>
              <select id="category" v-model="serviceForm.categoryId" required>
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group pricing-group">
              <div class="price-input">
                <label for="pricing">Price*</label>
                <input id="pricing" type="number" v-model="serviceForm.pricing" min="0" step="0.01" required />
              </div>
              
              <div class="price-type">
                <label for="pricingType">Price Type*</label>
                <select id="pricingType" v-model="serviceForm.pricingType" required>
                  <option value="HOURLY">Per Hour</option>
                  <option value="FIXED">Fixed Price</option>
                  <option value="DAILY">Per Day</option>
                  <option value="SESSION">Per Session</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="description">Description*</label>
              <textarea id="description" v-model="serviceForm.description" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="imageUrls">Image URLs (One per line)</label>
              <textarea id="imageUrls" v-model="imageUrlsText" rows="3" placeholder="http://example.com/image1.jpg&#10;http://example.com/image2.jpg"></textarea>
              <small>Enter each image URL on a new line</small>
            </div>
            
            <div class="form-group">
              <label>Skills</label>
              <div class="skills-selection">
                <div v-if="selectedSkills.length > 0" class="selected-skills">
                  <span v-for="(skill, index) in selectedSkills" :key="index" class="selected-skill">
                    {{ skill }}
                    <button type="button" @click="removeSkill(index)" class="remove-skill">×</button>
                  </span>
                </div>
                <div class="skill-input">
                  <input v-model="skillInput" placeholder="Add a skill" @keyup.enter="addSkillToSelection" />
                  <button type="button" @click="addSkillToSelection" class="add-skill-btn">Add</button>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showCreateForm = false">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Creating...' : 'Create Service' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Service Modal -->
      <div v-if="showEditForm" class="modal">
        <div class="modal-content">
          <span class="close-btn" @click="showEditForm = false">&times;</span>
          <h2>Edit Service</h2>
          
          <form @submit.prevent="updateService" class="service-form">
            <div class="form-group">
              <label for="edit-title">Service Title*</label>
              <input id="edit-title" v-model="editServiceForm.title" required />
            </div>
            
            <div class="form-group">
              <label for="edit-category">Category*</label>
              <select id="edit-category" v-model="editServiceForm.categoryId" required>
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group pricing-group">
              <div class="price-input">
                <label for="edit-pricing">Price*</label>
                <input id="edit-pricing" type="number" v-model="editServiceForm.pricing" min="0" step="0.01" required />
              </div>
              
              <div class="price-type">
                <label for="edit-pricingType">Price Type*</label>
                <select id="edit-pricingType" v-model="editServiceForm.pricingType" required>
                  <option value="HOURLY">Per Hour</option>
                  <option value="FIXED">Fixed Price</option>
                  <option value="DAILY">Per Day</option>
                  <option value="SESSION">Per Session</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="edit-description">Description*</label>
              <textarea id="edit-description" v-model="editServiceForm.description" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="edit-imageUrls">Image URLs (One per line)</label>
              <textarea id="edit-imageUrls" v-model="editImageUrlsText" rows="3" placeholder="http://example.com/image1.jpg&#10;http://example.com/image2.jpg"></textarea>
              <small>Enter each image URL on a new line</small>
            </div>
            
            <div class="form-group">
              <label>Skills</label>
              <div class="skills-selection">
                <div v-if="editSelectedSkills.length > 0" class="selected-skills">
                  <span v-for="(skill, index) in editSelectedSkills" :key="index" class="selected-skill">
                    {{ skill }}
                    <button type="button" @click="removeEditSkill(index)" class="remove-skill">×</button>
                  </span>
                </div>
                <div class="skill-input">
                  <input v-model="editSkillInput" placeholder="Add a skill" @keyup.enter="addEditSkillToSelection" />
                  <button type="button" @click="addEditSkillToSelection" class="add-skill-btn">Add</button>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showEditForm = false">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Updating...' : 'Update Service' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { providerService } from '../../services/apiService';

export default {
  name: 'ProviderServices',
  setup() {
    // State
    const myServices = ref([]);
    const categories = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const verificationStatus = ref(null);
    const showCreateForm = ref(false);
    const showEditForm = ref(false);
    const isSubmitting = ref(false);
    const currentServiceId = ref(null);

    // Form data
    const serviceForm = reactive({
      title: '',
      description: '',
      categoryId: '',
      pricing: 0,
      pricingType: 'HOURLY',
      imageUrls: [],
      skillIds: []
    });

    const editServiceForm = reactive({
      title: '',
      description: '',
      categoryId: '',
      pricing: 0,
      pricingType: 'HOURLY',
      imageUrls: [],
      skillIds: []
    });

    // Skills handling
    const skillInput = ref('');
    const selectedSkills = ref([]);
    const editSkillInput = ref('');
    const editSelectedSkills = ref([]);

    // Computed properties for image URLs
    const imageUrlsText = computed({
      get: () => serviceForm.imageUrls.join('\n'),
      set: (val) => {
        serviceForm.imageUrls = val.split('\n').filter(url => url.trim() !== '');
      }
    });

    const editImageUrlsText = computed({
      get: () => editServiceForm.imageUrls.join('\n'),
      set: (val) => {
        editServiceForm.imageUrls = val.split('\n').filter(url => url.trim() !== '');
      }
    });

    // Fetch data
    const fetchServices = async () => {
      try {
        const response = await providerService.getProviderServices();
        if (response.success) {
          myServices.value = response.data;
        } else {
          console.warn('Could not load services:', response.message);
          myServices.value = [];
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        myServices.value = [];
        error.value = 'Could not connect to the service. Please try again later.';
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await providerService.getCategories();
        if (response.success) {
          categories.value = response.data;
        } else {
          throw new Error('Failed to load categories');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        error.value = err.message || 'Failed to load categories';
      }
    };

    const fetchVerificationStatus = async () => {
      try {
        const response = await providerService.getVerificationStatus();
        if (response.success) {
          verificationStatus.value = response.data;
        } else {
          throw new Error('Failed to load verification status');
        }
      } catch (err) {
        console.error('Error fetching verification status:', err);
      }
    };

    // Initialize data
    const initData = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        await Promise.all([
          fetchServices(),
          fetchCategories(),
          fetchVerificationStatus()
        ]);
      } catch (err) {
        error.value = 'Failed to initialize data';
      } finally {
        loading.value = false;
      }
    };

    // Form handlers
    const addSkillToSelection = () => {
      if (skillInput.value.trim()) {
        selectedSkills.value.push(skillInput.value.trim());
        skillInput.value = '';
      }
    };

    const removeSkill = (index) => {
      selectedSkills.value.splice(index, 1);
    };

    const addEditSkillToSelection = () => {
      if (editSkillInput.value.trim()) {
        editSelectedSkills.value.push(editSkillInput.value.trim());
        editSkillInput.value = '';
      }
    };

    const removeEditSkill = (index) => {
      editSelectedSkills.value.splice(index, 1);
    };

    const createService = async () => {
      try {
        isSubmitting.value = true;
        
        // Convert skills to skill IDs (simplified - in real app would match against existing skills)
        // Here we're just sending the skill names, backend will handle creating/matching skills
        
        const serviceData = {
          ...serviceForm,
          skillNames: selectedSkills.value // Backend should handle mapping these to IDs
        };
        
        const response = await providerService.createService(serviceData);
        
        if (response.success) {
          showCreateForm.value = false;
          resetServiceForm();
          await fetchServices();
        } else {
          throw new Error(response.message || 'Failed to create service');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        isSubmitting.value = false;
      }
    };

    const resetServiceForm = () => {
      serviceForm.title = '';
      serviceForm.description = '';
      serviceForm.categoryId = '';
      serviceForm.pricing = 0;
      serviceForm.pricingType = 'HOURLY';
      serviceForm.imageUrls = [];
      selectedSkills.value = [];
    };

    const editService = (service) => {
      currentServiceId.value = service.id;
      
      // Populate edit form
      editServiceForm.title = service.title;
      editServiceForm.description = service.description;
      editServiceForm.categoryId = service.categoryId;
      editServiceForm.pricing = parseFloat(service.pricing);
      editServiceForm.pricingType = service.pricingType;
      
      // Handle image URLs
      if (service.imageUrls) {
        try {
          const urls = typeof service.imageUrls === 'string' 
            ? JSON.parse(service.imageUrls) 
            : service.imageUrls;
          editServiceForm.imageUrls = Array.isArray(urls) ? urls : [];
        } catch (err) {
          editServiceForm.imageUrls = [];
        }
      } else {
        editServiceForm.imageUrls = [];
      }
      
      // Handle skills
      editSelectedSkills.value = service.skills ? service.skills.map(skill => skill.name) : [];
      
      showEditForm.value = true;
    };

    const updateService = async () => {
      try {
        isSubmitting.value = true;
        
        const serviceData = {
          title: editServiceForm.title,
          description: editServiceForm.description,
          categoryId: editServiceForm.categoryId,
          pricing: parseFloat(editServiceForm.pricing),
          pricingType: editServiceForm.pricingType,
          imageUrls: editServiceForm.imageUrls,
          skillIds: [] // In a real implementation, we'd fetch skill IDs here
        };
        
        const response = await providerService.updateProviderService(currentServiceId.value, serviceData);
        
        if (response.success) {
          showEditForm.value = false;
          await fetchServices();
        } else {
          throw new Error(response.message || 'Failed to update service');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        isSubmitting.value = false;
      }
    };

    const toggleServiceStatus = async (service) => {
      try {
        const response = await providerService.updateProviderService(service.id, {
          isActive: !service.isActive
        });
        
        if (response.success) {
          await fetchServices();
        } else {
          throw new Error(response.message || 'Failed to update service status');
        }
      } catch (err) {
        error.value = err.message;
      }
    };

    // Helper functions
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substr(0, maxLength) + '...';
    };

    const formatPricingType = (type) => {
      switch (type) {
        case 'HOURLY': return 'Hour';
        case 'FIXED': return 'Fixed Price';
        case 'DAILY': return 'Day';
        case 'SESSION': return 'Session';
        default: return type;
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      initData();
    });

    return {
      myServices,
      categories,
      loading,
      error,
      verificationStatus,
      showCreateForm,
      showEditForm,
      isSubmitting,
      serviceForm,
      editServiceForm,
      skillInput,
      selectedSkills,
      editSkillInput,
      editSelectedSkills,
      imageUrlsText,
      editImageUrlsText,
      addSkillToSelection,
      removeSkill,
      addEditSkillToSelection,
      removeEditSkill,
      createService,
      editService,
      updateService,
      toggleServiceStatus,
      truncateText,
      formatPricingType
    };
  }
};
</script>

<style scoped>
.provider-services {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.verification-alert {
  background-color: #fff3cd;
  color: #856404;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  border-left: 5px solid #ffeeba;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.primary-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.primary-btn:hover {
  background-color: #45a049;
}

.service-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.service-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background-color: #f5f5f5;
  color: #757575;
}

.service-details {
  margin-bottom: 20px;
}

.description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
}

.service-skills {
  margin-top: 10px;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.skill-tag {
  background-color: #e1f5fe;
  color: #0288d1;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 13px;
}

.service-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.edit-btn:hover {
  background-color: #0b7dda;
}

.toggle-btn {
  background-color: #f5f5f5;
  color: #757575;
}

.toggle-btn:hover {
  background-color: #e0e0e0;
}

.no-services {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-style: italic;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  float: right;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.close-btn:hover {
  color: #999;
}

.service-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.pricing-group {
  display: flex;
  gap: 15px;
}

.price-input, .price-type {
  flex: 1;
}

.skills-selection {
  margin-top: 10px;
}

.selected-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.selected-skill {
  background-color: #e1f5fe;
  color: #0288d1;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.remove-skill {
  background: none;
  border: none;
  color: #0288d1;
  margin-left: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  padding: 0 3px;
}

.skill-input {
  display: flex;
  gap: 10px;
}

.add-skill-btn {
  background-color: #e1f5fe;
  color: #0288d1;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #757575;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.submit-btn:hover:not([disabled]) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 30px;
  font-size: 18px;
  color: #666;
}

.error {
  text-align: center;
  padding: 20px;
  color: #f44336;
  background-color: #ffebee;
  border-radius: 4px;
  margin: 20px 0;
}
</style>
