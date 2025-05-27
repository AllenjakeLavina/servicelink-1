<template>
  <div class="provider-profile">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>Provider Profile</h1>
      
      <!-- Profile Tabs Navigation -->
      <div class="profile-tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <i :class="tab.icon"></i> {{ tab.name }}
        </div>
      </div>
      
      <!-- Personal Information Tab -->
      <div v-show="activeTab === 'personal'" class="tab-content section">
        <h2>Personal Information</h2>
        <div v-if="!editingPersonal" class="profile-info">
          <div class="profile-header">
            <div class="profile-picture-container">
              <div v-if="profile.profilePicture" class="profile-picture">
                <img :src="getFullFileUrl(profile.profilePicture)" alt="Profile Picture" />
              </div>
              <div v-else class="profile-picture placeholder-img">
                <i class="fas fa-user"></i>
              </div>
              
              <!-- Add upload overlay and functionality -->
              <div class="profile-picture-overlay" @click="triggerFileUpload">
                <i class="fas fa-camera"></i>
                <span>Change Photo</span>
              </div>
              
              <!-- Hidden file input -->
              <input 
                type="file" 
                ref="profileImageInput" 
                @change="handleProfileImageChange" 
                accept="image/*" 
                class="hidden-input" 
              />
              
              <!-- Upload progress indicator -->
              <div v-if="uploadingProfileImage" class="upload-progress">
                <div class="spinner"></div>
              </div>
            </div>
            
            <div class="profile-actions">
              <button class="edit-btn" @click="toggleEditPersonal">
                <i class="fas fa-edit"></i> Edit Profile
              </button>
            </div>
          </div>
          
          <div class="profile-details">
            <div class="detail-item">
              <h3>Basic Info</h3>
              <p><strong>Name:</strong> {{ profile.firstName || '' }} {{ profile.lastName || '' }}</p>
              <p><strong>Email:</strong> {{ profile.email || '' }}</p>
              <p><strong>Phone:</strong> {{ profile.phone || '' }}</p>
            </div>
            
            <div class="detail-item">
              <h3>Professional Info</h3>
              <p><strong>Headline:</strong> {{ profile.serviceProvider?.headline || '' }}</p>
              <p><strong>Hourly Rate:</strong> ${{ profile.serviceProvider?.hourlyRate || 0 }}/hr</p>
            </div>
            
            <div class="detail-item">
              <h3>Bio</h3>
              <p class="bio-text">{{ profile.serviceProvider?.bio || '' }}</p>
            </div>
          </div>
        </div>
        
        <form v-else @submit.prevent="updatePersonalInfo" class="edit-form">
          <div class="form-group">
            <label>First Name:</label>
            <input v-model.trim="personalForm.firstName" required />
          </div>
          <div class="form-group">
            <label>Last Name:</label>
            <input v-model.trim="personalForm.lastName" required />
          </div>
          <div class="form-group">
            <label>Phone:</label>
            <input v-model.trim="personalForm.phone" />
          </div>
          <div class="form-group">
            <label>Hourly Rate ($):</label>
            <input type="number" v-model.number="personalForm.hourlyRate" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Headline:</label>
            <input v-model.trim="personalForm.headline" placeholder="Short professional headline (e.g., Experienced Web Developer)" />
          </div>
          <div class="form-group">
            <label>Bio:</label>
            <textarea v-model.trim="personalForm.bio" rows="4" placeholder="Tell clients about yourself, your skills, and experience"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">Save</button>
            <button type="button" class="cancel-btn" @click="toggleEditPersonal">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Work Experience Tab -->
      <div v-show="activeTab === 'experience'" class="tab-content section">
        <div class="section-header">
          <h2>Work Experience</h2>
          <button v-if="!addingExperience" @click="toggleAddExperience" class="add-btn">
            <i class="fas fa-plus"></i> Add Experience
          </button>
        </div>
        
        <div v-if="addingExperience" class="add-section">
          <form @submit.prevent="addExperience" class="add-form">
            <div class="form-group">
              <label>Company:</label>
              <input v-model="experienceForm.company" required />
            </div>
            <div class="form-group">
              <label>Position:</label>
              <input v-model="experienceForm.position" required />
            </div>
            <div class="form-group">
              <label>Start Date:</label>
              <input type="date" v-model="experienceForm.startDate" required />
            </div>
            <div class="form-group">
              <label>Current Position:</label>
              <input type="checkbox" v-model="experienceForm.isCurrentPosition" />
            </div>
            <div v-if="!experienceForm.isCurrentPosition" class="form-group">
              <label>End Date:</label>
              <input type="date" v-model="experienceForm.endDate" :required="!experienceForm.isCurrentPosition" />
            </div>
            <div class="form-group">
              <label>Description:</label>
              <textarea v-model="experienceForm.description" rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn">Save</button>
              <button type="button" class="cancel-btn" @click="toggleAddExperience">Cancel</button>
            </div>
          </form>
        </div>
        
        <div v-if="profile.serviceProvider?.workExperience && profile.serviceProvider.workExperience.length > 0" class="experience-list">
          <div v-for="experience in profile.serviceProvider.workExperience" :key="experience.id" class="experience-item">
            <div class="experience-header">
              <h3>{{ experience.position }}</h3>
              <div class="experience-company">{{ experience.company }}</div>
              <div class="experience-dates">
                {{ formatDate(experience.startDate) }} - {{ experience.isCurrentPosition ? 'Present' : formatDate(experience.endDate) }}
              </div>
            </div>
            <p class="experience-description">{{ experience.description }}</p>
          </div>
        </div>
        <div v-else-if="!addingExperience" class="no-data">
          <p>No work experience added yet.</p>
          <p>Add work experience to showcase your professional history to potential clients.</p>
        </div>
      </div>

      <!-- Education Tab -->
      <div v-show="activeTab === 'education'" class="tab-content section">
        <div class="section-header">
          <h2>Education</h2>
          <button v-if="!addingEducation" @click="toggleAddEducation" class="add-btn">
            <i class="fas fa-plus"></i> Add Education
          </button>
        </div>
        
        <div v-if="addingEducation" class="add-section">
          <form @submit.prevent="addEducation" class="add-form">
            <div class="form-group">
              <label>Institution:</label>
              <input v-model="educationForm.institution" required />
            </div>
            <div class="form-group">
              <label>Degree:</label>
              <input v-model="educationForm.degree" required />
            </div>
            <div class="form-group">
              <label>Field of Study:</label>
              <input v-model="educationForm.fieldOfStudy" />
            </div>
            <div class="form-group">
              <label>Start Date:</label>
              <input type="date" v-model="educationForm.startDate" required />
            </div>
            <div class="form-group">
              <label>Currently Studying:</label>
              <input type="checkbox" v-model="educationForm.isCurrentlyStudying" />
            </div>
            <div v-if="!educationForm.isCurrentlyStudying" class="form-group">
              <label>End Date:</label>
              <input type="date" v-model="educationForm.endDate" :required="!educationForm.isCurrentlyStudying" />
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn">Save</button>
              <button type="button" class="cancel-btn" @click="toggleAddEducation">Cancel</button>
            </div>
          </form>
        </div>
        
        <div v-if="profile.serviceProvider?.education && profile.serviceProvider.education.length > 0" class="education-list">
          <div v-for="edu in profile.serviceProvider.education" :key="edu.id" class="education-item">
            <div class="education-header">
              <h3>{{ edu.degree }}</h3>
              <div class="education-field" v-if="edu.fieldOfStudy">{{ edu.fieldOfStudy }}</div>
              <div class="education-institution">{{ edu.institution }}</div>
              <div class="education-dates">
                {{ formatDate(edu.startDate) }} - {{ edu.isCurrentlyStudying ? 'Present' : formatDate(edu.endDate) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!addingEducation" class="no-data">
          <p>No education history added yet.</p>
          <p>Add your educational background to highlight your qualifications.</p>
        </div>
      </div>

      <!-- Skills Tab -->
      <div v-show="activeTab === 'skills'" class="tab-content section">
        <div class="section-header">
          <h2>Skills</h2>
          <button v-if="!addingSkill" @click="toggleAddSkill" class="add-btn">
            <i class="fas fa-plus"></i> Add Skill
          </button>
        </div>
        
        <div v-if="addingSkill" class="add-section">
          <form @submit.prevent="addSkill" class="add-form">
            <div class="form-group">
              <label>Skill Name:</label>
              <input v-model="skillForm.skillName" required />
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn">Save</button>
              <button type="button" class="cancel-btn" @click="toggleAddSkill">Cancel</button>
            </div>
          </form>
        </div>
        
        <div v-if="profile.serviceProvider?.skills && profile.serviceProvider.skills.length > 0" class="skills-list">
          <span v-for="skill in profile.serviceProvider.skills" :key="skill.id" class="skill-tag">{{ skill.name }}</span>
        </div>
        <div v-else-if="!addingSkill" class="no-data">
          <p>No skills added yet.</p>
          <p>Add skills to help clients find you and understand your expertise.</p>
        </div>
      </div>

      <!-- Portfolio Tab -->
      <div v-show="activeTab === 'portfolio'" class="tab-content section">
        <div class="section-header">
          <h2>Portfolio</h2>
          <button v-if="!addingPortfolio" @click="toggleAddPortfolio" class="add-btn">
            <i class="fas fa-plus"></i> Add Portfolio Item
          </button>
        </div>
        
        <div v-if="addingPortfolio" class="add-section">
          <form @submit.prevent="addPortfolioItem" class="add-form" enctype="multipart/form-data">
            <div class="form-group">
              <label>Title:</label>
              <input v-model="portfolioForm.title" required />
            </div>
            <div class="form-group">
              <label>Description:</label>
              <textarea v-model="portfolioForm.description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Project URL (optional):</label>
              <input type="url" v-model="portfolioForm.projectUrl" placeholder="https://example.com" />
            </div>
            <div class="form-group">
              <label>Images/Files (up to 5):</label>
              <input type="file" multiple ref="portfolioFilesInput" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt" required />
              <small class="form-hint">Select up to 5 files to showcase your work (images, PDFs, or documents)</small>
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn">Save</button>
              <button type="button" class="cancel-btn" @click="toggleAddPortfolio">Cancel</button>
            </div>
          </form>
        </div>
        
        <div v-if="profile.serviceProvider?.portfolio && profile.serviceProvider.portfolio.length > 0" class="portfolio-grid">
          <div v-for="item in profile.serviceProvider.portfolio" :key="item.id" class="portfolio-item">
            <div class="portfolio-header">
              <h3>{{ item.title }}</h3>
              <a v-if="item.projectUrl" :href="item.projectUrl" target="_blank" class="project-link">
                <i class="fas fa-external-link-alt"></i> View Project
              </a>
            </div>
            <p v-if="item.description" class="portfolio-description">{{ item.description }}</p>
            
            <div class="portfolio-images">
              <div v-if="item.files && item.files.length > 0" class="image-gallery">
                <div v-for="file in item.files" :key="file.id" class="gallery-item" @click="openFileModal(file.fileUrl, item.title, file.fileType)">
                  <!-- Handle image files -->
                  <img v-if="isImageFile(file.fileUrl)" :src="getFullFileUrl(file.fileUrl)" :alt="item.title" />
                  <!-- Handle document files -->
                  <div v-else class="document-preview">
                    <i :class="getFileIcon(file.fileUrl)"></i>
                    <span>{{ getFileName(file.fileUrl) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="no-images">
                <p>No files available for this project</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!addingPortfolio" class="no-data">
          <p>No portfolio items added yet.</p>
          <p>Add portfolio items to showcase your work and projects.</p>
        </div>
      </div>

      <!-- Documents Tab -->
      <div v-show="activeTab === 'documents'" class="tab-content section">
        <div class="section-header">
          <h2>Documents & Verification</h2>
          <button v-if="!addingDocument" @click="toggleAddDocument" class="add-btn">
            <i class="fas fa-plus"></i> Upload Document
          </button>
        </div>
        
        <div class="verification-status">
          <p><strong>Verification Status:</strong> 
            <span :class="verificationStatusClass">{{ verificationStatusText }}</span>
          </p>
        </div>
        
        <div v-if="addingDocument" class="add-section">
          <form @submit.prevent="addDocument" class="add-form" enctype="multipart/form-data">
            <div class="form-group">
              <label>Document Title:</label>
              <input v-model="documentForm.title" required />
            </div>
            <div class="form-group">
              <label>Document Type:</label>
              <select v-model="documentForm.type" required>
                <option value="ID">ID Document</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="LICENSE">License</option>
                <option value="RESUME">Resume</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>File:</label>
              <input type="file" ref="fileInput" required />
            </div>
            <div class="form-actions">
              <button type="submit" class="save-btn">Upload</button>
              <button type="button" class="cancel-btn" @click="toggleAddDocument">Cancel</button>
            </div>
          </form>
        </div>
        
        <div v-if="profile.serviceProvider?.documents && profile.serviceProvider.documents.length > 0" class="documents-list">
          <h3>Uploaded Documents</h3>
          <div v-for="doc in profile.serviceProvider.documents" :key="doc.id" class="document-item">
            <div class="document-info">
              <div class="document-title">
                <strong>{{ doc.title }}</strong> ({{ doc.type }})
              </div>
              <span :class="doc.isVerified ? 'verified' : 'pending'">
                {{ doc.isVerified ? 'Verified' : 'Pending Verification' }}
              </span>
            </div>
            <a @click.prevent="openFileModal(doc.fileUrl, doc.title, doc.type)" class="view-btn">View Document</a>
          </div>
        </div>
        <div v-else-if="!addingDocument" class="no-data">
          <p>No documents uploaded yet.</p>
          <p>Upload identity documents to complete the verification process.</p>
        </div>
      </div>

      <!-- File View Modal -->
      <div v-if="showFileModal" class="file-modal">
        <div class="modal-overlay" @click="closeFileModal"></div>
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ modalFile.title || 'File Preview' }}</h3>
            <button class="close-btn" @click="closeFileModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-content">
            <!-- Image viewer -->
            <img v-if="isImageFile(modalFile.url)" :src="getFullFileUrl(modalFile.url)" :alt="modalFile.title" class="modal-image" />
            
            <!-- PDF viewer -->
            <iframe v-else-if="isPdfFile(modalFile.url)" :src="getFullFileUrl(modalFile.url)" class="modal-document"></iframe>
            
            <!-- Other file types -->
            <div v-else class="modal-file-info">
              <i :class="getFileIcon(modalFile.url)" class="file-icon"></i>
              <p>{{ getFileName(modalFile.url) }}</p>
              <a :href="getFullFileUrl(modalFile.url)" target="_blank" class="download-btn">
                <i class="fas fa-download"></i> Open File
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { providerService } from '../../services/apiService';
import apiService from '../../services/apiService';

export default {
  name: 'ProviderProfile',
  setup() {
    const profile = ref({});
    const loading = ref(true);
    const error = ref(null);
    const verificationStatus = ref({});
    const activeTab = ref('personal');
    const profileImageInput = ref(null);
    const uploadingProfileImage = ref(false);

    // Tabs configuration
    const tabs = [
      { id: 'personal', name: 'Personal Info', icon: 'fas fa-user' },
      { id: 'experience', name: 'Work Experience', icon: 'fas fa-briefcase' },
      { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap' },
      { id: 'skills', name: 'Skills', icon: 'fas fa-tools' },
      { id: 'portfolio', name: 'Portfolio', icon: 'fas fa-images' },
      { id: 'documents', name: 'Documents', icon: 'fas fa-file-alt' }
    ];

    // UI state
    const editingPersonal = ref(false);
    const addingExperience = ref(false);
    const addingEducation = ref(false);
    const addingSkill = ref(false);
    const addingDocument = ref(false);
    const addingPortfolio = ref(false);

    // Form data
    const personalForm = reactive({
      firstName: '',
      lastName: '',
      phone: '',
      profilePicture: '',
      bio: '',
      headline: '',
      hourlyRate: 0
    });

    const experienceForm = reactive({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrentPosition: false
    });

    const educationForm = reactive({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrentlyStudying: false
    });

    const skillForm = reactive({
      skillName: ''
    });

    const documentForm = reactive({
      title: '',
      type: 'ID'
    });

    const portfolioForm = reactive({
      title: '',
      description: '',
      projectUrl: ''
    });

    // Computed properties
    const verificationStatusText = computed(() => {
      if (!verificationStatus.value) return 'Unknown';
      if (verificationStatus.value.isVerified) return 'Verified';
      if (verificationStatus.value.pendingVerification) return 'Pending Verification';
      return 'Not Verified';
    });

    const verificationStatusClass = computed(() => {
      if (!verificationStatus.value) return 'unknown';
      if (verificationStatus.value.isVerified) return 'verified';
      if (verificationStatus.value.pendingVerification) return 'pending';
      return 'not-verified';
    });

    // Modal state
    const showFileModal = ref(false);
    const modalFile = reactive({
      url: '',
      title: '',
      type: ''
    });

    // Fetch profile data
    const fetchProfileData = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        console.log('Fetching provider profile data...');
        const profileResponse = await providerService.getProviderProfile();
        console.log('Profile response:', profileResponse);
        
        if (profileResponse.success) {
          profile.value = profileResponse.data || {};
          
          // Set default values for form - access properties directly from profile data
          personalForm.firstName = profile.value.firstName || '';
          personalForm.lastName = profile.value.lastName || '';
          personalForm.phone = profile.value.phone || '';
          personalForm.profilePicture = profile.value.profilePicture || '';
          
          // ServiceProvider properties
          personalForm.bio = profile.value.serviceProvider?.bio || '';
          personalForm.headline = profile.value.serviceProvider?.headline || '';
          personalForm.hourlyRate = profile.value.serviceProvider?.hourlyRate || 0;
          
          // Set verification status based on profile data
          verificationStatus.value = {
            isVerified: profile.value.serviceProvider?.isProviderVerified || false,
            hasUploadedDocuments: profile.value.serviceProvider?.documents?.length > 0 || false,
            pendingVerification: !profile.value.serviceProvider?.isProviderVerified && 
                                (profile.value.serviceProvider?.documents?.length > 0 || false)
          };
        } else {
          console.error('Failed to load profile:', profileResponse.message);
          error.value = profileResponse.message || 'Failed to load profile data';
          // Initialize with empty objects
          profile.value = {};
          verificationStatus.value = { isVerified: false, pendingVerification: false };
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        error.value = err.message || 'An error occurred while fetching your profile';
        profile.value = {};
        verificationStatus.value = { isVerified: false, pendingVerification: false };
      } finally {
        loading.value = false;
      }
    };

    // Form handlers
    const toggleEditPersonal = () => {
      editingPersonal.value = !editingPersonal.value;
    };

    const updatePersonalInfo = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // Create the update data object from the form
        const updateData = {
          firstName: personalForm.firstName,
          lastName: personalForm.lastName,
          phone: personalForm.phone,
          bio: personalForm.bio,
          headline: personalForm.headline,
          hourlyRate: personalForm.hourlyRate ? parseFloat(personalForm.hourlyRate) : undefined
        };
        
        console.log('Component: Update data to send:', updateData);
        
        const response = await providerService.updateProviderProfile(updateData);
        console.log('Component: Profile update response:', response);

        if (response.success) {
          // Update local data
          profile.value = response.data;
          editingPersonal.value = false;
        } else {
          throw new Error(response.message || 'Failed to update profile');
        }
      } catch (err) {
        console.error('Component: Error updating profile:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleAddExperience = () => {
      addingExperience.value = !addingExperience.value;
      if (!addingExperience.value) {
        // Reset form
        experienceForm.company = '';
        experienceForm.position = '';
        experienceForm.startDate = '';
        experienceForm.endDate = '';
        experienceForm.description = '';
        experienceForm.isCurrentPosition = false;
      }
    };

    const addExperience = async () => {
      try {
        loading.value = true;
        const response = await providerService.addWorkExperience({
          company: experienceForm.company,
          position: experienceForm.position,
          startDate: experienceForm.startDate,
          endDate: experienceForm.isCurrentPosition ? null : experienceForm.endDate,
          description: experienceForm.description,
          isCurrentPosition: experienceForm.isCurrentPosition
        });

        if (response.success) {
          // Refresh profile data
          await fetchProfileData();
          toggleAddExperience();
        } else {
          throw new Error(response.message || 'Failed to add work experience');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleAddEducation = () => {
      addingEducation.value = !addingEducation.value;
      if (!addingEducation.value) {
        // Reset form
        educationForm.institution = '';
        educationForm.degree = '';
        educationForm.fieldOfStudy = '';
        educationForm.startDate = '';
        educationForm.endDate = '';
        educationForm.isCurrentlyStudying = false;
      }
    };

    const addEducation = async () => {
      try {
        loading.value = true;
        const response = await providerService.addEducation({
          institution: educationForm.institution,
          degree: educationForm.degree,
          fieldOfStudy: educationForm.fieldOfStudy,
          startDate: educationForm.startDate,
          endDate: educationForm.isCurrentlyStudying ? null : educationForm.endDate,
          isCurrentlyStudying: educationForm.isCurrentlyStudying
        });

        if (response.success) {
          // Refresh profile data
          await fetchProfileData();
          toggleAddEducation();
        } else {
          throw new Error(response.message || 'Failed to add education');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleAddSkill = () => {
      addingSkill.value = !addingSkill.value;
      if (!addingSkill.value) {
        // Reset form
        skillForm.skillName = '';
      }
    };

    const addSkill = async () => {
      try {
        loading.value = true;
        const response = await providerService.addSkill({
          skillName: skillForm.skillName
        });

        if (response.success) {
          // Refresh profile data
          await fetchProfileData();
          toggleAddSkill();
        } else {
          throw new Error(response.message || 'Failed to add skill');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleAddDocument = () => {
      addingDocument.value = !addingDocument.value;
      if (!addingDocument.value) {
        // Reset form
        documentForm.title = '';
        documentForm.type = 'ID';
      }
    };

    const addDocument = async () => {
      try {
        loading.value = true;
        
        const fileInput = document.querySelector('input[type="file"]');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
          throw new Error('Please select a file');
        }

        const formData = new FormData();
        formData.append('title', documentForm.title);
        formData.append('type', documentForm.type);
        formData.append('file', fileInput.files[0]);

        const response = await providerService.addDocument(formData);

        if (response.success) {
          // Refresh profile data
          await fetchProfileData();
          toggleAddDocument();
        } else {
          throw new Error(response.message || 'Failed to upload document');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleAddPortfolio = () => {
      addingPortfolio.value = !addingPortfolio.value;
      if (!addingPortfolio.value) {
        // Reset form
        portfolioForm.title = '';
        portfolioForm.description = '';
        portfolioForm.projectUrl = '';
      }
    };

    const addPortfolioItem = async () => {
      try {
        loading.value = true;
        
        const fileInput = document.querySelector('input[type="file"][multiple]');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          throw new Error('Please select at least one file');
        }
        
        // Check if too many files selected
        if (fileInput.files.length > 5) {
          throw new Error('You can only upload up to 5 files');
        }

        const formData = new FormData();
        formData.append('title', portfolioForm.title);
        formData.append('description', portfolioForm.description);
        formData.append('projectUrl', portfolioForm.projectUrl || '');
        
        // Append each file separately
        for (let i = 0; i < fileInput.files.length; i++) {
          formData.append('files', fileInput.files[i]);
        }

        const response = await providerService.addPortfolioWithFiles(formData);

        if (response.success) {
          // Refresh profile data
          await fetchProfileData();
          toggleAddPortfolio();
        } else {
          throw new Error(response.message || 'Failed to add portfolio item');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    // Helper functions
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    };

    const isImageFile = (fileUrl) => {
      const extension = fileUrl.split('.').pop().toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes('.' + extension);
    };

    const getFileIcon = (fileUrl) => {
      const extension = fileUrl.split('.').pop().toLowerCase();
      switch (extension) {
        case 'pdf':
          return 'fas fa-file-pdf';
        case 'doc':
        case 'docx':
          return 'fas fa-file-word';
        case 'txt':
          return 'fas fa-file-alt';
        default:
          return 'fas fa-file';
      }
    };

    const getFileName = (fileUrl) => {
      const parts = fileUrl.split('/');
      return parts[parts.length - 1];
    };

    const getFullFileUrl = (fileUrl) => {
      return apiService.getFileUrl(fileUrl);
    };

    const openFileModal = (fileUrl, title = '', type = '') => {
      modalFile.url = fileUrl;
      modalFile.title = title;
      modalFile.type = type;
      showFileModal.value = true;
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeFileModal = () => {
      showFileModal.value = false;
      document.body.style.overflow = ''; // Restore scrolling
    };

    const isPdfFile = (fileUrl) => {
      if (!fileUrl) return false;
      const extension = fileUrl.split('.').pop().toLowerCase();
      return extension === 'pdf';
    };

    // Profile image upload functions
    const triggerFileUpload = () => {
      profileImageInput.value.click();
    };

    const handleProfileImageChange = async (event) => {
      const file = event.target.files[0];
      console.log('File selected:', file);
      
      if (!file) {
        console.error('No file selected');
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        error.value = 'Please select an image file';
        console.error('Invalid file type:', file.type);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error.value = 'Image must be less than 5MB';
        console.error('File too large:', file.size);
        return;
      }
      
      try {
        uploadingProfileImage.value = true;
        error.value = null;
        
        // Use the uploadProfilePicture service instead of direct fetch
        const response = await apiService.uploadProfilePicture(file);
        
        if (response.success) {
          // Update local profile data with the response
          profile.value = response.data;
          console.log('Profile picture updated successfully');
        } else {
          throw new Error(response.message || 'Failed to update profile picture');
        }
      } catch (err) {
        console.error('Error in profile image upload:', err);
        error.value = err.message || 'Failed to upload profile picture';
      } finally {
        uploadingProfileImage.value = false;
        event.target.value = '';
      }
    };

    onMounted(() => {
      fetchProfileData();
    });

    return {
      profile,
      loading,
      error,
      verificationStatus,
      activeTab,
      tabs,
      editingPersonal,
      addingExperience,
      addingEducation,
      addingSkill,
      addingDocument,
      addingPortfolio,
      personalForm,
      experienceForm,
      educationForm,
      skillForm,
      documentForm,
      portfolioForm,
      verificationStatusText,
      verificationStatusClass,
      toggleEditPersonal,
      updatePersonalInfo,
      toggleAddExperience,
      addExperience,
      toggleAddEducation,
      addEducation,
      toggleAddSkill,
      addSkill,
      toggleAddDocument,
      addDocument,
      toggleAddPortfolio,
      addPortfolioItem,
      formatDate,
      isImageFile,
      getFileIcon,
      getFileName,
      getFullFileUrl,
      showFileModal,
      modalFile,
      openFileModal,
      closeFileModal,
      isPdfFile,
      triggerFileUpload,
      handleProfileImageChange,
      uploadingProfileImage,
      profileImageInput
    };
  }
};
</script>

<style scoped>
.provider-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', 'Segoe UI', sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-weight: 600;
  font-size: 2.2rem;
}

h2 {
  color: #2c3e50;
  font-weight: 500;
  margin-top: 0;
  font-size: 1.6rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

h3 {
  color: #34495e;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 1.2rem;
}

/* Profile Tabs */
.profile-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
}

.profile-tabs::-webkit-scrollbar {
  height: 5px;
}

.profile-tabs::-webkit-scrollbar-track {
  background: #f8f8f8;
}

.profile-tabs::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 10px;
}

.tab {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #f8f8f8;
  border-radius: 8px 8px 0 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  flex-shrink: 0;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.03);
}

.tab i {
  font-size: 16px;
}

.tab:hover {
  background-color: #e0f2f1;
  color: #009688;
}

.tab.active {
  background-color: #009688;
  color: white;
  font-weight: 500;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
}

.tab-content {
  display: block;
  animation: fadeIn 0.5s;
}

.section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.08);
  padding: 25px;
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

/* Profile Info */
.profile-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
}

.profile-picture-container {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  border: 3px solid #fff;
  flex-shrink: 0;
}

.profile-picture {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 25px;
}

.detail-item {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.detail-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.bio-text {
  white-space: pre-line;
  line-height: 1.6;
  color: #555;
}

.edit-btn, .add-btn {
  background-color: #009688;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0,150,136,0.2);
}

.edit-btn:hover, .add-btn:hover {
  background-color: #00796b;
  box-shadow: 0 4px 8px rgba(0,150,136,0.3);
  transform: translateY(-2px);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #455a64;
}

.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: border 0.3s, box-shadow 0.3s;
  font-size: 1rem;
}

.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  border-color: #009688;
  box-shadow: 0 0 0 2px rgba(0,150,136,0.2);
  outline: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 25px;
}

.save-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(33,150,243,0.2);
}

.save-btn:hover {
  background-color: #1976d2;
  box-shadow: 0 4px 8px rgba(33,150,243,0.3);
  transform: translateY(-2px);
}

.cancel-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(244,67,54,0.2);
}

.cancel-btn:hover {
  background-color: #d32f2f;
  box-shadow: 0 4px 8px rgba(244,67,54,0.3);
  transform: translateY(-2px);
}

/* Experience and Education */
.experience-list, .education-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.experience-item, .education-item {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border-left: 4px solid #009688;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.experience-item:hover, .education-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.experience-header, .education-header {
  margin-bottom: 12px;
}

.experience-company, .education-institution {
  font-weight: 500;
  color: #455a64;
  font-size: 1.05rem;
}

.experience-dates, .education-dates, .education-field {
  color: #78909c;
  font-size: 0.9rem;
  margin-top: 5px;
}

.experience-description {
  margin-top: 12px;
  white-space: pre-line;
  line-height: 1.5;
  color: #555;
}

/* Skills */
.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.skill-tag {
  background-color: #e0f7fa;
  color: #00838f;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 0.95rem;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0,131,143,0.1);
}

.skill-tag:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 5px 12px rgba(0,131,143,0.15);
  background-color: #b2ebf2;
}

/* Documents */
.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 15px;
  border-left: 4px solid #2196F3;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  flex-wrap: wrap;
  gap: 15px;
}

.document-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.08);
}

.document-info {
  flex: 1;
  min-width: 200px;
}

.document-title {
  margin-bottom: 5px;
  font-weight: 500;
}

.view-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(33,150,243,0.2);
}

.view-btn:hover {
  background-color: #1976d2;
  box-shadow: 0 5px 12px rgba(33,150,243,0.25);
  transform: translateY(-2px);
}

.verified {
  color: #4caf50;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.verified:before {
  content: "✓";
  display: inline-block;
  font-size: 14px;
  background: #4caf50;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  text-align: center;
  line-height: 18px;
}

.pending {
  color: #ff9800;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pending:before {
  content: "⌛";
  display: inline-block;
  font-size: 14px;
}

.not-verified {
  color: #f44336;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.not-verified:before {
  content: "✕";
  display: inline-block;
  font-size: 14px;
}

.verification-status {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.no-data {
  color: #78909c;
  font-style: italic;
  margin: 30px 0;
  text-align: center;
  padding: 40px 20px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px dashed #ddd;
}

.no-data p:first-child {
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-weight: 500;
  color: #455a64;
}

.placeholder-img {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eceff1;
  color: #90a4ae;
}

.placeholder-img i {
  font-size: 48px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #607d8b;
}

.error {
  text-align: center;
  padding: 20px;
  color: #f44336;
  background-color: #ffebee;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #ffcdd2;
}

/* Portfolio */
.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.portfolio-item {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid #f0f0f0;
}

.portfolio-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.1);
}

.portfolio-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.portfolio-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #2c3e50;
}

