<template>
  <div class="folder-tree">
    <div class="tree-header">
      <h3>Folders</h3>
      <button @click="showCreateForm = !showCreateForm" class="btn btn-sm">
        {{ showCreateForm ? 'Cancel' : '+' }}
      </button>
    </div>

    <div v-if="showCreateForm" class="create-folder-form">
      <input 
        v-model="newFolderName" 
        type="text" 
        placeholder="Folder name"
        class="form-input"
        @keyup.enter="createFolder"
      />
      <div class="form-actions">
        <button @click="createFolder" class="btn btn-primary btn-sm">Create</button>
        <button @click="cancelCreate" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>

    <div class="tree-content">
      <div 
        v-for="folder in folders" 
        :key="folder._id"
        class="tree-item"
        :class="{ active: currentFolder && currentFolder._id === folder._id }"
        @click="$emit('folder-selected', folder)"
      >
        <div class="folder-item">
          <span class="folder-icon">📁</span>
          <span class="folder-name">{{ folder.title }}</span>
          <div class="folder-actions">
            <button 
              @click.stop="deleteFolder(folder)" 
              class="btn-delete"
              title="Delete folder"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-if="folders.length === 0" class="empty-state">
        <p>No folders yet</p>
        <button @click="showCreateForm = true" class="btn btn-primary btn-sm">
          Create your first folder
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { folderAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'FolderTree',
  props: {
    folders: {
      type: Array,
      default: () => []
    },
    currentFolder: {
      type: Object,
      default: null
    }
  },
  emits: ['folder-selected', 'folder-created', 'folder-deleted'],
  setup(props, { emit }) {
    const showCreateForm = ref(false)
    const newFolderName = ref('')

    const createFolder = async () => {
      if (!newFolderName.value.trim()) return

      const user = authService.getUser()
      if (!user) return

      try {
        await folderAPI.createFolder(user, newFolderName.value.trim(), 'root')
        emit('folder-created')
        cancelCreate()
      } catch (error) {
        console.error('Error creating folder:', error)
        alert('Error creating folder: ' + (error.error || 'Unknown error'))
      }
    }

    const cancelCreate = () => {
      showCreateForm.value = false
      newFolderName.value = ''
    }

    const deleteFolder = async (folder) => {
      if (!confirm(`Are you sure you want to delete "${folder.title}"? This will delete all contents.`)) {
        return
      }

      try {
        await folderAPI.deleteFolder(folder._id)
        emit('folder-deleted')
      } catch (error) {
        console.error('Error deleting folder:', error)
        alert('Error deleting folder: ' + (error.error || 'Unknown error'))
      }
    }

    return {
      showCreateForm,
      newFolderName,
      createFolder,
      cancelCreate,
      deleteFolder
    }
  }
}
</script>

<style scoped>
.folder-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.tree-header h3 {
  color: #2c3e50;
  font-size: 1.1rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.create-folder-form {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
}

.tree-item {
  margin-bottom: 0.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tree-item:hover {
  background: #f8f9fa;
}

.tree-item.active {
  background: #e3f2fd;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  gap: 0.5rem;
}

.folder-icon {
  font-size: 1rem;
}

.folder-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
}

.folder-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-item:hover .folder-actions {
  opacity: 1;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 2px;
  font-size: 0.8rem;
}

.btn-delete:hover {
  background: #ffebee;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1rem;
}
</style>
