<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo">
        <img src="../assets/logo.png" alt="ServiceLink Logo" />
      </div>
      <h2>Register as Service Provider</h2>
      <p class="subtitle">Create an account to offer your services</p>
      
      <div v-if="showVerification" class="verification-section">
        <h3>Verify Your Email</h3>
        <p>Please verify your email address to complete registration. Your provider account will be reviewed by an admin for verification.</p>
        <EmailVerificationInput 
          :email="formData.email"
          @verification-success="handleVerificationSuccess"
          @verification-error="handleVerificationError"
        />
      </div>

      <form v-else @submit.prevent="handleRegister">
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="formData.firstName" 
              required
              placeholder="Enter your first name"
            />
          </div>
          
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="formData.lastName" 
              required
              placeholder="Enter your last name"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email" 
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="formData.phone" 
            placeholder="Enter your phone number (optional)"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password" 
            required
            placeholder="Create a password"
            minlength="8"
          />
          <small class="password-hint">Password must be at least 8 characters long</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required
            placeholder="Confirm your password"
            minlength="8"
          />
        </div>
        
        <div class="form-group">
          <label for="idDocument">ID Document (Required for verification)</label>
          <input 
            type="file" 
            id="idDocument" 
            @change="handleFileChange"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />
          <small class="file-hint">Accepted formats: JPG, PNG, PDF, DOC (Max size: 10MB)</small>
        </div>
        
        <div class="form-group form-checkbox">
          <input 
            type="checkbox" 
            id="terms" 
            v-model="acceptTerms" 
            required
          />
          <label for="terms">I agree to the <a href="/terms" target="_blank">Terms and Conditions</a></label>
        </div>
        
        <div class="form-group form-checkbox">
          <input 
            type="checkbox" 
            id="verification" 
            v-model="acceptVerification" 
            required
          />
          <label for="verification">I understand that my account requires verification before I can offer services</label>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="primary-btn" :disabled="loading || !acceptTerms || !acceptVerification">
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </div>
      </form>
      
      <div class="auth-footer">
        <p>Already have an account? <router-link to="/login">Login</router-link></p>
        <p>Want to register as a client? <router-link to="/register/client">Client Registration</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { providerService, authService } from '../services/apiService';
import EmailVerificationInput from './EmailVerificationInput.vue';

export default {
  name: 'RegisterProvider',
  components: {
    EmailVerificationInput
  },
  setup() {
    const router = useRouter();
    const formData = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    });
    const idDocument = ref(null);
    const confirmPassword = ref('');
    const acceptTerms = ref(false);
    const acceptVerification = ref(false);
    const error = ref('');
    const success = ref('');
    const loading = ref(false);
    const showVerification = ref(false);

    const handleFileChange = (event) => {
      idDocument.value = event.target.files[0];
      
      // Simple file validation
      if (idDocument.value) {
        const fileSize = idDocument.value.size / 1024 / 1024; // size in MB
        if (fileSize > 10) {
          error.value = 'File size exceeds 10MB limit';
          idDocument.value = null;
          event.target.value = null;
        }
      }
    };

    const handleRegister = async () => {
      // Reset messages
      error.value = '';
      success.value = '';
      
      // Validate passwords match
      if (formData.password !== confirmPassword.value) {
        error.value = 'Passwords do not match';
        return;
      }

      // Check if ID document is provided
      if (!idDocument.value) {
        error.value = 'ID document is required for verification';
        return;
      }

      loading.value = true;
      
      try {
        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('email', formData.email);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        if (formData.phone) formDataToSend.append('phone', formData.phone);
        formDataToSend.append('idDocument', idDocument.value);
        
        const response = await providerService.registerProvider(formDataToSend);
        
        if (response.success) {
          success.value = 'Registration successful! Please verify your email.';
          showVerification.value = true;
        } else {
          error.value = response.message || 'Registration failed';
        }
      } catch (err) {
        error.value = err.message || 'An error occurred during registration';
      } finally {
        loading.value = false;
      }
    };

    const handleVerificationSuccess = async () => {
      try {
        // Attempt to login after successful verification
        const loginResponse = await authService.login(formData.email, formData.password);
        if (loginResponse.success) {
          // Store the token
          localStorage.setItem('token', loginResponse.data.token);
          // Redirect to home page with a message about pending admin verification
          router.push({
            path: '/',
            query: { message: 'Your account is pending admin verification. You will be notified when your account is approved.' }
          });
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auto-login failed:', err);
        router.push('/login');
      }
    };

    const handleVerificationError = (errorMessage) => {
      error.value = errorMessage;
    };

    return {
      formData,
      confirmPassword,
      acceptTerms,
      acceptVerification,
      error,
      success,
      loading,
      showVerification,
      handleFileChange,
      handleRegister,
      handleVerificationSuccess,
      handleVerificationError
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
  max-width: 600px;
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
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 30px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
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

input[type="file"] {
  padding: 8px 0;
}

.form-checkbox {
  display: flex;
  align-items: flex-start;
}

.form-checkbox input {
  width: auto;
  margin-right: 10px;
  margin-top: 5px;
}

.form-checkbox label {
  font-weight: normal;
  margin-bottom: 0;
}

.password-hint, .file-hint {
  display: block;
  margin-top: 5px;
  color: #7f8c8d;
  font-size: 0.8rem;
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

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}

.verification-section {
  text-align: center;
  padding: 20px 0;
}

.verification-section h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.verification-section p {
  color: #7f8c8d;
  margin-bottom: 20px;
}
</style>
