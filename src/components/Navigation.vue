<template>
  <div class="navigation-container" v-if="shouldShowNav">
    <div class="nav-content">
      <!-- Logo aligned to the left -->
      <div class="logo">
        <router-link to="/">
          <img src="../assets/logo.png" alt="ServiceLink" />
        </router-link>
      </div>

      <!-- All navigation items moved to the right side -->
      <div class="right-content">
        <!-- Navigation Links -->
        <div class="nav-links">
          <!-- Client links -->
          <template v-if="userRole === 'CLIENT'">
            <router-link to="/client/bookings" class="nav-item">
              <div class="icon"><i class="fas fa-calendar-alt"></i></div>
              <span>Bookings</span>
            </router-link>
            <router-link to="/client/services" class="nav-item">
              <div class="icon"><i class="fas fa-concierge-bell"></i></div>
              <span>My Services</span>
            </router-link>
          </template>
          
          <!-- Provider links -->
          <template v-if="userRole === 'PROVIDER'">
            <router-link to="/provider/bookings" class="nav-item">
              <div class="icon"><i class="fas fa-calendar-alt"></i></div>
              <span>Bookings</span>
            </router-link>
            <router-link to="/provider/services" class="nav-item">
              <div class="icon"><i class="fas fa-briefcase"></i></div>
              <span>My Services</span>
            </router-link>
          </template>
          
          <!-- Admin links -->
          <template v-if="userRole === 'ADMIN'">
            <router-link to="/admin/dashboard" class="nav-item">
              <div class="icon"><i class="fas fa-tachometer-alt"></i></div>
              <span>Dashboard</span>
            </router-link>
            <router-link to="/admin/users" class="nav-item">
              <div class="icon"><i class="fas fa-users"></i></div>
              <span>Users</span>
            </router-link>
            <router-link to="/admin/services" class="nav-item">
              <div class="icon"><i class="fas fa-cogs"></i></div>
              <span>Services</span>
            </router-link>
          </template>
        </div>

        <!-- User actions -->
        <div class="user-actions">
          <!-- Profile link based on role -->
          <template v-if="userRole === 'CLIENT'">
            <router-link to="/client/profile" class="nav-item profile-link">
              <div class="icon"><i class="fas fa-user-circle"></i></div>
              <span>Profile</span>
            </router-link>
          </template>
          <template v-else-if="userRole === 'PROVIDER'">
            <router-link to="/provider/profile" class="nav-item profile-link">
              <div class="icon"><i class="fas fa-user-circle"></i></div>
              <span>Profile</span>
            </router-link>
          </template>
          <template v-else-if="userRole === 'ADMIN'">
            <router-link to="/admin/profile" class="nav-item profile-link">
              <div class="icon"><i class="fas fa-user-circle"></i></div>
              <span>Profile</span>
            </router-link>
          </template>
          
          <!-- Notification item -->
          <div class="nav-item notification-wrapper" v-if="isAuthenticated" @click="toggleNotificationDropdown" ref="notificationRef">
            <div class="notification-icon">
              <i class="fas fa-bell"></i>
              <div v-if="notificationCount > 0" class="notification-badge">{{ formatCount(notificationCount) }}</div>
            </div>
            
            <!-- Notifications dropdown -->
            <div v-if="showNotificationDropdown" class="notifications-dropdown">
              <div class="notifications-header">
                <h3>Notifications</h3>
                <router-link to="/notifications" class="view-all" @click="showNotificationDropdown = false">
                  View All
                </router-link>
              </div>
              <div v-if="loadingNotifications" class="notifications-loading">
                <div class="loading-spinner"></div>
              </div>
              <div v-else-if="recentNotifications.length === 0" class="no-notifications">
                <p>No notifications</p>
              </div>
              <div v-else class="recent-notifications">
                <div 
                  v-for="notification in recentNotifications" 
                  :key="notification.id" 
                  :class="['notification-item', { unread: !notification.isRead }]"
                  @click="viewNotification(notification)"
                >
                  <div class="notification-mini-icon">
                    <i :class="getNotificationIcon(notification.type)"></i>
                  </div>
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="user-profile" v-if="isAuthenticated" @click="toggleUserMenu">
            <span class="username">{{ userName }}</span>
            <div class="dropdown-icon"><i class="fas fa-chevron-down"></i></div>
            
            <!-- Dropdown menu -->
            <div class="dropdown-menu" v-if="showUserMenu">
              <div class="dropdown-header">
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <span>{{ userName }}</span>
              </div>
              <router-link to="/messages" class="dropdown-item">
                <i class="fas fa-envelope"></i>
                <span>Messages</span>
              </router-link>
              <router-link to="/settings" class="dropdown-item">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
              </router-link>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item logout" @click="handleLogout">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </div>
            </div>
          </div>
          
          <div class="auth-buttons" v-if="!isAuthenticated">
            <router-link to="/login" class="btn login-btn">Login</router-link>
            <router-link to="/register" class="btn register-btn">Register</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { notificationService, clientService, providerService } from '../services/apiService';

