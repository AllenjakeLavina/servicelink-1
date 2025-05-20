<template>
  <div class="register-option-container">
    <div class="register-option-card">
      <div class="logo">
        <img src="../assets/logo.png" alt="ServiceLink Logo" />
      </div>
      <h2>Join ServiceLink</h2>
      <p class="subtitle">Choose how you want to use ServiceLink</p>
      
      <div class="option-selection">
        <div class="option-card" @click="selectOption('client')">
          <div class="option-icon client-icon">
            <i class="fas fa-user"></i>
          </div>
          <h3>I need a service</h3>
          <p>Find and book services from trusted professionals</p>
          <router-link to="/register/client" class="option-btn">
            Register as Client
          </router-link>
        </div>
        
        <div class="option-card" @click="selectOption('provider')">
          <div class="option-icon provider-icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <h3>I provide services</h3>
          <p>Offer your skills and connect with clients</p>
          <router-link to="/register/provider" class="option-btn">
            Register as Provider
          </router-link>
        </div>
      </div>
      
      <div class="auth-footer">
        <p>Already have an account? <router-link to="/login">Login</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'RegisterOption',
  setup() {
    const router = useRouter();

    const selectOption = (type) => {
      if (type === 'client') {
        router.push('/register/client');
      } else {
        router.push('/register/provider');
      }
    };

    return {
      selectOption
    };
  }
};
</script>

<style scoped>
.register-option-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.register-option-card {
  width: 100%;
  max-width: 800px;
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

.option-selection {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.option-card {
  flex: 1;
  min-width: 280px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.option-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
}

.client-icon {
  background-color: #4CAF50;
}

.provider-icon {
  background-color: #2196F3;
}

.option-card h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.option-card p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.option-btn {
  display: inline-block;
  background-color: #2c3e50;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;
}

.option-btn:hover {
  background-color: #1a252f;
}

.auth-footer {
  text-align: center;
  margin-top: 30px;
}

.auth-footer a {
  color: #2196F3;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
