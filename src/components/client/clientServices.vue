<template>
  <div class="client-services">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading services...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error">{{ error }}</div>
    </div>

    <div v-else class="services-container">
      <h1 class="page-title">Service Categories</h1>

      <!-- Category Selection List -->
      <div class="categories-selection" v-if="!selectedCategory">
        <div class="category-grid">
          <div v-for="category in categories" :key="category.id" 
               class="category-card-selection" 
               @click="selectCategory(category)">
            <div class="category-image">
              <img v-if="category.imageUrl" 
                   :src="category.imageUrl" 
                   :alt="category.name"
                   @error="handleImageError" />
              <i v-else class="fa fa-briefcase category-icon"></i>
            </div>
            <div class="category-info">
              <h2 class="category-name">{{ category.name }}</h2>
              <p class="category-description">{{ truncateText(category.description || 'No description available', 100) }}</p>
              <p class="service-count">{{ category.serviceCount }} services available</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Category and Services -->
      <div v-if="selectedCategory" class="selected-category">
        <div class="back-button-container">
          <button class="btn btn-back" @click="backToCategories">
            <i class="fa fa-arrow-left"></i> Back to Categories
          </button>
        </div>

        <div class="category-header">
          <div class="category-image">
            <img v-if="selectedCategory.imageUrl" 
                 :src="selectedCategory.imageUrl" 
                 :alt="selectedCategory.name"
                 @error="handleImageError" />
            <i v-else class="fa fa-briefcase category-icon"></i>
          </div>
          <div class="category-info">
            <h2 class="category-name">{{ selectedCategory.name }}</h2>
            <p class="category-description">{{ selectedCategory.description }}</p>
            <p class="service-count">{{ selectedCategory.serviceCount }} services available</p>
          </div>
        </div>

        <!-- Services for this category -->
        <div class="services-list" v-if="selectedCategory.services.length > 0">
          <div v-for="service in displayedServices" :key="service.id" class="service-card">
            <div class="service-image" v-if="service.imageUrls && service.imageUrls.length > 0">
              <img :src="service.imageUrls[0]" :alt="service.title" />
            </div>
            <div class="service-content">
              <h3 class="service-title">{{ service.title }}</h3>
              <p class="service-description">
                {{ truncateText(service.description, 150) }}
              </p>
              <div class="service-provider">
                <div class="provider-image" v-if="service.provider.profilePicture">
                  <img :src="service.provider.profilePicture" :alt="service.provider.name" />
                </div>
                <div class="provider-info">
                  <p class="provider-name" 
                     @click="viewProviderDetails(service.provider.id)"
                     style="cursor: pointer; color: #3498db;">
                    {{ service.provider.name }}
                  </p>
                  <div class="rating" v-if="service.provider.rating">
                    <span class="stars">
                      <i v-for="i in 5" :key="i" 
                        :class="['fa', i <= Math.round(service.provider.rating) ? 'fa-star' : 'fa-star-o']"></i>
                    </span>
                    <span class="rating-value">{{ service.provider.rating.toFixed(1) }}</span>
                    <span class="review-count">({{ service.provider.reviewCount }})</span>
                  </div>
                </div>
              </div>
              <div class="service-footer">
                <div class="service-price">
                  <span class="price">₱{{ Number(service.pricing).toFixed(2) }}</span>
                  <span class="price-type">/ {{ formatPriceType(service.pricingType) }}</span>
                </div>
                <div class="service-actions">
                
                  <button class="btn btn-book" @click="bookService(service)">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Show More/Less button -->
          <div class="show-more-container" v-if="selectedCategory.services.length > initialServiceCount">
            <button 
              class="btn btn-show-more" 
              @click="toggleShowMore"
            >
              {{ showAllServices ? 'Show Less' : `Show More (${selectedCategory.services.length - displayedServices.length} more)` }}
            </button>
          </div>
        </div>
        <div v-else class="no-services">
          No services available in this category
        </div>
      </div>

      <!-- Booking Modal -->
      <div v-if="showBookingModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Book Service</h2>
            <button class="close-btn" @click="closeBookingModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="booking-service-details">
              <h3>{{ selectedService.title }}</h3>
              <p class="modal-price">₱{{ Number(selectedService.pricing).toFixed(2) }} / {{ formatPriceType(selectedService.pricingType) }}</p>
              <p>Provider: {{ selectedService.provider.name }}</p>
            </div>
            
            <form @submit.prevent="submitBooking">
              <div class="form-group">
                <label for="booking-date">Date & Time</label>
                <input 
                  type="datetime-local" 
                  id="booking-date" 
                  v-model="bookingForm.dateTime" 
                  required
                  :min="currentDateTimeString"
                />
              </div>
              
              <div class="form-group">
                <label for="booking-address">Address</label>
                <select id="booking-address" v-model="bookingForm.addressId" required>
                  <option value="">-- Select an address --</option>
                  <option v-for="address in addresses" :key="address.id" :value="address.id">
                    {{ formatAddress(address) }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="booking-notes">Additional Notes</label>
                <textarea id="booking-notes" v-model="bookingForm.notes"></textarea>
              </div>
              
              <div class="booking-actions">
                <button type="button" class="btn btn-cancel" @click="closeBookingModal">Cancel</button>
                <button type="submit" class="btn btn-confirm" :disabled="isBookingSubmitting">
                  {{ isBookingSubmitting ? 'Processing...' : 'Confirm Booking' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Booking Success Modal -->
      <div v-if="showBookingSuccess" class="modal-overlay">
        <div class="modal success-modal">
          <div class="modal-header success">
            <h2>Booking Successful!</h2>
            <button class="close-btn" @click="closeSuccessModal">&times;</button>
          </div>
          <div class="modal-body text-center">
            <div class="success-icon">
              <i class="fa fa-check-circle"></i>
            </div>
            <p>Your booking has been successfully created.</p>
            <p>The service provider will be notified and will confirm your booking.</p>
            <div class="booking-actions">
              <button class="btn btn-primary" @click="goToBookings">View My Bookings</button>
              <button class="btn btn-secondary" @click="closeSuccessModal">Continue Browsing</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Provider Details Modal -->
      <provider-details-modal
        v-if="selectedProvider"
        :showModal="showProviderModal"
        :provider="selectedProvider"
        @close="closeProviderModal"
      />
    </div>
  </div>
</template>

<script>
import { FILE_SERVER_URL, serviceService, clientService, providerService } from '@/services/apiService';
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import ProviderDetailsModal from '@/components/modals/ProviderDetailsModal.vue';

const API_BASE_URL = FILE_SERVER_URL;
const getFileUrl = (relativePath) => {
  if (relativePath && (relativePath.startsWith('http://') || relativePath.startsWith('https://'))) {
    return relativePath;
  }
  
  if (relativePath && relativePath.startsWith('/')) {
    return `${API_BASE_URL}${relativePath}`;
  }
  
  return relativePath || '';
};

export default {
  name: 'ClientServices',
  components: {
    ProviderDetailsModal
  },
  setup() {
    const router = useRouter();
    const categories = ref([]);
    const selectedCategory = ref(null);
    const loading = ref(true);
    const error = ref('');
    const addresses = ref([]);

    // Booking modal state
    const showBookingModal = ref(false);
    const showBookingSuccess = ref(false);
    const selectedService = ref({});
    const isBookingSubmitting = ref(false);
    const bookingForm = ref({
      dateTime: '',
      addressId: '',
      notes: ''
    });

    // Provider details modal state
    const showProviderModal = ref(false);
    const selectedProvider = ref(null);

    // Get current date and time in ISO format for min attribute
    const currentDateTimeString = new Date().toISOString().slice(0, 16);
    
    // Fetch categories with services
    const fetchCategories = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await serviceService.getCategoriesWithServices();
        
        if (response.success) {
          // The category image URLs are already processed in the API service
          // so we can use the data directly
          categories.value = response.data;
        } else {
          error.value = response.message || 'Failed to load service categories';
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        error.value = 'Unable to load service categories. Please try again later.';
      } finally {
        loading.value = false;
      }
    };
    
    // Select a category to view its services
    const selectCategory = (category) => {
      selectedCategory.value = category;
    };
    
    // Go back to categories list
    const backToCategories = () => {
      selectedCategory.value = null;
    };
    
    // Fetch user addresses
    const fetchAddresses = async () => {
      try {
        const response = await clientService.getClientProfile();
        if (response.success && response.data.client && response.data.client.addresses) {
          addresses.value = response.data.client.addresses;
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      }
    };
    
    // Format address for display
    const formatAddress = (address) => {
      if (!address) return '';
      return `${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode} ${address.isDefault ? '(Default)' : ''}`;
    };

    // Format pricing type for display
    const formatPriceType = (type) => {
      switch (type) {
        case 'HOURLY': return 'hour';
        case 'FIXED': return 'fixed';
        case 'DAILY': return 'day';
        case 'SESSION': return 'session';
        default: return type.toLowerCase();
      }
    };
    
    // Truncate text for display
    const truncateText = (text, length) => {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    };
    
    // Open booking modal
    const bookService = (service) => {
      // Create a deep copy of the service and process its image URLs
      const processedService = JSON.parse(JSON.stringify(service));
      
      // Make sure the provider profile picture is processed correctly
      if (processedService.provider && processedService.provider.profilePicture) {
        processedService.provider.profilePicture = getFileUrl(processedService.provider.profilePicture);
      }
      
      // Process service image URLs if any
      if (processedService.imageUrls && Array.isArray(processedService.imageUrls)) {
        processedService.imageUrls = processedService.imageUrls.map(url => getFileUrl(url));
      }
      
      selectedService.value = processedService;
      showBookingModal.value = true;
    };
    
    // Close booking modal
    const closeBookingModal = () => {
      showBookingModal.value = false;
      // Reset form
      bookingForm.value = {
        dateTime: '',
        addressId: '',
        notes: ''
      };
    };
    
    // Close success modal
    const closeSuccessModal = () => {
      showBookingSuccess.value = false;
    };
    
    // Navigate to bookings page
    const goToBookings = () => {
      router.push('/client/bookings');
      showBookingSuccess.value = false;
    };
    
    // Submit booking
    const submitBooking = async () => {
      if (!bookingForm.value.dateTime || !bookingForm.value.addressId) {
        alert('Please fill in all required fields');
        return;
      }
      
      isBookingSubmitting.value = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const bookingData = {
          serviceId: selectedService.value.id,
          startTime: new Date(bookingForm.value.dateTime).toISOString(),
          addressId: bookingForm.value.addressId,
          notes: bookingForm.value.notes || null
        };
        
        const response = await clientService.bookService(bookingData);
        
        if (response.success) {
          closeBookingModal();
          showBookingSuccess.value = true;
        } else {
          alert('Failed to create booking: ' + (response.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error creating booking:', err);
        alert('Failed to create booking. Please try again later.');
      } finally {
        isBookingSubmitting.value = false;
      }
    };
    
    // View provider details
    const viewProviderDetails = async (providerId) => {
      if (!providerId) {
        console.error('Provider ID is undefined');
        return;
      }
      
      try {
        loading.value = true;
        const response = await providerService.getProviderDetails(providerId);
        if (response.success) {
          selectedProvider.value = response.data;
          showProviderModal.value = true;
        } else {
          console.error('Failed to load provider details:', response.message);
          error.value = 'Failed to load provider details. Please try again.';
        }
      } catch (err) {
        console.error('Error loading provider details:', err);
        error.value = 'An error occurred while loading provider details.';
      } finally {
        loading.value = false;
      }
    };
    
    // Close provider details modal
    const closeProviderModal = () => {
      showProviderModal.value = false;
      selectedProvider.value = null;
    };
    
    // Load data on component mount
    onMounted(() => {
      fetchCategories();
      fetchAddresses();
    });
    
    // Add these new refs
    const initialServiceCount = 6; // Number of services to show initially
    const showAllServices = ref(false);
    
    // Computed property for displayed services
    const displayedServices = computed(() => {
      if (!selectedCategory.value) return [];
      return showAllServices.value 
        ? selectedCategory.value.services 
        : selectedCategory.value.services.slice(0, initialServiceCount);
    });

    // Toggle show more/less
    const toggleShowMore = () => {
      showAllServices.value = !showAllServices.value;
    };

    // Handle image loading errors
    const handleImageError = (event) => {
      // Log the error for debugging
      console.warn('Failed to load image:', event.target.src);
      
      // Hide the broken image
      event.target.style.display = 'none';
      
      // Add an icon instead
      const iconElement = document.createElement('i');
      iconElement.className = 'fa fa-briefcase category-icon';
      event.target.parentNode.appendChild(iconElement);
    };

    return {
      categories,
      selectedCategory,
      loading,
      error,
      addresses,
      showBookingModal,
      showBookingSuccess,
      selectedService,
      bookingForm,
      isBookingSubmitting,
      currentDateTimeString,
      showProviderModal,
      selectedProvider,
      selectCategory,
      backToCategories,
      formatAddress,
      formatPriceType,
      truncateText,
      
      bookService,
      closeBookingModal,
      closeSuccessModal,
      goToBookings,
      submitBooking,
      viewProviderDetails,
      closeProviderModal,
      displayedServices,
      toggleShowMore,
      showAllServices,
      initialServiceCount,
      handleImageError,
    };
  }
};
</script>

<style scoped>
.client-services {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  color: #333;
  font-size: 2rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.error {
  color: #e74c3c;
  padding: 15px;
  border-radius: 5px;
  background-color: rgba(231, 76, 60, 0.1);
}

/* Categories Selection Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.category-card-selection {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-card-selection:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.category-card-selection .category-image {
  height: 180px;
  width: 100%;
  overflow: hidden;
}

.category-card-selection .category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-card-selection .category-info {
  padding: 15px;
}

/* Selected Category Display */
.back-button-container {
  margin-bottom: 20px;
}

.btn-back {
  background-color: #f1f1f1;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-back:hover {
  background-color: #e1e1e1;
}

.category-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.category-image {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 8px;
  flex-shrink: 0;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.category-name {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #333;
}

.category-description {
  margin: 0 0 10px 0;
  color: #555;
}

.service-count {
  font-size: 0.9rem;
  color: #777;
  margin: 0;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.service-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.service-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.service-image {
  height: 180px;
  overflow: hidden;
}

.service-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-content {
  padding: 15px;
}

.service-title {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  color: #333;
}

.service-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.4;
}

.service-provider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.provider-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.provider-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.provider-name {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 3px 0;
}

.provider-name:hover {
  text-decoration: underline;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stars {
  color: #f39c12;
}

.rating-value {
  font-weight: 500;
}

.review-count {
  font-size: 0.8rem;
  color: #777;
}

.service-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-price {
  font-size: 1.1rem;
}

.price {
  font-weight: 600;
  color: #2ecc71;
}

.price-type {
  font-size: 0.8rem;
  color: #777;
}

.service-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 15px;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  outline: none;
  transition: background-color 0.2s;
}

.btn-details {
  background-color: #ecf0f1;
  color: #555;
}

.btn-book {
  background-color: #3498db;
  color: white;
}

.btn-details:hover {
  background-color: #dde4e6;
}

.btn-book:hover {
  background-color: #2980b9;
}

.no-services {
  text-align: center;
  padding: 20px;
  color: #777;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.modal-header.success {
  background-color: #2ecc71;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
}

.modal-body {
  padding: 20px;
}

.booking-service-details {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.booking-service-details h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.modal-price {
  font-size: 1.1rem;
  color: #2ecc71;
  font-weight: 600;
  margin-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-group textarea {
  height: 100px;
  resize: vertical;
}

.booking-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  background-color: #ecf0f1;
  color: #555;
}

.btn-confirm {
  background-color: #2ecc71;
  color: white;
}

.btn-cancel:hover {
  background-color: #dde4e6;
}

.btn-confirm:hover {
  background-color: #27ae60;
}

.btn-confirm:disabled {
  background-color: #95e6bc;
  cursor: not-allowed;
}

.success-modal {
  max-width: 400px;
}

.success-icon {
  font-size: 4rem;
  color: #2ecc71;
  margin-bottom: 20px;
}

.text-center {
  text-align: center;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #555;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary:hover {
  background-color: #dde4e6;
}

.show-more-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 30px;
  grid-column: 1 / -1; /* Spans full width in grid */
}

.btn-show-more {
  background-color: #f8f9fa;
  color: #3498db;
  border: 1px solid #3498db;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 200px;
}

.btn-show-more:hover {
  background-color: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

/* Add transition for services */
.services-list {
  position: relative;
}

.service-card {
  transition: all 0.3s ease-in-out;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 768px) {
  .category-header {
    flex-direction: column;
  }
  
  .category-image {
    width: 100%;
    height: 150px;
  }
  
  .services-list {
    grid-template-columns: 1fr;
  }
  
  .service-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