export default {
  name: 'Navigation',
  setup() {
    // Helper function to get file URL
    const getFileUrl = (relativePath) => {
      const API_BASE_URL = 'http://localhost:5500';
      
      if (!relativePath) return '';
      
      if (relativePath && (relativePath.startsWith('http://') || relativePath.startsWith('https://'))) {
        return relativePath;
      }
      
      if (relativePath && relativePath.startsWith('/')) {
        return `${API_BASE_URL}${relativePath}`;
      }
      
      return relativePath;
    };
    
    // State
    const isMobile = ref(false);
    const showUserMenu = ref(false);
    const userRole = ref('');
    const isAuthenticated = ref(false);
    const userName = ref('');
    const userAvatar = ref('/default-avatar.png');
    
    // Notification state
    const notificationCount = ref(0);
    const showNotificationDropdown = ref(false);
    const recentNotifications = ref([]);
    const loadingNotifications = ref(false);
    const notificationRef = ref(null);
    
    // Get route and router
    const route = useRoute();
    const router = useRouter();
    
    // Check if navigation should be shown based on route
    const shouldShowNav = computed(() => {
      const hiddenRoutes = ['/', '/login', '/register', '/register/client', '/register/provider', '/verify-email'];
      return !hiddenRoutes.includes(route.path);
    });
    
    // Handle window resize for responsive design
    const checkIfMobile = () => {
      isMobile.value = window.innerWidth < 768;
    };
    
    // Toggle user dropdown menu
    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value;
      // Close notification dropdown if open
      if (showNotificationDropdown.value) {
        showNotificationDropdown.value = false;
      }
    };
    
    // Toggle notification dropdown
    const toggleNotificationDropdown = () => {
      showNotificationDropdown.value = !showNotificationDropdown.value;
      // Close user menu if open
      if (showUserMenu.value) {
        showUserMenu.value = false;
      }
      // Fetch recent notifications if showing dropdown
      if (showNotificationDropdown.value) {
        fetchRecentNotifications();
      }
    };
    
    // Format notification count (e.g., 99+ for large numbers)
    const formatCount = (count) => {
      return count > 99 ? '99+' : count;
    };
    
    // Get notification icon based on type
    const getNotificationIcon = (type) => {
      const iconMap = {
        'BOOKING_REQUEST': 'fas fa-calendar-plus',
        'BOOKING_CONFIRMED': 'fas fa-calendar-check',
        'BOOKING_CANCELLED': 'fas fa-calendar-times',
        'PAYMENT_RECEIVED': 'fas fa-money-bill-wave',
        'NEW_MESSAGE': 'fas fa-envelope',
        'REVIEW_RECEIVED': 'fas fa-star',
        'SERVICE_COMPLETED': 'fas fa-check-circle',
        'CONTRACT_SIGNED': 'fas fa-file-signature',
        'GENERAL': 'fas fa-bell'
      };
      
      return iconMap[type] || 'fas fa-bell';
    };
    
    // Format time for notifications
    const formatTime = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) {
        return 'Just now';
      } else if (diffMin < 60) {
        return `${diffMin}m ago`;
      } else if (diffHour < 24) {
        return `${diffHour}h ago`;
      } else if (diffDay < 7) {
        return `${diffDay}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    };
    
    // Fetch notification count from API
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        console.log('Fetching notification count');
        
        const result = await notificationService.getUnreadCount();
        
        if (result.success) {
          notificationCount.value = result.data.count || 0;
          console.log('Updated notification count to:', notificationCount.value);
        } else {
          console.error('Notification count API returned success: false');
          throw new Error(result.message || 'Failed to fetch notification count');
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
        // Default to 0 on error
        notificationCount.value = 0;
      }
    };
    
    // Fetch recent notifications for dropdown
    const fetchRecentNotifications = async () => {
      try {
        loadingNotifications.value = true;
        
        console.log('Fetching recent notifications');
        
        const result = await notificationService.getNotifications(1, 5);
        
        if (result.success) {
          recentNotifications.value = result.data.notifications || [];
          console.log('Updated recent notifications, count:', recentNotifications.value.length);
        } else {
          console.error('Recent notifications API returned success: false');
          throw new Error(result.message || 'Failed to fetch notifications');
        }
      } catch (error) {
        console.error('Error fetching recent notifications:', error);
        recentNotifications.value = [];
      } finally {
        loadingNotifications.value = false;
      }
    };
    
    // Handle notification click
    const viewNotification = async (notification) => {
      try {
        // Mark notification as read
        if (!notification.isRead) {
          const result = await notificationService.markAsRead(notification.id);
          
          if (result.success) {
            // Update notification count
            notificationCount.value = Math.max(0, notificationCount.value - 1);
            
            // Update the notification in the list
            const index = recentNotifications.value.findIndex(n => n.id === notification.id);
            if (index !== -1) {
              recentNotifications.value[index].isRead = true;
            }
          }
        }
        
        // Close dropdown
        showNotificationDropdown.value = false;
        
        // Navigate based on notification type
        if (notification.data) {
          try {
            const data = typeof notification.data === 'string' 
              ? JSON.parse(notification.data) 
              : notification.data;
            
            switch (notification.type) {
              case 'BOOKING_REQUEST':
              case 'BOOKING_CONFIRMED':
              case 'BOOKING_CANCELLED':
                if (data.bookingId) {
                  if (userRole.value === 'PROVIDER') {
                    router.push(`/provider/bookings/${data.bookingId}`);
                  } else {
                    router.push(`/client/bookings/${data.bookingId}`);
                  }
                }
                break;
                
              case 'NEW_MESSAGE':
                if (data.conversationId) {
                  router.push(`/messages/${data.conversationId}`);
                }
                break;
                
              case 'REVIEW_RECEIVED':
                if (userRole.value === 'PROVIDER') {
                  router.push('/provider/reviews');
                } else {
                  router.push('/client/reviews');
                }
                break;
                
              case 'CONTRACT_SIGNED':
                if (data.contractId) {
                  if (userRole.value === 'PROVIDER') {
                    router.push(`/provider/contracts/${data.contractId}`);
                  } else {
                    router.push(`/client/contracts/${data.contractId}`);
                  }
                }
                break;
                
              default:
                router.push('/notifications');
                break;
            }
          } catch (err) {
            console.error('Error parsing notification data:', err);
            router.push('/notifications');
          }
        } else {
          router.push('/notifications');
        }
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    };
    
    // Close dropdown when clicking elsewhere
    const handleClickOutside = (event) => {
      if (showUserMenu.value && !event.target.closest('.user-profile')) {
        showUserMenu.value = false;
      }
      
      if (showNotificationDropdown.value && notificationRef.value && !notificationRef.value.contains(event.target)) {
        showNotificationDropdown.value = false;
      }
    };
    
    // Log out the user
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      showUserMenu.value = false;
      router.push('/login');
    };
    
    // Get user data from local storage
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        isAuthenticated.value = true;
        userRole.value = localStorage.getItem('userRole') || '';
        
        try {
          // Fetch user details based on role
          if (userRole.value === 'CLIENT') {
            const response = await clientService.getClientProfile();
            if (response.success) {
              const userData = response.data;
              userName.value = `${userData.user.firstName} ${userData.user.lastName}`;
              
              // Handle profile picture
              if (userData.user.profilePicture) {
                userAvatar.value = getFileUrl(userData.user.profilePicture);
              }
            }
          } else if (userRole.value === 'PROVIDER') {
            const response = await providerService.getProviderProfile();
            if (response.success) {
              const userData = response.data;
              userName.value = `${userData.firstName} ${userData.lastName}`;
              
              // Handle profile picture
              if (userData.profilePicture) {
                userAvatar.value = getFileUrl(userData.profilePicture);
              }
            }
          } else {
            userName.value = 'User';
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          userName.value = 'User';
        }
        
        // Fetch notification count
        fetchNotificationCount();
      } else {
        isAuthenticated.value = false;
        userRole.value = '';
      }
    };
    
    // Setup polling for notification count
    let notificationInterval;
    const startNotificationPolling = () => {
      if (isAuthenticated.value) {
        // Poll every 30 seconds
        notificationInterval = setInterval(fetchNotificationCount, 30000);
      }
    };
    
    // Watch for route changes to update user data
    watch(() => route.path, () => {
      loadUserData();
    });
    
    // Setup on component mount
    onMounted(() => {
      loadUserData();
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      document.addEventListener('click', handleClickOutside);
      startNotificationPolling();
    });
    
    // Cleanup on component unmount
    onUnmounted(() => {
      window.removeEventListener('resize', checkIfMobile);
      document.removeEventListener('click', handleClickOutside);
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
    });
    
    return {
      isMobile,
      showUserMenu,
      userRole,
      isAuthenticated,
      userName,
      userAvatar,
      shouldShowNav,
      toggleUserMenu,
      handleLogout,
      
      // Notification related
      notificationCount,
      showNotificationDropdown,
      recentNotifications,
      loadingNotifications,
      notificationRef,
      toggleNotificationDropdown,
      formatCount,
      getNotificationIcon,
      formatTime,
      viewNotification,
      getFileUrl
    };
  }
};
</script>

<style scoped>
/* Common styles */
.navigation-container {
  width: 100%;
  background: linear-gradient(135deg, #00C853 0%, #009688 100%);
  color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Space between logo and right content */
  width: 100%; /* Full width */
  padding: 0; /* Remove padding */
  height: 80px;
}

.logo {
  padding-left: 30px; /* Add padding to logo container instead */
}

/* Right side content container */
.right-content {
  display: flex;
  align-items: center;
  gap: 10px; /* Reduced from 20px to create more consistent spacing */
  padding-right: 30px; /* Add padding to right content */
}

.logo img {
  height: 50px;
  margin: 15px 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  transition: transform 0.3s ease;
}

.logo img:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 10px; /* Added specific gap instead of relying on nav-item margins */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  margin: 0; /* Removed 0 5px margin to use parent's gap instead */
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.nav-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 22px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: transform 0.3s;
}

.nav-item:hover .icon {
  transform: scale(1.1);
  background-color: rgba(255, 255, 255, 0.2);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 10px; /* Added specific gap property */
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 8px 15px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 40px;
  margin-left: 0; /* Removed the 15px margin */
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-profile:hover {
  background-color: rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.username {
  font-weight: 500;
}

.dropdown-icon {
  margin-left: 10px;
  font-size: 14px;
  opacity: 0.8;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  min-width: 220px;
  z-index: 1001;
  margin-top: 10px;
  overflow: hidden;
  transform-origin: top right;
  animation: dropdownFadeIn 0.2s forwards;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #757575;
  margin-right: 12px;
  font-size: 20px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dropdown-item i {
  width: 24px;
  text-align: center;
  margin-right: 10px;
  font-size: 16px;
  color: #666;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-divider {
  height: 1px;
  background-color: #eeeeee;
  margin: 5px 0;
}

.logout {
  color: #f44336;
  cursor: pointer;
}

.logout i {
  color: #f44336;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn {
  color: white;
  border: 2px solid white;
  background-color: transparent;
}

.login-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.register-btn {
  background-color: white;
  color: #00C853;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Notifications styles */
.notification-wrapper {
  position: relative;
  cursor: pointer;
}

.notification-icon {
  position: relative;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 45px;
  width: 45px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s;
}

.notification-wrapper:hover .notification-icon {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ff5252;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid #00C853;
  transform: translate(25%, -25%);
}

.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: -100px;
  width: 320px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  margin-top: 15px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: dropdownFadeIn 0.2s forwards;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.notifications-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.view-all {
  font-size: 14px;
  color: #00C853;
  text-decoration: none;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-all:hover {
  background-color: rgba(0, 200, 83, 0.1);
}

.notifications-loading {
  display: flex;
  justify-content: center;
  padding: 30px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 200, 83, 0.1);
  border-top: 3px solid #00C853;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-notifications {
  padding: 30px;
  text-align: center;
  color: #757575;
  font-size: 15px;
}

.recent-notifications {
  overflow-y: auto;
  max-height: 320px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.notification-item:hover {
  background-color: #f9f9f9;
}

.notification-item.unread {
  background-color: #e8f5e9;
}

.notification-mini-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e8f5e9;
  color: #00C853;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.notification-item.unread .notification-mini-icon {
  background-color: #00C853;
  color: white;
}

.notification-title {
  font-size: 15px;
  margin-bottom: 5px;
  font-weight: 500;
}

.notification-time {
  font-size: 13px;
  color: #757575;
}

/* Mobile responsive styles */
@media (max-width: 767px) {
  .navigation-container {
    position: fixed;
    bottom: 0;
    top: auto;
    background: linear-gradient(to right, #00C853, #009688);
  }
  
  .nav-content {
    flex-direction: column-reverse;
    height: auto;
    padding: 10px;
  }
  
  .right-content {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-links {
    width: 100%;
    justify-content: space-around;
    order: 2;
  }
  
  .user-actions {
    width: 100%;
    justify-content: flex-end;
    margin-bottom: 10px;
  }
  
  .user-profile {
    margin-left: 0;
  }
  
  .notifications-dropdown {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 60px;
    width: 100%;
    max-height: none;
    margin-top: 0;
    border-radius: 0;
  }
  
  .recent-notifications {
    max-height: calc(100% - 50px);
  }
  
  .nav-item {
    flex-direction: column;
    padding: 8px;
    margin: 0;
  }
  
  .nav-item span {
    font-size: 12px;
    margin-top: 5px;
  }
  
  .icon {
    margin-right: 0;
    height: 36px;
    width: 36px;
  }
}
</style>
