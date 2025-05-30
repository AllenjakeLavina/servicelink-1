<template>
  <div class="booking-details">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading booking details...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error">{{ error }}</div>
    </div>

    <div v-else class="details-container">
      <div class="header">
        <button class="back-btn" @click="goBack">
          <i class="fa fa-arrow-left"></i> Back to Bookings
        </button>
        <h1>Booking Details</h1>
      </div>

      <div class="booking-card">
        <div class="booking-status" :class="booking.status.toLowerCase()">
          {{ formatStatus(booking.status) }}
        </div>

        <div class="service-details">
          <div class="service-image" v-if="getServiceImage(booking)">
            <img :src="getServiceImage(booking)" :alt="booking.service.title" />
          </div>
          
          <div class="service-info">
            <h2>{{ booking.title || booking.service.title }}</h2>
            <p class="date">
              <i class="fa fa-calendar"></i> 
              {{ formatDate(booking.startTime) }}
            </p>
            <p class="client">
              <i class="fa fa-user"></i> 
              {{ getClientName(booking) }}
            </p>
            <p class="price">
              <i class="fa fa-tag"></i> 
              ₱{{ Number(booking.totalAmount || booking.service.pricing).toFixed(2) }}
            </p>
          </div>
        </div>

        <div class="section">
          <h3>Service Location</h3>
          <div class="address" v-if="booking.address">
            <i class="fa fa-map-marker"></i>
            {{ formatAddress(booking.address) }}
          </div>
        </div>

        <div class="section" v-if="booking.notes">
          <h3>Additional Notes</h3>
          <p class="notes">{{ booking.notes }}</p>
        </div>

        <div class="section" v-if="booking.payment">
          <h3>Payment Information</h3>
          <div class="payment-info">
            <p>Status: <span :class="booking.payment.status.toLowerCase()">{{ booking.payment.status }}</span></p>
            <p>Amount: ₱{{ Number(booking.payment.amount).toFixed(2) }}</p>
            <p v-if="booking.payment.paymentMethod">Method: {{ booking.payment.paymentMethod }}</p>
            
            <div v-if="booking.payment.paymentProofUrl" class="payment-proof">
              <h4>Payment Proof</h4>
              <img 
                :src="getPaymentProofUrl(booking)" 
                alt="Payment Proof"
                @click="openImageInNewTab(getPaymentProofUrl(booking))"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <template v-if="booking.status === 'PENDING'">
            <button class="btn btn-accept" @click="confirmAcceptBooking">Accept</button>
            <button class="btn btn-decline" @click="confirmDeclineBooking">Decline</button>
          </template>
          
          <button 
            v-if="booking.status === 'CONFIRMED'"
            class="btn btn-start" 
            @click="confirmStartService">
            Start Service
          </button>
          
          <button 
            v-if="booking.status === 'IN_PROGRESS'"
            class="btn btn-complete" 
            @click="confirmCompleteService">
            Complete Service
          </button>

          <button 
            v-if="booking.status === 'COMPLETED' && booking.payment && booking.payment.status === 'PENDING'"
            class="btn btn-payment" 
            @click="confirmMarkPaymentCompleted">
            Mark Payment Received
          </button>
          
          <button 
            v-if="booking.status === 'COMPLETED' && !isBookingRated"
            class="btn btn-rate" 
            @click="openRatingModal">
            Rate Client
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { providerService } from '@/services/apiService';

const API_BASE_URL = 'http://localhost:5500';

const getFileUrl = (relativePath) => {
  if (!relativePath) return '';
  
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  if (relativePath.startsWith('/')) {
    return `${API_BASE_URL}${relativePath}`;
  }
  
  return relativePath;
};

