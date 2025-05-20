<template>
  <div class="provider-bookings">
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
              <p class="booking-client">
                <i class="fa fa-user"></i> 
                {{ getClientName(booking) }}
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

          <div class="booking-notes" v-if="booking.notes">
            <h4>Notes:</h4>
            <p>{{ booking.notes }}</p>
          </div>
          
          <div class="booking-actions">
            <button class="btn btn-details" @click="viewBookingDetails(booking.id)">
              View Details
            </button>
            
            <template v-if="booking.status === 'PENDING'">
              <button class="btn btn-accept" @click="confirmAcceptBooking(booking)">
                Accept
              </button>
              <button class="btn btn-decline" @click="confirmDeclineBooking(booking)">
                Decline
              </button>
            </template>
            
            <button 
              v-if="booking.status === 'CONFIRMED'"
              class="btn btn-start" 
              @click="confirmStartService(booking)">
              Start Service
            </button>
            
            <button 
              v-if="booking.status === 'IN_PROGRESS'"
              class="btn btn-complete" 
              @click="confirmCompleteService(booking)">
              Complete Service
            </button>

            <button 
              v-if="booking.status === 'CONFIRMED' && booking.payment && booking.payment.status === 'PENDING'"
              class="btn btn-payment" 
              @click="confirmMarkPaymentCompleted(booking)">
              Mark Payment Received
            </button>
            
            <button
              v-if="booking.payment && booking.payment.paymentProofUrl"
              class="btn btn-view-proof"
              @click="viewPaymentProof(booking)">
              View Payment Proof
            </button>
            
            <button 
              v-if="booking.status === 'COMPLETED' && !isBookingRated(booking)"
              class="btn btn-rate" 
              @click="openRatingModal(booking)">
              Rate Client
            </button>
            
            <div v-if="booking.status === 'COMPLETED' && isBookingRated(booking)" class="rating-info">
              <span>Rated: {{ getBookingRating(booking) }} stars</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-bookings">
        <div class="empty-state">
          <i class="fa fa-calendar-o empty-icon"></i>
          <h3>No bookings found</h3>
          <p>You don't have any {{ currentFilter === 'ALL' ? '' : formatStatus(currentFilter).toLowerCase() }} bookings yet.</p>
        </div>
      </div>

      <!-- Accept Booking Modal -->
      <div v-if="showAcceptModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Accept Booking</h2>
            <button class="close-btn" @click="showAcceptModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to accept this booking?</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
              <p>Amount: ₱{{ Number(selectedBooking?.totalAmount || selectedBooking?.service.pricing).toFixed(2) }}</p>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showAcceptModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="acceptBooking()" 
                :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Accept Booking' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Decline Booking Modal -->
      <div v-if="showDeclineModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header warning">
            <h2>Decline Booking</h2>
            <button class="close-btn" @click="showDeclineModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to decline this booking?</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
            </div>

            <div class="form-group">
              <label for="declineReason">Reason for declining (optional):</label>
              <textarea 
                id="declineReason"
                v-model="declineReason"
                placeholder="Please provide a reason for declining this booking"
                rows="3"
                class="form-control"
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showDeclineModal = false">Cancel</button>
              <button 
                class="btn btn-danger" 
                @click="declineBooking()" 
                :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Decline Booking' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Start Service Modal -->
      <div v-if="showStartModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Start Service</h2>
            <button class="close-btn" @click="showStartModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you ready to start this service? This will notify the client that the service is in progress.</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
              <p>Address: {{ selectedBooking?.address ? formatAddress(selectedBooking?.address) : 'No address provided' }}</p>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showStartModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="startService()" 
                :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Start Service' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Complete Service Modal -->
      <div v-if="showCompleteModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Complete Service</h2>
            <button class="close-btn" @click="showCompleteModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to mark this service as completed?</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showCompleteModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="completeService()" 
                :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Complete Service' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mark Payment Received Modal -->
      <div v-if="showPaymentReceivedModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Mark Payment Received</h2>
            <button class="close-btn" @click="showPaymentReceivedModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Please confirm that you have received the payment for this service:</p>
            
            <div class="payment-details">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p class="payment-amount">₱{{ Number(selectedBooking?.totalAmount || selectedBooking?.service.pricing).toFixed(2) }}</p>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
              <p>Payment Method: {{ selectedBooking?.payment?.paymentMethod || 'Cash' }}</p>
              
              <!-- Payment proof section -->
              <div v-if="hasPaymentProof" class="payment-proof">
                <h5>Payment Proof</h5>
                <div class="payment-proof-image">
                  <img :src="getPaymentProofUrl(selectedBooking)" alt="Payment Proof" @click="openImageInNewTab(getPaymentProofUrl(selectedBooking))" />
                </div>
                <p class="proof-help-text">Click on image to view in full size</p>
              </div>
              <div v-else class="no-payment-proof">
                <p>No payment proof image was provided by the client.</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showPaymentReceivedModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="markPaymentCompleted()" 
                :disabled="isProcessing">
                {{ isProcessing ? 'Processing...' : 'Confirm Payment Received' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Modal -->
      <div v-if="showRatingModal" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>Rate the Client</h2>
            <button class="close-btn" @click="showRatingModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Please rate your experience with this client:</p>
            
            <div class="booking-summary">
              <h4>{{ selectedBooking?.title || selectedBooking?.service.title }}</h4>
              <p>Client: {{ getClientName(selectedBooking) }}</p>
              <p>Date: {{ formatDate(selectedBooking?.startTime) }}</p>
              <p>Amount: ₱{{ Number(selectedBooking?.totalAmount || selectedBooking?.service.pricing).toFixed(2) }}</p>
            </div>
            
            <div class="rating-container">
              <div class="star-rating">
                <template v-for="star in 5" :key="star">
                  <span 
                    class="star" 
                    :class="{ active: star <= rating }"
                    @click="rating = star">
                    ★
                  </span>
                </template>
              </div>
              <div class="rating-text">{{ ratingText }}</div>
            </div>
            
            <div class="form-group">
              <label for="ratingComment">Comment (optional):</label>
              <textarea 
                id="ratingComment"
                v-model="ratingComment"
                placeholder="Share your experience working with this client"
                rows="3"
                class="form-control"
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showRatingModal = false">Cancel</button>
              <button 
                class="btn btn-primary" 
                @click="submitRating()" 
                :disabled="!rating || isProcessing">
                {{ isProcessing ? 'Processing...' : 'Submit Rating' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { providerService } from '@/services/apiService';
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';

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
  name: 'ProviderBookings',
  setup() {
    const router = useRouter();
    const bookings = ref([]);
    const loading = ref(true);
    const error = ref('');
    const currentFilter = ref('ALL');
    
    // Modal states
    const showAcceptModal = ref(false);
    const showDeclineModal = ref(false);
    const showStartModal = ref(false);
    const showCompleteModal = ref(false);
    const showPaymentReceivedModal = ref(false);
    const showRatingModal = ref(false);
    const selectedBooking = ref(null);
    const isProcessing = ref(false);
    const declineReason = ref('');
    
    // Rating state
    const rating = ref(0);
    const ratingComment = ref('');
    const bookingRatings = ref({});
    
    const ratingText = computed(() => {
      switch (rating.value) {
        case 1: return 'Poor';
        case 2: return 'Fair';
        case 3: return 'Good';
        case 4: return 'Very Good';
        case 5: return 'Excellent';
        default: return 'Select a rating';
      }
    });

    // Computed property to check if payment proof exists
    const hasPaymentProof = computed(() => {
      return selectedBooking.value && 
             selectedBooking.value.payment && 
             selectedBooking.value.payment.paymentProofUrl;
    });

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
        const response = await providerService.getProviderBookings(status);
        
        if (response.success) {
          console.log('Bookings:', response.data);
          
          // Debug payment information
          const bookingsWithPayment = response.data.filter(booking => booking.payment);
          console.log('Bookings with payment:', bookingsWithPayment);
          
          // Check for confirmed bookings
          const confirmedBookings = response.data.filter(booking => booking.status === 'CONFIRMED');
          console.log('Confirmed bookings:', confirmedBookings);
          
          if (bookingsWithPayment.length > 0) {
            console.log('Payment data example:', bookingsWithPayment[0].payment);
            if (bookingsWithPayment[0].payment.paymentProofUrl) {
              console.log('Payment proof URL:', bookingsWithPayment[0].payment.paymentProofUrl);
              console.log('Formatted URL:', getFileUrl(bookingsWithPayment[0].payment.paymentProofUrl));
            }
          }
          
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

    // Get client name
    const getClientName = (booking) => {
      if (!booking || !booking.client || !booking.client.user) {
        return 'Unknown Client';
      }
      
      const { firstName, lastName } = booking.client.user;
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
      router.push(`/provider/bookings/${bookingId}`);
    };

    // Show accept booking confirmation
    const confirmAcceptBooking = (booking) => {
      selectedBooking.value = booking;
      showAcceptModal.value = true;
    };

    // Accept booking
    const acceptBooking = async () => {
      if (!selectedBooking.value) return;
      
      isProcessing.value = true;
      
      try {
        const response = await providerService.acceptBooking(selectedBooking.value.id);
        
        if (response.success) {
          // Close modal and refresh bookings
          showAcceptModal.value = false;
          // Update the status locally
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            bookings.value[index].status = 'CONFIRMED';
          }
          
          // If filtering, we may need to refetch
          if (currentFilter.value !== 'ALL' && currentFilter.value !== 'CONFIRMED') {
            fetchBookings(currentFilter.value);
          }
        } else {
          error.value = response.message || 'Failed to accept booking';
        }
      } catch (err) {
        console.error('Error accepting booking:', err);
        error.value = 'Unable to accept booking. Please try again later.';
      } finally {
        isProcessing.value = false;
      }
    };

    // Show decline booking confirmation
    const confirmDeclineBooking = (booking) => {
      selectedBooking.value = booking;
      declineReason.value = '';
      showDeclineModal.value = true;
    };

    // Decline booking
    const declineBooking = async () => {
      if (!selectedBooking.value) return;
      
      isProcessing.value = true;
      
      try {
        const response = await providerService.declineBooking(selectedBooking.value.id, declineReason.value);
        
        if (response.success) {
          // Close modal and refresh bookings
          showDeclineModal.value = false;
          // Update the status locally
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            bookings.value[index].status = 'CANCELLED';
          }
          
          // If filtering, we may need to refetch
          if (currentFilter.value !== 'ALL' && currentFilter.value !== 'CANCELLED') {
            fetchBookings(currentFilter.value);
          }
        } else {
          error.value = response.message || 'Failed to decline booking';
        }
      } catch (err) {
        console.error('Error declining booking:', err);
        error.value = 'Unable to decline booking. Please try again later.';
      } finally {
        isProcessing.value = false;
      }
    };

    // Show start service confirmation
    const confirmStartService = (booking) => {
      selectedBooking.value = booking;
      showStartModal.value = true;
    };

    // Start service
    const startService = async () => {
      if (!selectedBooking.value) return;
      
      isProcessing.value = true;
      
      try {
        const response = await providerService.startService(selectedBooking.value.id);
        
        if (response.success) {
          // Close modal and refresh bookings
          showStartModal.value = false;
          // Update the status locally
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            bookings.value[index].status = 'IN_PROGRESS';
          }
          
          // If filtering, we may need to refetch
          if (currentFilter.value !== 'ALL' && currentFilter.value !== 'IN_PROGRESS') {
            fetchBookings(currentFilter.value);
          }
        } else {
          error.value = response.message || 'Failed to start service';
        }
      } catch (err) {
        console.error('Error starting service:', err);
        error.value = 'Unable to start service. Please try again later.';
      } finally {
        isProcessing.value = false;
      }
    };

    // Show complete service confirmation
    const confirmCompleteService = (booking) => {
      selectedBooking.value = booking;
      showCompleteModal.value = true;
    };

    // Complete service
    const completeService = async () => {
      if (!selectedBooking.value) return;
      
      isProcessing.value = true;
      
      try {
        console.log('Completing service for booking:', selectedBooking.value.id);
        const response = await providerService.completeService(selectedBooking.value.id);
        
        if (response.success) {
          console.log('Service completed successfully:', response.data);
          // Close modal and refresh bookings
          showCompleteModal.value = false;
          // Update the status locally
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            bookings.value[index].status = 'COMPLETED';
            console.log('Updated booking status to COMPLETED locally');
          }
          
          // If filtering, we may need to refetch
          if (currentFilter.value !== 'ALL' && currentFilter.value !== 'COMPLETED') {
            fetchBookings(currentFilter.value);
          }
        } else {
          console.error('Failed to complete service:', response.message);
          error.value = response.message || 'Failed to complete service';
          // Close the modal but show the error
          showCompleteModal.value = false;
        }
      } catch (err) {
        console.error('Error completing service:', err);
        error.value = 'Unable to complete service. Please try again later.';
        showCompleteModal.value = false;
      } finally {
        isProcessing.value = false;
      }
    };

    // Show payment received confirmation
    const confirmMarkPaymentCompleted = (booking) => {
      selectedBooking.value = booking;
      showPaymentReceivedModal.value = true;
    };

    // Mark payment completed
    const markPaymentCompleted = async () => {
      if (!selectedBooking.value) return;
      
      isProcessing.value = true;
      
      try {
        console.log('Marking payment completed for booking:', selectedBooking.value.id);
        const response = await providerService.markPaymentReceived(selectedBooking.value.id);
        
        if (response.success) {
          console.log('Payment marked as completed:', response.data);
          // Close modal
          showPaymentReceivedModal.value = false;
          
          // Update the booking locally to reflect payment status change
          const index = bookings.value.findIndex(b => b.id === selectedBooking.value.id);
          if (index !== -1) {
            // Make sure that only the payment status changes
            if (bookings.value[index].payment) {
              bookings.value[index].payment.status = 'COMPLETED';
              console.log('Updated payment status to COMPLETED');
            } else {
              console.log('Creating payment object in booking');
              // Create payment object if it doesn't exist
              bookings.value[index].payment = {
                id: response.data?.id || 'temp-id',
                status: 'COMPLETED',
                amount: bookings.value[index].totalAmount || bookings.value[index].service.pricing,
                serviceBookingId: bookings.value[index].id
              };
            }
            
            // Make sure the booking status remains CONFIRMED
            console.log('Maintaining booking status as:', bookings.value[index].status);
            
            // Log the updated booking for debugging
            console.log('Updated booking after payment completion:', bookings.value[index]);
          }
          
          // Show the booking status for all bookings to debug
          bookings.value.forEach((booking, idx) => {
            console.log(`Booking ${idx} (${booking.id}) status:`, booking.status);
          });
          
          // Refresh bookings after a short delay to ensure UI updates first
          setTimeout(() => {
            fetchBookings(currentFilter.value === 'ALL' ? null : currentFilter.value);
          }, 500);
        } else {
          error.value = response.message || 'Failed to mark payment as completed';
        }
      } catch (err) {
        console.error('Error marking payment completed:', err);
        error.value = 'Unable to mark payment as completed. Please try again later.';
      } finally {
        isProcessing.value = false;
      }
    };

    // Get payment proof URL with proper formatting
    const getPaymentProofUrl = (booking) => {
      if (booking && booking.payment && booking.payment.paymentProofUrl) {
        return getFileUrl(booking.payment.paymentProofUrl);
      }
      return '';
    };
    
    // Open image in new tab for better viewing
    const openImageInNewTab = (imageUrl) => {
      if (imageUrl) {
        window.open(imageUrl, '_blank');
      }
    };
    
    // View payment proof directly
    const viewPaymentProof = (booking) => {
      if (booking && booking.payment && booking.payment.paymentProofUrl) {
        openImageInNewTab(getFileUrl(booking.payment.paymentProofUrl));
      }
    };

    // Check if booking has been rated
    const isBookingRated = (booking) => {
      // Check if this specific booking has a review
      return bookingRatings.value[booking.id] !== undefined;
    };
    
    // Get rating for a booking
    const getBookingRating = (booking) => {
      return bookingRatings.value[booking.id] || 0;
    };
    
    // Open rating modal
    const openRatingModal = (booking) => {
      selectedBooking.value = booking;
      rating.value = 0;
      ratingComment.value = '';
      showRatingModal.value = true;
    };
    
    // Submit rating
    const submitRating = async () => {
      if (!selectedBooking.value || !rating.value) return;
      
      isProcessing.value = true;
      
      try {
        const response = await providerService.createReview(
          selectedBooking.value.id,
          {
            rating: rating.value,
            comment: ratingComment.value
          }
        );
        
        if (response.success) {
          // Store the rating locally
          bookingRatings.value = {
            ...bookingRatings.value,
            [selectedBooking.value.id]: rating.value
          };
          
          // Close the modal
          showRatingModal.value = false;
          
          // Show success message or notification here
        } else {
          error.value = response.message || 'Failed to submit rating';
        }
      } catch (err) {
        console.error('Error submitting rating:', err);
        error.value = 'Unable to submit rating. Please try again later.';
      } finally {
        isProcessing.value = false;
      }
    };

    // Fetch ratings for bookings
    const fetchRatings = async () => {
      try {
        // Get reviews that the provider has given
        const response = await providerService.getReviewsGiven();
        
        if (response.success) {
          // Create a map of booking IDs to ratings
          const ratings = {};
          
          response.data.forEach(review => {
            // Only add reviews that have a serviceBookingId
            if (review.serviceBookingId) {
              ratings[review.serviceBookingId] = review.rating;
            }
          });
          
          bookingRatings.value = ratings;
          console.log('Fetched reviews for bookings:', ratings);
        }
      } catch (err) {
        console.error('Error fetching ratings:', err);
      }
    };

    // Load data on component mount
    onMounted(() => {
      fetchBookings();
      fetchRatings();
    });
    
    return {
      bookings,
      loading,
      error,
      currentFilter,
      statusOptions,
      showAcceptModal,
      showDeclineModal,
      showStartModal,
      showCompleteModal,
      showPaymentReceivedModal,
      showRatingModal,
      selectedBooking,
      isProcessing,
      declineReason,
      rating,
      ratingComment,
      ratingText,
      hasPaymentProof,
      fetchBookings,
      filterByStatus,
      formatDate,
      formatStatus,
      formatAddress,
      getClientName,
      getServiceImage,
      viewBookingDetails,
      confirmAcceptBooking,
      acceptBooking,
      confirmDeclineBooking,
      declineBooking,
      confirmStartService,
      startService,
      confirmCompleteService,
      completeService,
      confirmMarkPaymentCompleted,
      markPaymentCompleted,
      getPaymentProofUrl,
      openImageInNewTab,
      viewPaymentProof,
      isBookingRated,
      getBookingRating,
      openRatingModal,
      submitRating
    };
  }
};
</script>

