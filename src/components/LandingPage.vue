<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <img src="../assets/logo.png" alt="ServiceLink Logo" class="hero-logo" />
        <h1>Find Expert Services<br/>For Any Need</h1>
        <p class="hero-tagline">Connect with top-rated professionals in your area</p>
        <div class="hero-actions">
          <router-link to="/login" class="primary-btn">Find Services</router-link>
          <router-link to="/register" class="outline-btn">Join as Provider</router-link>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="categories">
      <div class="container">
        <div class="section-header">
          <h2>Explore Our Services</h2>
          <p class="section-subtitle">Discover professionals across various categories</p>
        </div>
        <div class="categories-grid">
          <div v-for="category in categories" :key="category.name" class="category-card">
            <div class="category-icon">{{ category.icon }}</div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.description }}</p>
            <router-link to="/login" class="category-link">Explore →</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Providers Section -->
    <section class="featured-providers">
      <div class="container">
        <div class="section-header">
          <h2>Featured Professionals</h2>
          <p class="section-subtitle">Work with the best talent in their field</p>
        </div>
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
        </div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <div v-else class="providers-grid">
          <div v-for="provider in providers" :key="provider.id" class="provider-card">
            <div class="provider-image">
              <img :src="provider.profilePicture || '../assets/default-avatar.png'" :alt="provider.name">
            </div>
            <div class="provider-info">
              <h3>{{ provider.name }}</h3>
              <p class="provider-headline">{{ provider.headline || 'Professional Service Provider' }}</p>
              <div class="provider-skills">
                <span v-for="(skill, index) in provider.skills.slice(0, 3)" :key="index" class="skill-tag">
                  {{ skill.name }}
                </span>
              </div>
              <div class="provider-footer">
                <div class="rating">
                  <span class="stars">★ {{ provider.rating?.toFixed(1) || '0.0' }}</span>
                  <span class="review-count">({{ provider.reviewCount || '0' }} reviews)</span>
                </div>
                <router-link :to="'/provider/' + provider.id" class="view-profile">View Profile</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { providerService } from '../services/apiService';

export default {
  name: 'LandingPage',
  setup() {
    const categories = ref([
      { name: 'Home Services', icon: '🏠', description: 'Expert maintenance & repairs for your home' },
      { name: 'Professional', icon: '💼', description: 'Business & consulting services' },
      { name: 'Health & Wellness', icon: '💪', description: 'Personal trainers & healthcare experts' },
      { name: 'Education', icon: '📚', description: 'Professional tutoring & courses' },
      { name: 'Creative', icon: '🎨', description: 'Design & creative services' },
      { name: 'Tech Support', icon: '💻', description: 'IT & technical assistance' },
    ]);
    const providers = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchProviders = async () => {
      try {
        loading.value = true;
        const response = await providerService.searchProviders({}, { limit: 6 });
        if (response.success) {
          providers.value = response.data.providers;
        } else {
          error.value = response.message || 'Failed to load providers';
        }
      } catch (err) {
        error.value = 'An error occurred while loading providers';
        console.error('Error fetching providers:', err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchProviders();
    });

    return {
      providers,
      loading,
      error,
      categories
    };
  }
};
</script>

<style scoped>
.landing-page {
  background-color: #f8fafc;
  min-height: 100vh;
}

/* Hero Section */
.hero {
  position: relative;
  background: linear-gradient(135deg, #1a365d 0%, #2b6cb0 50%, #4299e1 100%);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 24px;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* background: url('path-to-pattern.png') repeat; */
  opacity: 0.1;
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  color: white;
}

.hero-logo {
  width: 100px;
  margin-bottom: 40px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-tagline {
  font-size: 1.5rem;
  margin-bottom: 40px;
  opacity: 0.9;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.primary-btn, .outline-btn {
  padding: 16px 40px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  text-decoration: none;
}

.primary-btn {
  background-color: white;
  color: #2b6cb0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.outline-btn {
  border: 2px solid rgba(255, 255, 255, 0.8);
  color: white;
}

.outline-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* Sections Common Styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a365d;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #4a5568;
}

/* Categories Section */
.categories {
  padding: 100px 0;
  background-color: white;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.category-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.category-icon {
  font-size: 3rem;
  margin-bottom: 24px;
  display: inline-block;
}

.category-card h3 {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: #2d3748;
  font-weight: 600;
}

.category-card p {
  color: #4a5568;
  margin-bottom: 24px;
  line-height: 1.6;
}

.category-link {
  color: #2b6cb0;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.category-link:hover {
  color: #1a365d;
}

/* Featured Providers Section */
.featured-providers {
  padding: 100px 0;
  background-color: #f8fafc;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.provider-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.provider-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.provider-image {
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.provider-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.provider-card:hover .provider-image img {
  transform: scale(1.05);
}

.provider-info {
  padding: 24px;
}

.provider-info h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
}

.provider-headline {
  color: #4a5568;
  margin-bottom: 16px;
  line-height: 1.5;
}

.provider-skills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.skill-tag {
  background-color: #ebf4ff;
  color: #2b6cb0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.provider-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars {
  color: #f6ad55;
  font-weight: 600;
}

.review-count {
  color: #718096;
  font-size: 0.9rem;
}

.view-profile {
  color: #2b6cb0;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.view-profile:hover {
  color: #1a365d;
}

/* Loading and Error States */
.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  border: 4px solid #e2e8f0;
  border-top: 4px solid #2b6cb0;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.error-message {
  text-align: center;
  color: #e53e3e;
  padding: 40px;
  background-color: #fff5f5;
  border-radius: 12px;
  margin: 20px 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .hero-tagline {
    font-size: 1.2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .primary-btn, .outline-btn {
    width: 100%;
    text-align: center;
  }

  .section-header h2 {
    font-size: 2rem;
  }

  .categories-grid, .providers-grid {
    grid-template-columns: 1fr;
  }

  .category-card, .provider-card {
    margin: 0 16px;
  }
}
</style>
