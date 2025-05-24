<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo">
        <img src="../assets/logo.png" alt="ServiceLink Logo" />
      </div>
      <h2>Login to Your Account</h2>
      <p class="subtitle">Welcome back! Please enter your credentials</p>
      
      <form @submit.prevent="handleLogin">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <div class="input-container">
            <span class="input-icon">✉️</span>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              required
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-container">
            <span class="input-icon">🔒</span>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              required
              placeholder="Enter your password"
            />
          </div>
          <div class="forgot-password">
            <router-link to="/forgot-password">Forgot password?</router-link>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="primary-btn" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
      </form>
      
      <div class="auth-footer">
        <p>Don't have an account? <router-link to="/register">Register</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/apiService';

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    const handleLogin = async () => {
      error.value = '';
      loading.value = true;
      
      try {
        const response = await authService.login(email.value, password.value);
        
        if (response.success) {
          // Store token in local storage
          localStorage.setItem('token', response.data.token);
          
          // Store user role in local storage
          localStorage.setItem('userRole', response.data.user.role);
          
          // Redirect based on user role
          if (response.data.user.role === 'CLIENT') {
            router.push('/client/dashboard');
          } else if (response.data.user.role === 'PROVIDER') {
            router.push('/provider/dashboard');
          } else {
            router.push('/admin/dashboard');
          }
        } else {
          error.value = response.message || 'Login failed';
        }
      } catch (err) {
        error.value = err.message || 'An error occurred during login';
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      error,
      loading,
      handleLogin
    };
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #106e40 0%, #38b676 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.auth-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.1;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  padding: 40px;
  position: relative;
  z-index: 1;
}

.logo {
  text-align: center;
  margin-bottom: 24px;
}

.logo img {
  max-width: 120px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1));
}

h2 {
  text-align: center;
  color: #106e40;
  font-size: 1.8rem;
  margin-bottom: 8px;
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: #718096;
  margin-bottom: 32px;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

label {
  display: block;
  text-align: left;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
}

.input-container {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 1rem;
}

input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #38b676;
  box-shadow: 0 0 0 3px rgba(56, 182, 118, 0.1);
}

.forgot-password {
  text-align: right;
  margin-top: 8px;
  font-size: 0.85rem;
}

.forgot-password a {
  color: #38b676;
  text-decoration: none;
  transition: color 0.2s ease;
}

.forgot-password a:hover {
  color: #106e40;
  text-decoration: underline;
}

.form-actions {
  margin-top: 32px;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  background-color: #106e40;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover:not(:disabled) {
  background-color: #0c5730;
  box-shadow: 0 4px 10px rgba(16, 110, 64, 0.2);
}

.primary-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 32px;
  color: #718096;
  font-size: 0.95rem;
}

.auth-footer a {
  color: #38b676;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.auth-footer a:hover {
  color: #106e40;
  text-decoration: underline;
}

.error-message {
  background-color: #fff5f5;
  color: #e53e3e;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: "⚠️";
  margin-right: 8px;
  font-size: 1.1rem;
}
</style>
