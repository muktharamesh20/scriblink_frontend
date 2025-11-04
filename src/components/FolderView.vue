<template>
  <div class="folder-view">
    <div class="folder-header">
      <h2>{{ folder.title }}</h2>
      <div class="folder-actions">
        <button @click="createNote" class="btn btn-primary btn-sm">
          <span>📝</span> New Note
        </button>
      </div>
    </div>

    <div 
      class="folder-content"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div v-if="notes.length === 0" class="empty-folder">
        <p>This folder is empty</p>
        <button @click="createNote" class="btn btn-primary">
          Create your first note
        </button>
      </div>

      <div v-else class="notes-grid">
        <div 
          v-for="note in notes" 
          :key="note._id"
          class="note-card"
          @click="$emit('note-selected', note)"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title }}</h3>
            <div class="note-actions">
              <button 
                @click.stop="deleteNote(note)" 
                class="btn-delete"
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="note-preview">
            {{ note.content ? note.content.substring(0, 100) + '...' : 'No content' }}
          </div>
          
          <div class="note-meta">
            <span class="note-date">
              {{ formatDate(note.last_modified) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { notesAPI, folderAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'FolderView',
  props: {
    folder: {
      type: Object,
      required: true
    },
    notes: {
      type: Array,
      default: () => []
    }
  },
  emits: ['note-selected', 'note-created', 'note-deleted', 'note-moved'],
  setup(props, { emit }) {
    const createNote = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        // Use unified Request API to create note in the current folder
        const response = await notesAPI.createNote(user, 'Start writing your note...', props.folder._id, 'Untitled Note', authService.getAccessToken())
        if (response.note) {
          emit('note-created', response)
        }
      } catch (error) {
        console.error('Error creating note:', error)
        alert('Error creating note: ' + (error.error || 'Unknown error'))
      }
    }

    const deleteNote = async (note) => {
      if (!confirm(`Are you sure you want to delete "${note.title}"?`)) {
        return
      }

      const user = authService.getUser()
      if (!user) return

      try {
        await notesAPI.deleteNote(note._id, authService.getAccessToken())
        emit('note-deleted')
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Error deleting note: ' + (error.error || 'Unknown error'))
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    // Drag and drop handlers for notes
    const handleDragOver = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const handleDragEnter = (event) => {
      event.preventDefault()
      event.currentTarget.classList.add('drag-over')
    }

    const handleDragLeave = (event) => {
      event.currentTarget.classList.remove('drag-over')
    }

    const handleDrop = async (event) => {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.classList.remove('drag-over')
      
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      
      if (data.type === 'note') {
        const user = authService.getUser()
        if (!user) {
          console.error('❌ No user found for moveNote')
          return
        }

        console.log('📄 Moving note:', data.id, 'to folder:', props.folder._id)
        
        try {
          const result = await folderAPI.moveNote(data.id, props.folder._id, user, authService.getAccessToken())
          console.log('✅ Note moved successfully:', result)
          emit('note-moved')
        } catch (error) {
          console.error('❌ Error moving note:', error)
          alert('Error moving note: ' + (error.error || 'Unknown error'))
        }
      }
    }

    return {
      createNote,
      deleteNote,
      formatDate,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop
    }
  }
}
</script>

<style scoped>
.folder-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.folder-header h2 {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.folder-content {
  flex: 1;
  overflow-y: auto;
}

.folder-content.drag-over {
  background-color: rgba(66, 165, 245, 0.1);
  border: 2px dashed var(--accent-blue);
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: var(--text-muted);
}

.empty-folder p {
  margin-bottom: 1rem;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.note-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-blue);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.note-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
  margin-right: 0.5rem;
}

.note-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.note-card:hover .note-actions {
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

.note-preview {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 0.75rem;
  max-height: 3em;
  overflow: hidden;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.note-date {
  font-size: 0.75rem;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.btn-sm span {
  margin-right: 0.25rem;
}
</style>
