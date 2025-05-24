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
          <router-link to="/register/client" class="option-btn client-btn">
            Register as Client
          </router-link>
        </div>
        
        <div class="option-card" @click="selectOption('provider')">
          <div class="option-icon provider-icon">
            <i class="fas fa-briefcase"></i>
          </div>
          <h3>I provide services</h3>
          <p>Offer your skills and connect with clients</p>
          <router-link to="/register/provider" class="option-btn provider-btn">
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
  background: linear-gradient(135deg, #106e40 0%, #38b676 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-option-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  opacity: 0.1;
}

.register-option-card {
  width: 100%;
  max-width: 900px;
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

.option-selection {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30px;
  margin: 20px 0;
}

.option-card {
  flex: 1;
  min-width: 280px;
  background-color: #f8fafc;
  border-radius: 16px;
  padding: 35px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.option-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: transform 0.3s ease;
}

.option-card:first-child::before {
  background-color: #8cc63f;
  transform: scaleY(0);
  transform-origin: bottom;
}

.option-card:last-child::before {
  background-color: #38b676;
  transform: scaleY(0);
  transform-origin: bottom;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.option-card:first-child:hover::before,
.option-card:last-child:hover::before {
  transform: scaleY(1);
}

.option-icon {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  color: white;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.option-icon::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  z-index: -1;
  transform: scale(0);
  border-radius: 50%;
  transition: transform 0.5s;
}

.option-card:hover .option-icon::after {
  transform: scale(1.5);
}

.client-icon {
  background-color: #8cc63f;
}

.provider-icon {
  background-color: #38b676;
}

.option-card h3 {
  color: #106e40;
  margin-bottom: 16px;
  font-size: 1.4rem;
  font-weight: 600;
}

.option-card p {
  color: #718096;
  margin-bottom: 30px;
  line-height: 1.6;
}

.option-btn {
  display: inline-block;
  background-color: #106e40;
  color: white;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.client-btn {
  background-color: #8cc63f;
}

.provider-btn {
  background-color: #38b676;
}

.option-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.client-btn:hover {
  background-color: #7db32f;
}

.provider-btn:hover {
  background-color: #2ea066;
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

@media (max-width: 768px) {
  .option-selection {
    flex-direction: column;
  }
  
  .option-card {
    margin-bottom: 20px;
  }
}
</style>
