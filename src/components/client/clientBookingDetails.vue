<template>
  <div class="booking-details-container">
    <div v-if="loading" class="loading">Loading booking details...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="booking" class="booking-details">
      <h1>Booking Details</h1>
      <div class="details-card">
        <h2>{{ booking.title || 'Booking' }}</h2>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span :class="'status ' + booking.status.toLowerCase()">{{ formatStatus(booking.status) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span>{{ formatDate(booking.startTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Provider:</span>
          <span>{{ getProviderName(booking) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service:</span>
          <span>{{ booking.service?.title || 'N/A' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Amount:</span>
          <span>${{ booking.totalAmount || 'N/A' }}</span>
        </div>
        <div class="detail-row" v-if="booking.address">
          <span class="label">Location:</span>
          <span>{{ formatAddress(booking.address) }}</span>
        </div>
        <div class="detail-row" v-if="booking.notes">
          <span class="label">Notes:</span>
          <span>{{ booking.notes }}</span>
        </div>
      </div>
      
      <button class="btn btn-primary" @click="goBack">Back to Bookings</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clientService } from '@/services/apiService';

export default {
  name: 'ClientBookingDetails',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const booking = ref(null);
    const loading = ref(true);
    const error = ref('');
    
    onMounted(async () => {
      const bookingId = route.params.bookingId;
      if (!bookingId) {
        error.value = 'Booking ID is required';
        loading.value = false;
        return;
      }
      
      await fetchBookingDetails(bookingId);
    });
    
    const fetchBookingDetails = async (bookingId) => {
      try {
        loading.value = true;
        const response = await clientService.getBookingDetails(bookingId);
        if (response.success) {
          booking.value = response.data;
          console.log('Booking details:', booking.value);
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
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    };
    
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
    
    const formatAddress = (address) => {
      if (!address) return 'N/A';
      return `${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}`;
    };
    
    const getProviderName = (booking) => {
      if (!booking || !booking.serviceProvider || !booking.serviceProvider.user) {
        return 'Unknown Provider';
      }
      
      const { firstName, lastName } = booking.serviceProvider.user;
      return `${firstName} ${lastName}`;
    };
    
    const goBack = () => {
      router.push('/client/bookings');
    };
    
    return {
      booking,
      loading,
      error,
      formatDate,
      formatStatus,
      formatAddress,
      getProviderName,
      goBack
    };
  }
}
</script>

<style scoped>
.booking-details-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  margin-top: 50px;
  font-size: 18px;
}

.error {
  color: #f44336;
}

.booking-details h1 {
  text-align: center;
  margin-bottom: 30px;
}

.details-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.details-card h2 {
  margin-top: 0;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
  padding: 5px 0;
}

.label {
  font-weight: bold;
  min-width: 100px;
}

.status {
  font-weight: bold;
}

.status.pending { color: #ff9800; }
.status.confirmed { color: #2196f3; }
.status.in_progress { color: #673ab7; }
.status.completed { color: #4caf50; }
.status.cancelled { color: #f44336; }
.status.disputed { color: #e91e63; }

button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0b7dda;
}
</style> 