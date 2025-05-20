<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo">
        <img src="../assets/logo.png" alt="ServiceLink Logo" />
      </div>
      <h2>Login to Your Account</h2>
      
      <form @submit.prevent="handleLogin">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            placeholder="Enter your password"
          />
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.logo {
  text-align: center;
  margin-bottom: 20px;
}

.logo img {
  max-width: 100px;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  text-align: left;
  margin-bottom: 5px;
  color: #2c3e50;
  font-weight: bold;
}

input {
  width: 100%;
  box-sizing: border-box;
}

.form-actions {
  margin-top: 30px;
}

.form-actions button {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
}

.auth-footer a {
  color: #2196F3;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>
