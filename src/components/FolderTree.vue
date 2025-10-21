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
      <!-- Root level notes -->
      <div v-if="rootNotes.length > 0" class="notes-section">
        <div 
          v-for="note in rootNotes" 
          :key="note._id"
          class="note-item"
          :class="{ active: selectedNote && selectedNote._id === note._id }"
          @click="$emit('note-selected', note)"
        >
          <span class="note-icon">📄</span>
          <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
        </div>
      </div>

      <!-- Folders -->
      <FolderTreeNode 
        v-for="folder in folders" 
        :key="folder._id"
        :folder="folder"
        :current-folder="currentFolder"
        :level="0"
        :all-notes="allNotes"
        :selected-note="selectedNote"
        @folder-selected="$emit('folder-selected', $event)"
        @folder-created="$emit('folder-created')"
        @folder-deleted="$emit('folder-deleted')"
        @folder-moved="$emit('folder-moved')"
        @note-selected="$emit('note-selected', $event)"
      />

      <div v-if="folders.length === 0 && rootNotes.length === 0" class="empty-state">
        <p>No folders or notes yet</p>
        <button @click="showCreateForm = true" class="btn btn-primary btn-sm">
          Create your first folder
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'
import FolderTreeNode from './FolderTreeNode.vue'

export default {
  name: 'FolderTree',
  components: {
    FolderTreeNode
  },
  props: {
    folders: {
      type: Array,
      default: () => []
    },
    currentFolder: {
      type: Object,
      default: null
    },
    rootNotes: {
      type: Array,
      default: () => []
    },
    allNotes: {
      type: Array,
      default: () => []
    },
    selectedNote: {
      type: Object,
      default: null
    }
  },
  emits: ['folder-selected', 'folder-created', 'folder-deleted', 'folder-moved', 'note-selected'],
  setup(props, { emit }) {
    const showCreateForm = ref(false)
    const newFolderName = ref('')

    const createFolder = async () => {
      console.log('🚀 createFolder called')
      console.log('📝 newFolderName:', newFolderName.value)
      
      if (!newFolderName.value.trim()) {
        console.log('❌ No folder name provided')
        return
      }

      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      console.log('👤 User:', user)
      console.log('📁 Root folder:', rootFolder)
      
      if (!user || !rootFolder) {
        console.log('❌ Missing user or root folder')
        return
      }

      try {
        // Create folder in current folder or root folder
        const parentFolderId = props.currentFolder?._id || rootFolder
        console.log('📂 Parent folder ID:', parentFolderId)
        console.log('🌐 Making API call...')
        
        await requestAPI.createFolder(user, newFolderName.value.trim(), parentFolderId)
        console.log('✅ Folder created successfully')
        emit('folder-created')
        cancelCreate()
      } catch (error) {
        console.error('❌ Error creating folder:', error)
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
        await requestAPI.deleteFolder(folder._id)
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

/* Notes styling */
.notes-section {
  margin-bottom: 0.5rem;
}

.note-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin: 0.125rem 0;
}

.note-item:hover {
  background-color: #f5f5f5;
}

.note-item.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.note-icon {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.note-title {
  font-size: 0.9rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
