<template>
  <div class="folder-tree">
    <div class="tree-header">
      <h3>Folders</h3>
      <div class="dropdown-container">
        <button @click="showDropdown = !showDropdown" class="btn btn-sm dropdown-toggle">
          +
        </button>
        <div v-if="showDropdown" class="dropdown-menu">
          <button @click="showCreateFolderForm" class="dropdown-item">
            <span class="dropdown-icon">▸</span>
            New Folder
          </button>
          <button @click="createNewNote" class="dropdown-item">
            <span class="dropdown-icon">•</span>
            New Note
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateForm" class="create-folder-form">
      <input 
        v-model="newFolderName" 
        type="text" 
        placeholder="Folder name"
        class="form-input"
        @keyup.enter="createFolder"
        ref="folderInput"
      />
      <div class="form-actions">
        <button @click="createFolder" class="btn btn-primary btn-sm">Create</button>
        <button @click="cancelCreate" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>

    <div 
      class="tree-content"
      :class="{ 'drag-over': isDragOver }"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <!-- Root level notes -->
      <div v-if="rootNotes.length > 0" class="notes-section">
        <div 
          v-for="note in rootNotes" 
          :key="note._id"
          class="note-item"
          :class="{ active: selectedNote && selectedNote._id === note._id }"
          @click="$emit('note-selected', note)"
          draggable="true"
          @dragstart="handleNoteDragStart($event, note)"
          @dragend="handleNoteDragEnd"
        >
          <span class="note-icon">•</span>
          <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
          <button 
            @click.stop="deleteNote(note)" 
            class="btn-delete-note"
            title="Delete note"
          >
            ×
          </button>
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
        @note-moved="$emit('note-moved')"
        @drag-start="handleChildDragStart"
        @drag-end="handleChildDragEnd"
        @folder-drag-over="$emit('folder-drag-over')"
        @folder-drag-leave="$emit('folder-drag-leave')"
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
import { ref, nextTick } from 'vue'
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
  emits: ['folder-selected', 'folder-created', 'folder-deleted', 'folder-moved', 'note-selected', 'note-created', 'note-moved', 'note-deleted', 'drag-start', 'drag-end', 'folder-drag-over', 'folder-drag-leave'],
  setup(props, { emit }) {
    const showCreateForm = ref(false)
    const newFolderName = ref('')
    const showDropdown = ref(false)

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

    const showCreateFolderForm = () => {
      showDropdown.value = false
      showCreateForm.value = true
      nextTick(() => {
        const input = document.querySelector('.create-folder-form .form-input')
        if (input) input.focus()
      })
    }

    const createNewNote = async () => {
      showDropdown.value = false
      
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      
      console.log('🔍 FolderTree.createNewNote debug:', {
        user,
        rootFolder,
        currentFolder: props.currentFolder,
        currentFolderId: props.currentFolder?._id
      })
      
      if (!user) {
        console.error('❌ No user found')
        alert('Error: No user found. Please log in again.')
        return
      }
      
      if (!rootFolder) {
        console.error('❌ No root folder found')
        alert('Error: No root folder found. Please try refreshing the page.')
        return
      }

      try {
        // Create note using Request API with current folder or root folder
        const folderId = props.currentFolder?._id || rootFolder
        console.log('📝 Creating note in folder:', folderId, 'type:', typeof folderId)
        
        if (!folderId || folderId === 'undefined') {
          throw new Error('Invalid folder ID: ' + folderId)
        }
        
        const response = await requestAPI.createNote(user, 'Start writing your note...', folderId, 'Untitled Note')
        console.log('✅ Note created:', response)
        
        if (response.note) {
          // Create temporary note object with real ID from API response
          const tempNote = {
            _id: response.note,  // Real ID from API response
            title: 'Untitled Note',
            content: 'Start writing your note...',
            folderId: folderId,
            date_created: new Date().toISOString(),
            last_modified: new Date().toISOString()
          }
          emit('note-selected', tempNote)
          // Also emit note-created event so Dashboard can refresh the notes list
          emit('note-created', response)
        }
      } catch (error) {
        console.error('❌ Error creating note:', error)
        alert('Error creating note: ' + (error.error || 'Unknown error'))
      }
    }

    const deleteFolder = async (folder) => {
      if (!confirm(`Are you sure you want to delete "${folder.title}"? This will delete all contents.`)) {
        return
      }

      try {
        const user = authService.getUser()
        if (!user) {
          console.error('❌ No user found for deleteFolder')
          return
        }
        
        await requestAPI.deleteFolder(folder._id, user)
        emit('folder-deleted')
      } catch (error) {
        console.error('Error deleting folder:', error)
        alert('Error deleting folder: ' + (error.error || 'Unknown error'))
      }
    }

    const deleteNote = async (note) => {
      if (!confirm(`Are you sure you want to delete "${note.title || 'Untitled Note'}"?`)) {
        return
      }

      try {
        const user = authService.getUser()
        if (!user) {
          console.error('❌ No user found for deleteNote')
          return
        }
        
        await requestAPI.deleteNote(note._id, user)
        emit('note-deleted')
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Error deleting note: ' + (error.error || 'Unknown error'))
      }
    }

    const handleNoteDragStart = (event, note) => {
      emit('drag-start')
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'note',
        id: note._id,
        title: note.title || 'Untitled Note'
      }))
      event.dataTransfer.effectAllowed = 'move'
    }

    const handleNoteDragEnd = () => {
      isDragOver.value = false
      emit('drag-end')
    }

    const handleChildDragStart = () => {
      emit('drag-start')
    }

    const handleChildDragEnd = () => {
      isDragOver.value = false
      emit('drag-end')
    }

    // Drag and drop handlers for moving items to root
    const isDragOver = ref(false)

    const handleDragOver = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const handleDragEnter = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      // Only set drag over to false if we're leaving the entire tree area
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOver.value = false
      }
    }

    const handleDrop = async (event) => {
      event.preventDefault()
      event.stopPropagation()
      isDragOver.value = false
      emit('drag-end') // Clear global drag state
      
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      
      if (!user || !rootFolder) {
        console.error('❌ Missing user or root folder for root drop')
        return
      }

      if (data.type === 'folder') {
        console.log('📁 [FolderTree.handleDrop] Moving folder to root:', data.id, 'to root:', rootFolder)
        console.log('🔍 [FolderTree.handleDrop] Move parameters:', {
          sourceFolderId: data.id,
          targetRootFolder: rootFolder,
          user: user
        });
        
        try {
          console.log('🔄 [FolderTree.handleDrop] Calling requestAPI.moveFolder');
          const result = await requestAPI.moveFolder(data.id, rootFolder)
          console.log('✅ [FolderTree.handleDrop] Folder moved to root successfully:', result)
          console.log('🔄 [FolderTree.handleDrop] Emitting folder-moved event');
          emit('folder-moved')
          console.log('✅ [FolderTree.handleDrop] folder-moved event emitted');
        } catch (error) {
          console.error('❌ [FolderTree.handleDrop] Error moving folder to root:', error)
          alert('Error moving folder to root: ' + (error.error || 'Unknown error'))
        }
      } else if (data.type === 'note') {
        console.log('📄 [FolderTree.handleDrop] Moving note to root:', data.id, 'to root folder:', rootFolder)
        console.log('🔍 [FolderTree.handleDrop] Note move parameters:', {
          noteId: data.id,
          targetRootFolder: rootFolder,
          user: user
        });
        
        try {
          console.log('🔄 [FolderTree.handleDrop] Calling requestAPI.moveNote');
          const result = await requestAPI.moveNote(data.id, rootFolder, user)
          console.log('✅ [FolderTree.handleDrop] Note moved to root successfully:', result)
          emit('note-moved')
        } catch (error) {
          console.error('❌ [FolderTree.handleDrop] Error moving note to root:', error)
          alert('Error moving note to root: ' + (error.error || 'Unknown error'))
        }
      }
    }

    return {
      showCreateForm,
      newFolderName,
      showDropdown,
      createFolder,
      cancelCreate,
      showCreateFolderForm,
      createNewNote,
      deleteFolder,
      deleteNote,
      handleNoteDragStart,
      handleNoteDragEnd,
      handleChildDragStart,
      handleChildDragEnd,
      isDragOver,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop
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

.tree-content.drag-over {
  background-color: rgba(66, 165, 245, 0.1);
  border: 2px dashed var(--accent-blue);
  border-radius: 8px;
  transition: all var(--transition-fast);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.tree-header h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.dropdown-container {
  position: relative;
}

.dropdown-toggle {
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: 2px solid var(--accent-primary);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.dropdown-toggle:hover {
  background: var(--bg-hover);
  color: var(--accent-primary);
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 0.5rem;
  min-width: 160px;
  z-index: 1000;
  margin-top: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.dropdown-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.create-folder-form {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
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
  border-radius: 8px;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.tree-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(2px);
}

.tree-item.active {
  background: rgba(66, 165, 245, 0.1);
  border-color: var(--accent-blue);
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
  color: var(--text-primary);
}

.folder-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.tree-item:hover .folder-actions {
  opacity: 1;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--error);
  transition: all var(--transition-fast);
}

.btn-delete:hover {
  background: rgba(244, 67, 54, 0.1);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-muted);
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
  border-radius: 8px;
  transition: all var(--transition-fast);
  margin: 0.125rem 0;
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(2px);
}

.note-item.active {
  background-color: rgba(66, 165, 245, 0.1);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
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
  color: var(--text-primary);
}

.btn-delete-note {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0.25rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.note-item:hover .btn-delete-note {
  opacity: 1;
  color: var(--text-primary);
}

.btn-delete-note:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: scale(1.1);
}
</style>