<style scoped>
.provider-bookings {
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

.booking-date, .booking-client, .booking-price {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #555;
}

.booking-date i, .booking-client i, .booking-price i {
  width: 20px;
  color: #7f8c8d;
}

.booking-address {
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #555;
}

.booking-notes {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.booking-notes h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #333;
}

.booking-notes p {
  margin: 0;
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
  padding-top: 15px;
  border-top: 1px solid #eee;
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

.btn-accept {
  background-color: #2ecc71;
  color: white;
}

.btn-decline, .btn-cancel {
  background-color: #e74c3c;
  color: white;
}

.btn-start {
  background-color: #3498db;
  color: white;
}

.btn-complete {
  background-color: #27ae60;
  color: white;
}

.btn-payment {
  background-color: #f39c12;
  color: white;
}

.btn-payment:hover {
  background-color: #d67f0d;
}

.btn-view-proof {
  background-color: #3498db;
  color: white;
}

.btn-view-proof:hover {
  background-color: #2980b9;
}

.btn-rate {
  background-color: #9b59b6;
  color: white;
}

.btn-rate:hover {
  background-color: #8e44ad;
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

.btn-accept:hover {
  background-color: #27ae60;
}

.btn-decline:hover, .btn-cancel:hover {
  background-color: #c0392b;
}

.btn-start:hover {
  background-color: #2980b9;
}

.btn-complete:hover {
  background-color: #219d55;
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

.payment-details h4 {
  margin: 0 0 10px 0;
}

.payment-amount {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2ecc71;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95rem;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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

.rating-info {
  display: inline-flex;
  align-items: center;
  background-color: #f1f1f1;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.rating-container {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.star-rating {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.star {
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s ease;
}

.star:hover, .star.active {
  color: #f39c12;
}

.rating-text {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin-top: 10px;
}

.payment-proof {
  margin: 20px 0;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  background-color: #f9f9f9;
}

.payment-proof h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.payment-proof-image {
  margin-bottom: 10px;
  text-align: center;
}

.payment-proof-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.payment-proof-image img:hover {
  transform: scale(1.02);
}

.proof-help-text {
  font-size: 0.85rem;
  color: #7f8c8d;
  text-align: center;
  margin: 5px 0 0 0;
}

.no-payment-proof {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  color: #7f8c8d;
  text-align: center;
}
</style>
