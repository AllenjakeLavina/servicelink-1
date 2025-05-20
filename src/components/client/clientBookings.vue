<template>
  <div class="client-bookings">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading bookings...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error">{{ error }}</div>
    </div>

    <div v-else class="bookings-container">
      <h1 class="page-title">My Bookings</h1>

      <!-- Status filter -->
      <div class="filter-container">
        <div class="filter-label">Filter by status:</div>
        <div class="filter-options">
          <button 
            v-for="status in statusOptions" 
            :key="status.value" 
            @click="filterByStatus(status.value)"
            :class="['filter-btn', currentFilter === status.value ? 'active' : '']">
            {{ status.label }}
          </button>
        </div>
      </div>

      <!-- Bookings list -->
      <div v-if="bookings.length > 0" class="bookings-list">
        <div v-for="booking in bookings" :key="booking.id" class="booking-card">
          <div class="booking-status" :class="booking.status.toLowerCase()">
            {{ formatStatus(booking.status) }}
          </div>
          
          <div class="booking-header">
            <div class="booking-image" v-if="getServiceImage(booking)">
              <img :src="getServiceImage(booking)" :alt="booking.service.title" />
            </div>
            <div class="booking-info">
              <h3 class="booking-title">{{ booking.title || booking.service.title }}</h3>
              <p class="booking-date">
                <i class="fa fa-calendar"></i> 
                {{ formatDate(booking.startTime) }}
              </p>
              <p class="booking-provider">
                <i class="fa fa-user"></i> 
                {{ getProviderName(booking) }}
              </p>
              <p class="booking-price">
                <i class="fa fa-tag"></i> 
                ₱{{ Number(booking.totalAmount || booking.service.pricing).toFixed(2) }}
              </p>
            </div>
          </div>

          <div class="booking-address" v-if="booking.address">
            <i class="fa fa-map-marker"></i> {{ formatAddress(booking.address) }}
          </div>
          
          <div class="booking-actions">
            <button class="btn btn-details" @click="viewBookingDetails(booking.id)">
              View Details
            </button>
            
            <button 
              v-if="booking.status === 'PENDING'"
              class="btn btn-cancel" 
              @click="confirmCancelBooking(booking)">
              Cancel Booking
            </button>
            
            <button 
              v-if="booking.status === 'PENDING' && !booking.payment"
              class="btn btn-payment" 
              @click="openPaymentModal(booking)">
              Process Payment
            </button>

            <button 
              v-if="booking.status === 'COMPLETED' && !hasReviewed(booking)"
              class="btn btn-review" 
              @click="openReviewModal(booking)">
              Write Review
            </button>
          </div>
        </div>
      </div>

      <div v-else class="no-bookings">
        <div class="empty-state">
          <i class="fa fa-calendar-o empty-icon"></i>
          <h3>No bookings found</h3>
          <p>You don't have any {{ currentFilter === 'ALL' ? '' : formatStatus(currentFilter).toLowerCase() }} bookings yet.</p>
          <button class="btn btn-primary" @click="goToServices">Browse Services</button>
        </div>
      </div>

      <!-- Cancel Confirmation Modal -->
      <div v-if="showCancelModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header warning">
            <h2>Cancel Booking</h2>
            <button class="close-btn" @click="showCancelModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to cancel this booking?</p>
            <p class="warning-text">This action cannot be undone.</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Provider: {{ getProviderName(selectedBooking) }}</p>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showCancelModal = false">No, Keep It</button>
              <button 
                class="btn btn-danger" 
                @click="cancelBooking()" 
                :disabled="isCancelling">
                {{ isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Confirmation Modal -->
      <div v-if="showPaymentModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Process Payment</h2>
            <button class="close-btn" @click="showPaymentModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="payment-details">
              <h3>{{ selectedBooking?.title || selectedBooking?.service.title }}</h3>
              <p class="payment-amount">
                Amount Due: ₱{{ Number(selectedBooking?.totalAmount || selectedBooking?.service.pricing).toFixed(2) }}
              </p>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Provider: {{ getProviderName(selectedBooking) }}</p>
            </div>
            
            <div class="payment-method">
              <p class="payment-note">
                <i class="fa fa-info-circle"></i> 
                Payment will be collected in cash when the service is provided.
              </p>
              
              <div class="file-upload">
                <label for="paymentProof">Upload Payment Proof (optional):</label>
                <input 
                  type="file" 
                  id="paymentProof" 
                  ref="paymentProofInput"
                  @change="handlePaymentProofUpload"
                  accept="image/*"
                  class="form-control"
                />
                <p class="file-hint">Supported formats: JPG, PNG, GIF (max 5MB)</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showPaymentModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="confirmPayment()" 
                :disabled="isProcessingPayment">
                {{ isProcessingPayment ? 'Processing...' : 'Confirm Booking' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Modal -->
      <div v-if="showReviewModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Write a Review</h2>
            <button class="close-btn" @click="showReviewModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="review-form">
              <div class="rating-input">
                <label>Rating:</label>
                <div class="star-rating">
                  <button 
                    v-for="star in 5" 
                    :key="star"
                    @click="setRating(star)"
                    :class="['star-btn', star <= reviewData.rating ? 'active' : '']"
                    type="button">
                    <i class="fa fa-star"></i>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label for="reviewComment">Comment:</label>
                <textarea 
                  id="reviewComment"
                  v-model="reviewData.comment"
                  placeholder="Share your experience..."
                  rows="4"
                  class="form-control"
                ></textarea>
              </div>

              <div class="file-upload">
                <label>Add Photos (optional):</label>
                <input 
                  type="file" 
                  ref="reviewImagesInput"
                  @change="handleReviewImagesUpload"
                  accept="image/*"
                  multiple
                  class="form-control"
                />
                <p class="file-hint">You can upload up to 5 images (JPG, PNG, GIF - max 5MB each)</p>
                
                <div v-if="selectedImages.length > 0" class="selected-images">
                  <div v-for="(image, index) in selectedImages" :key="index" class="image-preview">
                    <img :src="image.preview" :alt="'Selected image ' + (index + 1)" />
                    <button class="remove-image" @click="removeImage(index)">&times;</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showReviewModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="submitReview()" 
                :disabled="isSubmittingReview || !reviewData.rating">
                {{ isSubmittingReview ? 'Submitting...' : 'Submit Review' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clientService } from '@/services/apiService';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const API_BASE_URL = 'http://localhost:5500';

// Helper function to get file URL
const getFileUrl = (relativePath) => {
  if (!relativePath) return '';
  
  if (relativePath && (relativePath.startsWith('http://') || relativePath.startsWith('https://'))) {
    return relativePath;
  }
  
  if (relativePath && relativePath.startsWith('/')) {
    return `${API_BASE_URL}${relativePath}`;
  }
  
  return relativePath;
};

export default {
  name: 'ClientBookings',
  setup() {
    const router = useRouter();
    const bookings = ref([]);
    const loading = ref(true);
    const error = ref('');
    const currentFilter = ref('ALL');
    const userReviews = ref([]);
    
    // Modal states
    const showCancelModal = ref(false);
    const showPaymentModal = ref(false);
    const selectedBooking = ref(null);
    const isCancelling = ref(false);
    const isProcessingPayment = ref(false);

    // Payment related refs
    const paymentProofInput = ref(null);
    const paymentProofFile = ref(null);
    
    // Review related refs
    const showReviewModal = ref(false);
    const reviewImagesInput = ref(null);
    const selectedImages = ref([]);
    const reviewData = ref({
      rating: 0,
      comment: ''
    });
    const isSubmittingReview = ref(false);

    // Status options for filtering
    const statusOptions = [
      { label: 'All', value: 'ALL' },
      { label: 'Pending', value: 'PENDING' },
      { label: 'Confirmed', value: 'CONFIRMED' },
      { label: 'In Progress', value: 'IN_PROGRESS' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ];

    // Fetch all bookings
    const fetchBookings = async (status = null) => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await clientService.getBookings(status);
        
        if (response.success) {
          console.log('Bookings:', response.data);
          bookings.value = response.data;
        } else {
          error.value = response.message || 'Failed to load bookings';
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        error.value = 'Unable to load your bookings. Please try again later.';
      } finally {
        loading.value = false;
      }
    };

    // Filter bookings by status
    const filterByStatus = (status) => {
      currentFilter.value = status;
      fetchBookings(status === 'ALL' ? null : status);
    };

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    };

    // Format booking status
    const formatStatus = (status) => {
      if (!status) return '';
      
      switch (status) {
        case 'PENDING': return 'Pending';
        case 'CONFIRMED': return 'Confirmed';
        case 'IN_PROGRESS': return 'In Progress';
        case 'COMPLETED': return 'Completed';
        case 'CANCELLED': return 'Cancelled';
        case 'DISPUTED': return 'Disputed';
        default: return status;
      }
    };

    // Format address
    const formatAddress = (address) => {
      if (!address) return '';
      return `${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}`;
    };

    // Get provider name
    const getProviderName = (booking) => {
      if (!booking || !booking.serviceProvider || !booking.serviceProvider.user) {
        return 'Unknown Provider';
      }
      
      const { firstName, lastName } = booking.serviceProvider.user;
      return `${firstName} ${lastName}`;
    };

    // Get service image
    const getServiceImage = (booking) => {
      if (!booking || !booking.service || !booking.service.imageUrls) {
        return '';
      }
      
      try {
        // If imageUrls is a JSON string, parse it
        let imageUrls = booking.service.imageUrls;
        if (typeof imageUrls === 'string') {
          imageUrls = JSON.parse(imageUrls);
        }
        
        if (Array.isArray(imageUrls) && imageUrls.length > 0) {
          return getFileUrl(imageUrls[0]);
        }
      } catch (err) {
        console.error('Error parsing image URLs:', err);
      }
      
      return '';
    };

    // View booking details
    const viewBookingDetails = (bookingId) => {
      router.push(`/client/booking/${bookingId}`);
    };

    // Go to services page
    const goToServices = () => {
      router.push('/client/services');
    };

    // Show cancel booking confirmation
    const confirmCancelBooking = (booking) => {
      selectedBooking.value = booking;
      showCancelModal.value = true;
    };

    // Cancel booking
    const cancelBooking = async () => {
      if (!selectedBooking.value) return;
      
      isCancelling.value = true;
      
      try {
        const response = await clientService.cancelBooking(selectedBooking.value.id);
        
        if (response.success) {
          // Close modal and refresh bookings
          showCancelModal.value = false;
          // Update the status locally to avoid a full refresh
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            bookings.value[index].status = 'CANCELLED';
          }
          
          // If filtering, we may need to refetch
          if (currentFilter.value !== 'ALL' && currentFilter.value !== 'CANCELLED') {
            fetchBookings(currentFilter.value);
          }
        } else {
          error.value = response.message || 'Failed to cancel booking';
        }
      } catch (err) {
        console.error('Error cancelling booking:', err);
        error.value = 'Unable to cancel booking. Please try again later.';
      } finally {
        isCancelling.value = false;
      }
    };

    // Show payment processing modal
    const processPayment = (booking) => {
      selectedBooking.value = booking;
      showPaymentModal.value = true;
    };

    // File handling methods
    const handlePaymentProofUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File size should not exceed 5MB');
          event.target.value = '';
          return;
        }
        paymentProofFile.value = file;
      }
    };

    const handleReviewImagesUpload = (event) => {
      const files = Array.from(event.target.files);
      
      // Validate number of files
      if (selectedImages.value.length + files.length > 5) {
        alert('You can upload a maximum of 5 images');
        event.target.value = '';
        return;
      }

      // Validate file sizes and create previews
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(`File ${file.name} exceeds 5MB limit`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          selectedImages.value.push({
            file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    };

    const removeImage = (index) => {
      selectedImages.value.splice(index, 1);
    };

    // Payment confirmation
    const confirmPayment = async () => {
      try {
        isProcessingPayment.value = true;
        const result = await clientService.processPayment(
          selectedBooking.value.id,
          paymentProofFile.value
        );

        if (result.success) {
          showPaymentModal.value = false;
          // Refresh bookings list
          await fetchBookings();
        } else {
          alert(result.message || 'Failed to process payment');
        }
      } catch (error) {
        console.error('Payment error:', error);
        alert('An error occurred while processing payment');
      } finally {
        isProcessingPayment.value = false;
        paymentProofFile.value = null;
        if (paymentProofInput.value) {
          paymentProofInput.value.value = '';
        }
      }
    };

    // Function to handle star rating click
    const setRating = (value) => {
      reviewData.value.rating = Number(value);
    };

    // Review submission
    const submitReview = async () => {
      if (!reviewData.value.rating) {
        alert('Please provide a rating');
        return;
      }

      try {
        isSubmittingReview.value = true;
        const imageFiles = selectedImages.value.map(img => img.file);
        
        const result = await clientService.submitReview(
          selectedBooking.value.id,
          {
            rating: parseFloat(reviewData.value.rating), // Ensure it's a float
            comment: reviewData.value.comment
          },
          imageFiles
        );

        if (result.success) {
          showReviewModal.value = false;
          // Refresh bookings list
          await fetchBookings();
        } else {
          alert(result.message || 'Failed to submit review');
        }
      } catch (error) {
        console.error('Review submission error:', error);
        alert('An error occurred while submitting the review');
      } finally {
        isSubmittingReview.value = false;
        reviewData.value = { rating: 0, comment: '' };
        selectedImages.value = [];
        if (reviewImagesInput.value) {
          reviewImagesInput.value.value = '';
        }
      }
    };

    // Function to check if user has already reviewed
    const hasReviewed = (booking) => {
      if (!booking || !userReviews.value.length) return false;
      
      // Only check for reviews linked directly to this booking
      return userReviews.value.some(review => 
        review.serviceBooking && review.serviceBooking.id === booking.id
      );
    };

    // Function to open payment modal
    const openPaymentModal = (booking) => {
      selectedBooking.value = booking;
      showPaymentModal.value = true;
    };

    // Function to open review modal
    const openReviewModal = (booking) => {
      selectedBooking.value = booking;
      reviewData.value = { rating: 0, comment: '' };
      selectedImages.value = [];
      showReviewModal.value = true;
    };

    // Load data on component mount
    onMounted(() => {
      fetchBookings();
      fetchUserReviews();
    });
    
    // Add function to fetch user reviews
    const fetchUserReviews = async () => {
      try {
        const response = await clientService.getReviewsGiven();
        if (response.success) {
          userReviews.value = response.data;
        }
      } catch (err) {
        console.error('Error fetching user reviews:', err);
      }
    };
    
    return {
      bookings,
      loading,
      error,
      currentFilter,
      statusOptions,
      showCancelModal,
      showPaymentModal,
      selectedBooking,
      isCancelling,
      isProcessingPayment,
      paymentProofInput,
      handlePaymentProofUpload,
      showReviewModal,
      reviewImagesInput,
      selectedImages,
      reviewData,
      isSubmittingReview,
      handleReviewImagesUpload,
      removeImage,
      submitReview,
      fetchBookings,
      filterByStatus,
      formatDate,
      formatStatus,
      formatAddress,
      getProviderName,
      getServiceImage,
      viewBookingDetails,
      goToServices,
      confirmCancelBooking,
      cancelBooking,
      processPayment,
      confirmPayment,
      hasReviewed,
      openPaymentModal,
      openReviewModal,
      setRating,
      userReviews,
    };
  }
};
</script>

<style scoped>
.client-bookings {
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

.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-label {
  font-weight: 500;
  margin-right: 10px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-btn {
  background-color: #f1f1f1;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #e1e1e1;
}

.filter-btn.active {
  background-color: #3498db;
  color: white;
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.booking-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.booking-status {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px 15px;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.booking-status.pending {
  background-color: #f39c12;
}

.booking-status.confirmed {
  background-color: #3498db;
}

.booking-status.in_progress {
  background-color: #9b59b6;
}

.booking-status.completed {
  background-color: #2ecc71;
}

.booking-status.cancelled {
  background-color: #e74c3c;
}

.booking-status.disputed {
  background-color: #95a5a6;
}

.booking-header {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.booking-image {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border-radius: 8px;
  flex-shrink: 0;
}

.booking-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.booking-info {
  flex-grow: 1;
}

.booking-title {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #333;
  padding-right: 80px; /* Space for status badge */
}

.booking-date, .booking-provider, .booking-price {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #555;
}

.booking-date i, .booking-provider i, .booking-price i {
  width: 20px;
  color: #7f8c8d;
}

.booking-address {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
  color: #555;
}

.booking-address i {
  width: 20px;
  color: #7f8c8d;
}

.booking-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.btn-cancel {
  background-color: #e74c3c;
  color: white;
}

.btn-payment {
  background-color: #2ecc71;
  color: white;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #555;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-details:hover {
  background-color: #dde4e6;
}

.btn-cancel:hover {
  background-color: #c0392b;
}

.btn-payment:hover {
  background-color: #27ae60;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary:hover {
  background-color: #dde4e6;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.no-bookings {
  display: flex;
  justify-content: center;
  padding: 50px 0;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 4rem;
  color: #bdc3c7;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #555;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

/* Modal styles */
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

.modal-header.warning {
  background-color: #f39c12;
  color: white;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
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

.warning-text {
  color: #e74c3c;
  font-weight: 500;
  margin-bottom: 20px;
}

.booking-summary {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.booking-summary h4 {
  margin: 0 0 10px 0;
}

.booking-summary p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.payment-details {
  margin-bottom: 20px;
}

.payment-details h3 {
  margin: 0 0 10px 0;
}

.payment-amount {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2ecc71;
  margin-bottom: 15px;
}

.payment-method {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.payment-note {
  margin: 0;
  color: #555;
}

.payment-note i {
  color: #3498db;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.file-upload {
  margin: 1rem 0;
}

.file-hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.selected-images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.star-rating {
  display: flex;
  gap: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #ddd;
  transition: color 0.2s;
}

.star-btn.active {
  color: #ffd700;
}

.rating-input {
  margin-bottom: 1rem;
}

.btn-review {
  background-color: #4CAF50;
  color: white;
}

.btn-review:hover {
  background-color: #45a049;
}

.btn-payment {
  background-color: #2196F3;
  color: white;
}

.btn-payment:hover {
  background-color: #1976D2;
}

@media screen and (max-width: 768px) {
  .booking-header {
    flex-direction: column;
  }
  
  .booking-image {
    width: 100%;
    height: 150px;
  }
  
  .booking-title {
    padding-right: 0;
    margin-top: 10px;
  }
  
  .booking-status {
    position: static;
    display: inline-block;
    margin-bottom: 10px;
  }
  
  .booking-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
