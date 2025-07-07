<template>
  <div class="category-management">
    <h2 class="page-title">Category Management</h2>
    
    <!-- Create New Category Form -->
    <div class="form-container">
      <h3>Create New Category</h3>
      <form @submit.prevent="createCategory">
        <div class="form-group">
          <label for="category-name">Category Name:</label>
          <input type="text" id="category-name" v-model="newCategory.name" placeholder="Enter category name" required>
        </div>
        <div class="form-group">
          <label for="category-description">Description:</label>
          <textarea id="category-description" v-model="newCategory.description" placeholder="Enter category description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="category-image">Category Image:</label>
          <input type="file" id="category-image" @change="handleImageChange" accept="image/*">
        </div>
        <button type="submit" :disabled="loading">Create Category</button>
        <div v-if="createResult" :class="['result', createResult.success ? 'success' : 'error']">
          {{ createResult.message }}
        </div>
      </form>
    </div>

    <!-- Existing Categories -->
    <div class="categories-container">
      <h3>Existing Categories</h3>
      <div v-if="loadingCategories" class="loading">Loading...</div>
      <div v-else-if="categoriesError" class="error">{{ categoriesError }}</div>
      <div v-else>
        <div v-if="categories.length === 0">No categories found</div>
        <table v-else class="categories-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td>{{ category.name }}</td>
              <td>{{ category.description || 'No description' }}</td>
              <td>
                <img v-if="category.imageUrl" :src="getFileUrl(category.imageUrl)" width="50" height="50" :alt="category.name">
                <span v-else>No image</span>
              </td>
              <td>
                <button @click="openEditModal(category)" class="edit-btn">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <span class="close-button" @click="closeEditModal">&times;</span>
        <h3>Edit Category</h3>
        <form @submit.prevent="updateCategory">
          <div class="form-group">
            <label for="edit-category-name">Category Name:</label>
            <input type="text" id="edit-category-name" v-model="editingCategory.name" placeholder="Enter category name" required>
          </div>
          <div class="form-group">
            <label for="edit-category-description">Description:</label>
            <textarea id="edit-category-description" v-model="editingCategory.description" placeholder="Enter category description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label for="edit-category-image">Category Image:</label>
            <div v-if="editingCategory.imageUrl" class="current-image">
              <img :src="editingCategory.imageUrl" width="100" :alt="editingCategory.name">
              <p><small>Current image</small></p>
            </div>
            <input type="file" id="edit-category-image" @change="handleEditImageChange" accept="image/*">
            <p><small>Leave empty to keep current image</small></p>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeEditModal" class="cancel-btn">Cancel</button>
            <button type="submit" :disabled="updating" class="save-btn">Save Changes</button>
          </div>
          <div v-if="editResult" :class="['result', editResult.success ? 'success' : 'error']">
            {{ editResult.message }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getFileUrl as apiGetFileUrl } from '../../services/apiService';

const API_BASE_URL = 'http://localhost:5500/api';
const categories = ref([]);
const loadingCategories = ref(true);
const categoriesError = ref('');
const loading = ref(false);
const updating = ref(false);
const createResult = ref('');
const editResult = ref('');

const newCategory = ref({
  name: '',
  description: '',
  image: null
});

const showEditModal = ref(false);
const editingCategory = ref({
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  image: null
});

const getFileUrl = apiGetFileUrl;

const fetchCategories = async () => {
  loadingCategories.value = true;
  categoriesError.value = '';
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      categoriesError.value = 'Not authenticated';
      return;
    }
    const res = await fetch(`${API_BASE_URL}/admin/category`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      categories.value = data.data || [];
    } else {
      categoriesError.value = data.message || 'Failed to load categories';
    }
  } catch (e) {
    categoriesError.value = 'Failed to load categories';
  } finally {
    loadingCategories.value = false;
  }
};

const handleImageChange = (event) => {
  newCategory.value.image = event.target.files[0];
};

const handleEditImageChange = (event) => {
  editingCategory.value.image = event.target.files[0];
};

const createCategory = async () => {
  if (!newCategory.value.name.trim()) {
    createResult.value = { success: false, message: 'Category name is required' };
    return;
  }

  loading.value = true;
  createResult.value = '';

  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', newCategory.value.name.trim());
    
    if (newCategory.value.description.trim()) {
      formData.append('description', newCategory.value.description.trim());
    }
    
    if (newCategory.value.image) {
      formData.append('categoryImage', newCategory.value.image);
    }

    const res = await fetch(`${API_BASE_URL}/admin/category`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      createResult.value = { success: true, message: 'Category created successfully' };
      newCategory.value = { name: '', description: '', image: null };
      fetchCategories();
    } else {
      createResult.value = { success: false, message: data.message || 'Failed to create category' };
    }
  } catch (e) {
    createResult.value = { success: false, message: 'Failed to create category' };
  } finally {
    loading.value = false;
  }
};

const openEditModal = (category) => {
  editingCategory.value = {
    id: category.id,
    name: category.name,
    description: category.description || '',
    imageUrl: category.imageUrl,
    image: null
  };
  showEditModal.value = true;
  editResult.value = '';
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingCategory.value = { id: '', name: '', description: '', imageUrl: '', image: null };
  editResult.value = '';
};

const updateCategory = async () => {
  if (!editingCategory.value.name.trim()) {
    editResult.value = { success: false, message: 'Category name is required' };
    return;
  }

  updating.value = true;
  editResult.value = '';

  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', editingCategory.value.name.trim());
    
    if (editingCategory.value.description.trim()) {
      formData.append('description', editingCategory.value.description.trim());
    }
    
    if (editingCategory.value.image) {
      formData.append('categoryImage', editingCategory.value.image);
    }

    const res = await fetch(`${API_BASE_URL}/admin/category/${editingCategory.value.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      editResult.value = { success: true, message: 'Category updated successfully' };
      setTimeout(() => {
        fetchCategories();
        closeEditModal();
      }, 1500);
    } else {
      editResult.value = { success: false, message: data.message || 'Failed to update category' };
    }
  } catch (e) {
    editResult.value = { success: false, message: 'Failed to update category' };
  } finally {
    updating.value = false;
  }
};

onMounted(fetchCategories);
</script>

<style scoped>
.category-management {
  max-width: 1200px;
  padding: 20px;
  margin: 0 auto;
}

.form-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.categories-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.current-image {
  margin-bottom: 10px;
}

button {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-right: 10px;
}

button:hover:not(:disabled) {
  background-color: #0b7dda;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.edit-btn {
  background-color: #f39c12;
  padding: 6px 12px;
  font-size: 14px;
}

.edit-btn:hover {
  background-color: #e67e22;
}

.cancel-btn {
  background-color: #ccc;
}

.save-btn {
  background-color: #2196F3;
}

.loading {
  padding: 20px;
}

.error {
  color: red;
  padding: 20px;
}

.result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}

.result.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.result.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.categories-table th, .categories-table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.categories-table th {
  background: #f5f5f5;
}

.modal {
  display: block;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  overflow: auto;
}

.modal-content {
  background-color: #fefefe;
  margin: 10% auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  width: 80%;
  max-width: 600px;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.page-title {
  text-align: center;
  color: #4a5568;
  margin-bottom: 30px;
  font-size: 2.6rem;
  font-weight: 800;
  position: relative;
  padding-bottom: 15px;
  letter-spacing: -0.02em;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
}
</style>
