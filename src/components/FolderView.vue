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

    <div class="folder-content">
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
import { notesAPI, folderAPI, requestAPI } from '../services/apiServices.js'
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
        const response = await requestAPI.createNote(user, 'Start writing your note...', props.folder._id, 'Untitled Note')
        if (response.note) {
          emit('note-created')
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
        await notesAPI.deleteNote(note._id, user)
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

    return {
      createNote,
      deleteNote,
      formatDate
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
  border-bottom: 1px solid #eee;
}

.folder-header h2 {
  color: #2c3e50;
  font-size: 1.25rem;
}

.folder-content {
  flex: 1;
  overflow-y: auto;
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
  color: #666;
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
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-color: #3498db;
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
  color: #2c3e50;
  margin: 0;
  flex: 1;
  margin-right: 0.5rem;
}

.note-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.note-card:hover .note-actions {
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

.note-preview {
  color: #666;
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
  color: #999;
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