export default {
  name: 'ProviderBookingDetails',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const booking = ref(null);
    const loading = ref(true);
    const error = ref('');
    const isBookingRated = ref(false);

    const fetchBookingDetails = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await providerService.getProviderBookingDetails(route.params.bookingId);
        if (response.success) {
          booking.value = response.data;
          // Check if booking is rated
          await checkBookingRating();
        } else {
          error.value = response.message || 'Failed to load booking details';
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        error.value = 'Unable to load booking details. Please try again later.';
      } finally {
        loading.value = false;
      }
    };

    const checkBookingRating = async () => {
      try {
        const response = await providerService.getReviewsGiven();
        if (response.success) {
          isBookingRated.value = response.data.some(
            review => review.serviceBookingId === route.params.bookingId
          );
        }
      } catch (err) {
        console.error('Error checking booking rating:', err);
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatStatus = (status) => {
      if (!status) return '';
      return status.charAt(0) + status.slice(1).toLowerCase();
    };

    const formatAddress = (address) => {
      if (!address) return '';
      return `${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}`;
    };

    const getClientName = (booking) => {
      if (!booking?.client?.user) return 'Unknown Client';
      const { firstName, lastName } = booking.client.user;
      return `${firstName} ${lastName}`;
    };

    const getServiceImage = (booking) => {
      if (!booking?.service?.imageUrls) return '';
      
      try {
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

    const getPaymentProofUrl = (booking) => {
      if (booking?.payment?.paymentProofUrl) {
        return getFileUrl(booking.payment.paymentProofUrl);
      }
      return '';
    };

    const openImageInNewTab = (imageUrl) => {
      if (imageUrl) {
        window.open(imageUrl, '_blank');
      }
    };

    const goBack = () => {
      router.push('/provider/bookings');
    };

    const confirmAcceptBooking = async () => {
      if (confirm('Are you sure you want to accept this booking?')) {
        try {
          const response = await providerService.acceptBooking(booking.value.id);
          if (response.success) {
            booking.value.status = 'CONFIRMED';
          } else {
            error.value = response.message || 'Failed to accept booking';
          }
        } catch (err) {
          console.error('Error accepting booking:', err);
          error.value = 'Unable to accept booking. Please try again later.';
        }
      }
    };

    const confirmDeclineBooking = async () => {
      const reason = prompt('Please provide a reason for declining (optional):');
      if (reason !== null) {
        try {
          const response = await providerService.declineBooking(booking.value.id, reason);
          if (response.success) {
            booking.value.status = 'CANCELLED';
          } else {
            error.value = response.message || 'Failed to decline booking';
          }
        } catch (err) {
          console.error('Error declining booking:', err);
          error.value = 'Unable to decline booking. Please try again later.';
        }
      }
    };

    const confirmStartService = async () => {
      if (confirm('Are you ready to start this service?')) {
        try {
          const response = await providerService.startService(booking.value.id);
          if (response.success) {
            booking.value.status = 'IN_PROGRESS';
          } else {
            error.value = response.message || 'Failed to start service';
          }
        } catch (err) {
          console.error('Error starting service:', err);
          error.value = 'Unable to start service. Please try again later.';
        }
      }
    };

    const confirmCompleteService = async () => {
      if (confirm('Are you sure you want to mark this service as completed?')) {
        try {
          const response = await providerService.completeService(booking.value.id);
          if (response.success) {
            booking.value.status = 'COMPLETED';
          } else {
            error.value = response.message || 'Failed to complete service';
          }
        } catch (err) {
          console.error('Error completing service:', err);
          error.value = 'Unable to complete service. Please try again later.';
        }
      }
    };

    const confirmMarkPaymentCompleted = async () => {
      if (confirm('Are you sure you want to mark the payment as received?')) {
        try {
          const response = await providerService.markPaymentReceived(booking.value.id);
          if (response.success) {
            if (booking.value.payment) {
              booking.value.payment.status = 'COMPLETED';
            }
          } else {
            error.value = response.message || 'Failed to mark payment as received';
          }
        } catch (err) {
          console.error('Error marking payment as received:', err);
          error.value = 'Unable to mark payment as received. Please try again later.';
        }
      }
    };

    const openRatingModal = () => {
      router.push({
        name: 'ProviderBookings',
        query: { openRating: 'true', bookingId: booking.value.id }
      });
    };

    onMounted(() => {
      fetchBookingDetails();
    });

    return {
      booking,
      loading,
      error,
      isBookingRated,
      formatDate,
      formatStatus,
      formatAddress,
      getClientName,
      getServiceImage,
      getPaymentProofUrl,
      openImageInNewTab,
      goBack,
      confirmAcceptBooking,
      confirmDeclineBooking,
      confirmStartService,
      confirmCompleteService,
      confirmMarkPaymentCompleted,
      openRatingModal
    };
  }
};
</script>

<style scoped>
.booking-details {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background-color: rgba(52, 152, 219, 0.1);
}

.booking-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.booking-status {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.booking-status.pending { background-color: #f39c12; }
.booking-status.confirmed { background-color: #3498db; }
.booking-status.in_progress { background-color: #9b59b6; }
.booking-status.completed { background-color: #2ecc71; }
.booking-status.cancelled { background-color: #e74c3c; }

.service-details {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
}

.service-image {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
}

.service-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-info h2 {
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.service-info p {
  margin: 10px 0;
  font-size: 1.1rem;
  color: #34495e;
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-info i {
  color: #3498db;
  width: 20px;
}

.section {
  margin: 30px 0;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.address {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #34495e;
  font-size: 1.1rem;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.notes {
  color: #34495e;
  font-size: 1.1rem;
  line-height: 1.6;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.payment-info {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.payment-info p {
  margin: 10px 0;
  font-size: 1.1rem;
  color: #34495e;
}

.payment-info .completed {
  color: #2ecc71;
  font-weight: 600;
}

.payment-info .pending {
  color: #f39c12;
  font-weight: 600;
}

.payment-proof {
  margin-top: 20px;
}

.payment-proof h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.payment-proof img {
  max-width: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.payment-proof img:hover {
  transform: scale(1.05);
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-accept {
  background-color: #2ecc71;
  color: white;
}

.btn-decline {
  background-color: #e74c3c;
  color: white;
}

.btn-start {
  background-color: #3498db;
  color: white;
}

.btn-complete {
  background-color: #2ecc71;
  color: white;
}

.btn-payment {
  background-color: #f39c12;
  color: white;
}

.btn-rate {
  background-color: #9b59b6;
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  padding: 20px;
  background-color: #fef2f2;
  border-left: 4px solid #e74c3c;
  color: #e74c3c;
  border-radius: 8px;
  margin: 20px 0;
}

@media (max-width: 768px) {
  .booking-details {
    padding: 15px;
  }

  .service-details {
    flex-direction: column;
  }

  .service-image {
    width: 100%;
    height: 250px;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .booking-status {
    position: static;
    display: inline-block;
    margin-bottom: 20px;
  }
}
</style> 