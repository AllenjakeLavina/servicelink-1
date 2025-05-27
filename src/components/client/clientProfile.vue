<template>
  <div class="client-profile">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="profile-container">
      <!-- Profile Section -->
      <div class="profile-section">
        <h2>My Profile</h2>
        
        <div v-if="!isEditingProfile" class="profile-info">
          <div class="profile-header">
            <div class="profile-picture-container">
              <div v-if="user.profilePicture" class="profile-picture">
                <img :src="getFullFileUrl(user.profilePicture)" alt="Profile Picture" />
              </div>
              <div v-else class="profile-picture placeholder-img">
                <div class="profile-initials">{{ getUserInitials }}</div>
              </div>
              
              <!-- Add upload overlay and functionality -->
              <div class="profile-picture-overlay" @click="triggerFileUpload">
                <i class="fas fa-camera"></i>
                <span>Change Photo</span>
              </div>
              
              <!-- Hidden file input -->
              <input 
                type="file" 
                ref="profileImageInput" 
                @change="handleProfileImageChange" 
                accept="image/*" 
                class="hidden-input" 
              />
              
              <!-- Upload progress indicator -->
              <div v-if="uploadingProfileImage" class="upload-progress">
                <div class="spinner"></div>
              </div>
            </div>
            <div class="profile-name">
              <h3>{{ user.firstName }} {{ user.lastName }}</h3>
              <p>{{ user.email }}</p>
            </div>
          </div>

          <div class="profile-details">
            <div class="detail-item">
              <strong>Phone:</strong> {{ user.phone || 'Not provided' }}
            </div>
            <div class="actions">
              <button class="edit-btn" @click="startEditProfile">Edit Profile</button>
            </div>
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div v-else class="edit-profile-form">
          <form @submit.prevent="updateProfile">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input 
                id="firstName" 
                v-model="profileForm.firstName" 
                type="text" 
                required 
              />
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                id="lastName" 
                v-model="profileForm.lastName" 
                type="text" 
                required 
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                id="phone" 
                v-model="profileForm.phone" 
                type="tel" 
              />
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="cancelEditProfile">Cancel</button>
              <button type="submit" class="save-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Addresses Section -->
      <div class="addresses-section">
        <div class="section-header">
          <h2>My Addresses</h2>
          <button class="add-btn" @click="showAddAddressForm = true">Add Address</button>
        </div>

        <div v-if="addresses.length === 0" class="no-addresses">
          <p>You haven't added any addresses yet.</p>
        </div>

        <div v-else class="address-list">
          <div v-for="address in addresses" :key="address.id" class="address-card" :class="{ 'default-address': address.isDefault }">
            <div v-if="address.isDefault" class="default-badge">Default</div>
            <div class="address-type">{{ formatAddressType(address.type) }}</div>
            <div class="address-content">
              <p>{{ address.addressLine1 }}</p>
              <p v-if="address.addressLine2">{{ address.addressLine2 }}</p>
              <p>{{ address.city }}, {{ address.state }} {{ address.postalCode }}</p>
              <p>{{ address.country }}</p>
            </div>
            <div class="address-actions">
              <button class="edit-address-btn" @click="editAddress(address)">Edit</button>
              <button class="delete-btn" @click="deleteAddress(address.id)">Delete</button>
              <button 
                v-if="!address.isDefault" 
                class="default-btn" 
                @click="setDefaultAddress(address.id)"
              >
                Set as Default
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Address Modal -->
      <div v-if="showAddAddressForm" class="modal">
        <div class="modal-content">
          <span class="close-btn" @click="showAddAddressForm = false">&times;</span>
          <h2>Add New Address</h2>
          <form @submit.prevent="addAddress" class="address-form">
            <div class="form-group">
              <label for="addressType">Address Type</label>
              <select id="addressType" v-model="addressForm.type" required>
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="addressLine1">Address Line 1*</label>
              <input id="addressLine1" v-model="addressForm.addressLine1" required />
            </div>

            <div class="form-group">
              <label for="addressLine2">Address Line 2</label>
              <input id="addressLine2" v-model="addressForm.addressLine2" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="city">City*</label>
                <input id="city" v-model="addressForm.city" required />
              </div>

              <div class="form-group">
                <label for="state">State/Province*</label>
                <input id="state" v-model="addressForm.state" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="postalCode">Postal Code*</label>
                <input id="postalCode" v-model="addressForm.postalCode" required />
              </div>

              <div class="form-group">
                <label for="country">Country*</label>
                <input id="country" v-model="addressForm.country" required />
              </div>
            </div>

            <div class="form-group checkbox">
              <input id="isDefault" type="checkbox" v-model="addressForm.isDefault" />
              <label for="isDefault">Set as default address</label>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showAddAddressForm = false">Cancel</button>
              <button type="submit" class="save-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Adding...' : 'Add Address' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Address Modal -->
      <div v-if="showEditAddressForm" class="modal">
        <div class="modal-content">
          <span class="close-btn" @click="showEditAddressForm = false">&times;</span>
          <h2>Edit Address</h2>
          <form @submit.prevent="updateAddress" class="address-form">
            <div class="form-group">
              <label for="editAddressType">Address Type</label>
              <select id="editAddressType" v-model="editAddressForm.type" required>
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label for="editAddressLine1">Address Line 1*</label>
              <input id="editAddressLine1" v-model="editAddressForm.addressLine1" required />
            </div>

            <div class="form-group">
              <label for="editAddressLine2">Address Line 2</label>
              <input id="editAddressLine2" v-model="editAddressForm.addressLine2" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editCity">City*</label>
                <input id="editCity" v-model="editAddressForm.city" required />
              </div>

              <div class="form-group">
                <label for="editState">State/Province*</label>
                <input id="editState" v-model="editAddressForm.state" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editPostalCode">Postal Code*</label>
                <input id="editPostalCode" v-model="editAddressForm.postalCode" required />
              </div>

              <div class="form-group">
                <label for="editCountry">Country*</label>
                <input id="editCountry" v-model="editAddressForm.country" required />
              </div>
            </div>

            <div class="form-group checkbox">
              <input id="editIsDefault" type="checkbox" v-model="editAddressForm.isDefault" />
              <label for="editIsDefault">Set as default address</label>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="showEditAddressForm = false">Cancel</button>
              <button type="submit" class="save-btn" :disabled="isSubmitting">
                {{ isSubmitting ? 'Updating...' : 'Update Address' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Confirmation Dialog -->
      <div v-if="showConfirmDialog" class="modal">
        <div class="modal-content confirm-dialog">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete this address?</p>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showConfirmDialog = false">Cancel</button>
            <button type="button" class="delete-confirm-btn" @click="confirmDeleteAddress">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { clientService } from '../../services/apiService';
import apiService from '../../services/apiService';

export default {
  name: 'ClientProfile',
  setup() {
    // State
    const user = ref({});
    const addresses = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const isEditingProfile = ref(false);
    const isSubmitting = ref(false);
    
    // Profile image upload state
    const profileImageInput = ref(null);
    const uploadingProfileImage = ref(false);
    
    // Address state
    const showAddAddressForm = ref(false);
    const showEditAddressForm = ref(false);
    const showConfirmDialog = ref(false);
    const addressToDelete = ref(null);
    const editingAddressId = ref(null);
    
    // Form data
    const profileForm = reactive({
      firstName: '',
      lastName: '',
      phone: ''
    });
    
    const addressForm = reactive({
      type: 'HOME',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false
    });
    
    const editAddressForm = reactive({
      type: 'HOME',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      isDefault: false
    });
    
    // Computed
    const getUserInitials = computed(() => {
      if (user.value.firstName && user.value.lastName) {
        return `${user.value.firstName[0]}${user.value.lastName[0]}`;
      }
      return '';
    });
    
    // Methods
    const fetchClientProfile = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const response = await clientService.getClientProfile();
        
        if (response.success) {
          user.value = response.data;
          if (response.data.client && response.data.client.addresses) {
            addresses.value = response.data.client.addresses;
          } else {
            addresses.value = [];
          }
        } else {
          throw new Error('Failed to load profile data');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while loading your profile';
        console.error('Error fetching client profile:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Profile image upload functions
    const triggerFileUpload = () => {
      profileImageInput.value.click();
    };

    const handleProfileImageChange = async (event) => {
      const file = event.target.files[0];
      console.log('File selected:', file);
      
      if (!file) {
        console.error('No file selected');
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        error.value = 'Please select an image file';
        console.error('Invalid file type:', file.type);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error.value = 'Image must be less than 5MB';
        console.error('File too large:', file.size);
        return;
      }
      
      try {
        uploadingProfileImage.value = true;
        error.value = null;
        
        // Use the uploadProfilePicture service
        const response = await apiService.uploadProfilePicture(file);
        
        if (response.success) {
          // Update local user data with the response
          user.value = response.data;
          console.log('Profile picture updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update profile picture');
        }
      } catch (err) {
        console.error('Error in profile image upload:', err);
        error.value = err.message || 'Failed to upload profile picture';
      } finally {
        uploadingProfileImage.value = false;
        event.target.value = '';
      }
    };

    // Helper function to get full file URL
    const getFullFileUrl = (fileUrl) => {
      return apiService.getFileUrl(fileUrl);
    };
    
    const startEditProfile = () => {
      profileForm.firstName = user.value.firstName || '';
      profileForm.lastName = user.value.lastName || '';
      profileForm.phone = user.value.phone || '';
      isEditingProfile.value = true;
    };
    
    const cancelEditProfile = () => {
      isEditingProfile.value = false;
    };
    
    const updateProfile = async () => {
      try {
        isSubmitting.value = true;
        error.value = null;
        
        const response = await clientService.updateClientProfile(profileForm);
        
        if (response.success) {
          user.value = {
            ...user.value,
            ...profileForm
          };
          isEditingProfile.value = false;
        } else {
          throw new Error(response.message || 'Failed to update profile');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while updating your profile';
        console.error('Error updating profile:', err);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const addAddress = async () => {
      try {
        isSubmitting.value = true;
        error.value = null;
        
        const response = await clientService.addAddress(addressForm);
        
        if (response.success) {
          // If this is set as default, update other addresses
          if (addressForm.isDefault) {
            addresses.value.forEach(addr => {
              addr.isDefault = false;
            });
          }
          
          // Add new address to the list
          addresses.value.push(response.data);
          
          // Reset form and close modal
          resetAddressForm();
          showAddAddressForm.value = false;
        } else {
          throw new Error(response.message || 'Failed to add address');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while adding the address';
        console.error('Error adding address:', err);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const resetAddressForm = () => {
      addressForm.type = 'HOME';
      addressForm.addressLine1 = '';
      addressForm.addressLine2 = '';
      addressForm.city = '';
      addressForm.state = '';
      addressForm.postalCode = '';
      addressForm.country = '';
      addressForm.isDefault = false;
    };
    
    const editAddress = (address) => {
      editingAddressId.value = address.id;
      editAddressForm.type = address.type;
      editAddressForm.addressLine1 = address.addressLine1;
      editAddressForm.addressLine2 = address.addressLine2 || '';
      editAddressForm.city = address.city;
      editAddressForm.state = address.state;
      editAddressForm.postalCode = address.postalCode;
      editAddressForm.country = address.country;
      editAddressForm.isDefault = address.isDefault;
      
      showEditAddressForm.value = true;
    };
    
    const updateAddress = async () => {
      try {
        isSubmitting.value = true;
        error.value = null;
        
        const response = await clientService.updateAddress(editingAddressId.value, editAddressForm);
        
        if (response.success) {
          // Update the address in the list
          const index = addresses.value.findIndex(addr => addr.id === editingAddressId.value);
          
          if (index !== -1) {
            // If this address is now default, update other addresses
            if (editAddressForm.isDefault) {
              addresses.value.forEach(addr => {
                addr.isDefault = (addr.id === editingAddressId.value);
              });
            }
            
            addresses.value[index] = response.data;
          }
          
          // Close modal
          showEditAddressForm.value = false;
        } else {
          throw new Error(response.message || 'Failed to update address');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while updating the address';
        console.error('Error updating address:', err);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const deleteAddress = (addressId) => {
      addressToDelete.value = addressId;
      showConfirmDialog.value = true;
    };
    
    const confirmDeleteAddress = async () => {
      try {
        isSubmitting.value = true;
        error.value = null;
        
        const response = await clientService.deleteAddress(addressToDelete.value);
        
        if (response.success) {
          // Remove the address from the list
          addresses.value = addresses.value.filter(addr => addr.id !== addressToDelete.value);
          
          // Close dialog
          showConfirmDialog.value = false;
          addressToDelete.value = null;
        } else {
          throw new Error(response.message || 'Failed to delete address');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while deleting the address';
        console.error('Error deleting address:', err);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const setDefaultAddress = async (addressId) => {
      try {
        isSubmitting.value = true;
        error.value = null;
        
        const response = await clientService.setDefaultAddress(addressId);
        
        if (response.success) {
          // Update all addresses in the list
          addresses.value.forEach(addr => {
            addr.isDefault = (addr.id === addressId);
          });
        } else {
          throw new Error(response.message || 'Failed to set default address');
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while setting default address';
        console.error('Error setting default address:', err);
      } finally {
        isSubmitting.value = false;
      }
    };
    
    const formatAddressType = (type) => {
      switch (type) {
        case 'HOME': return 'Home';
        case 'WORK': return 'Work';
        case 'OTHER': return 'Other';
        default: return type;
      }
    };
    
    // Initialize
    onMounted(() => {
      fetchClientProfile();
    });
    
    return {
      user,
      addresses,
      loading,
      error,
      isEditingProfile,
      isSubmitting,
      profileForm,
      addressForm,
      editAddressForm,
      showAddAddressForm,
      showEditAddressForm,
      showConfirmDialog,
      getUserInitials,
      startEditProfile,
      cancelEditProfile,
      updateProfile,
      addAddress,
      editAddress,
      updateAddress,
      deleteAddress,
      confirmDeleteAddress,
      setDefaultAddress,
      formatAddressType,
      // Profile image upload
      profileImageInput,
      uploadingProfileImage,
      triggerFileUpload,
      handleProfileImageChange,
      getFullFileUrl
    };
  }
};
</script>

<style scoped>
.client-profile {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-section, .addresses-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

.profile-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
}

.profile-picture-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.profile-picture {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-img {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
}

.profile-initials {
  font-size: 32px;
  font-weight: bold;
  color: #555;
}

.profile-picture-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.profile-picture-container:hover .profile-picture-overlay {
  opacity: 1;
}

.profile-picture-overlay i {
  font-size: 20px;
  margin-bottom: 5px;
}

.profile-picture-overlay span {
  font-size: 11px;
  text-align: center;
}

.hidden-input {
  display: none;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-progress .spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-name h3 {
  margin: 0 0 5px 0;
  font-size: 22px;
}

.profile-name p {
  margin: 0;
  color: #666;
}

.profile-details {
  margin-top: 20px;
}

.detail-item {
  margin-bottom: 10px;
}

.actions {
  margin-top: 20px;
}

.edit-btn, .add-btn, .save-btn, .cancel-btn, .delete-btn, .default-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.edit-btn, .add-btn, .save-btn {
  background-color: #4caf50;
  color: white;
}

.edit-btn:hover, .add-btn:hover, .save-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
  margin-right: 10px;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.default-btn, .edit-address-btn {
  background-color: #2196F3;
  color: white;
  margin-right: 10px;
}

.default-btn:hover, .edit-address-btn:hover {
  background-color: #0b7dda;
}

.edit-profile-form, .address-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox input {
  width: auto;
  margin-right: 10px;
}

.checkbox label {
  display: inline;
  margin-bottom: 0;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.address-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  position: relative;
}

.default-address {
  border-color: #4caf50;
  background-color: #f8fff8;
}

.address-type {
  font-weight: bold;
  color: #555;
  margin-bottom: 10px;
}

.address-content p {
  margin: 5px 0;
}

.address-actions {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.default-badge {
  position: absolute;
  top: -10px;
  right: 10px;
  background-color: #4caf50;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  color: #aaa;
}

.close-btn:hover {
  color: #333;
}

.confirm-dialog {
  text-align: center;
  max-width: 400px;
  padding: 30px;
}

.confirm-dialog h3 {
  margin-top: 0;
}

.delete-confirm-btn {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
}

.delete-confirm-btn:hover {
  background-color: #d32f2f;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
}

.error {
  color: #f44336;
  background-color: #ffebee;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.no-addresses {
  text-align: center;
  padding: 30px;
  color: #757575;
  font-style: italic;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .address-list {
    grid-template-columns: 1fr;
  }
}
</style>