.project-link {
  color: #2196F3;
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  transition: all 0.2s;
}

.project-link:hover {
  color: #1976d2;
  text-decoration: underline;
}

.portfolio-description {
  padding: 15px 20px;
  color: #607d8b;
  font-size: 0.95rem;
  line-height: 1.5;
}

.portfolio-images {
  padding: 0 20px 20px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.gallery-item {
  height: 120px;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.gallery-item:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.gallery-item:hover img {
  transform: scale(1.1);
}

.document-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 5px;
  background-color: #f9f9f9;
  border-radius: 8px;
  height: 100%;
  text-align: center;
}

.document-preview i {
  font-size: 30px;
  color: #607d8b;
}

.document-preview span {
  font-size: 0.8rem;
  color: #455a64;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-images {
  text-align: center;
  color: #9e9e9e;
  padding: 30px 20px;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 15px;
}

.form-hint {
  display: block;
  margin-top: 8px;
  color: #78909c;
  font-size: 0.85rem;
}

/* Modal Styles */
.file-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(3px);
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  max-width: 90vw;
  width: 900px;
  max-height: 90vh;
  z-index: 1001;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: modalFadeIn 0.3s ease-out;
}

.modal-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #2c3e50;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #78909c;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #e53935;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.modal-document {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
}

.modal-file-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  padding: 40px;
}

.modal-file-info .file-icon {
  font-size: 80px;
  color: #607d8b;
}

.modal-file-info p {
  font-size: 1.2rem;
  color: #455a64;
  word-break: break-word;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(33,150,243,0.3);
}

.download-btn:hover {
  background-color: #1976d2;
  box-shadow: 0 5px 15px rgba(33,150,243,0.4);
  transform: translateY(-3px);
}

.file-icon {
  font-size: 24px;
  color: #607d8b;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .section {
    padding: 15px;
  }
  
  .portfolio-grid,
  .experience-list,
  .education-list {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .modal-container {
    width: 95vw;
  }
  
  .document-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .view-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  h1 {
    font-size: 1.8rem;
  }
  
  .tab {
    padding: 10px 15px;
  }
  
  .tab i {
    font-size: 14px;
  }
  
  .gallery-item {
    height: 100px;
  }
  
  .portfolio-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.profile-picture-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.profile-picture-container:hover .profile-picture-overlay {
  opacity: 1;
}

.profile-picture-overlay i {
  font-size: 24px;
  margin-bottom: 5px;
}

.profile-picture-overlay span {
  font-size: 12px;
  text-align: center;
}

.hidden-input {
  display: none;
}

.upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-progress .spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}
</style>
