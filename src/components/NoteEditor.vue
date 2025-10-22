<template>
  <div class="note-editor">
    <div class="editor-header">
      <div class="editor-title">
        <input 
          v-model="noteTitle" 
          type="text" 
          class="title-input"
          placeholder="Note title"
          @blur="updateTitle"
          @keyup.enter="updateTitle"
        />
      </div>
      
      <div class="editor-actions">
        <button @click="saveNote" class="btn btn-primary btn-sm" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button @click="exitEditor" class="btn btn-secondary btn-sm">
          ← Back
        </button>
        <button @click="deleteNote" class="btn btn-danger btn-sm">
          Delete
        </button>
      </div>
    </div>

    <div class="editor-content">
      <textarea 
        v-model="noteContent" 
        class="content-textarea"
        placeholder="Start writing your note..."
        @input="onContentChange"
        @blur="updateContent"
      ></textarea>
    </div>

    <div class="editor-footer">
      <div class="note-metadata">
        <span v-if="note.date_created" class="meta-item">
          Created: {{ formatDate(note.date_created) }}
        </span>
        <span v-if="note.last_modified" class="meta-item">
          Modified: {{ formatDate(note.last_modified) }}
        </span>
      </div>
      
      <div class="editor-tools">
        <button @click="toggleTags" class="btn btn-secondary btn-sm">
          <span>🏷️</span> Tags
        </button>
        <button @click="toggleSummary" class="btn btn-secondary btn-sm">
          <span>📝</span> Summary
        </button>
      </div>
    </div>

    <!-- Tags Panel -->
    <div v-if="showTags" class="tags-panel">
      <TagsPanel 
        :note="note"
        @tags-updated="refreshTags"
      />
    </div>

    <!-- Summary Panel -->
    <div v-if="showSummary" class="summary-panel">
      <SummaryPanel 
        ref="summaryPanelRef"
        :note="note"
        @summary-updated="refreshSummary"
      />
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { notesAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'
import TagsPanel from './TagsPanel.vue'
import SummaryPanel from './SummaryPanel.vue'

export default {
  name: 'NoteEditor',
  components: {
    TagsPanel,
    SummaryPanel
  },
  props: {
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['note-updated', 'note-deleted', 'exit-editor'],
  setup(props, { emit }) {
    const noteTitle = ref('')
    const noteContent = ref('')
    const saving = ref(false)
    const showTags = ref(false)
    const showSummary = ref(false)
    const saveTimeout = ref(null)
    const summaryPanelRef = ref(null)
    const initialContentLength = ref(0)

    // Initialize form data when note changes
    watch(() => props.note, (newNote) => {
      if (newNote) {
        noteTitle.value = newNote.title || ''
        noteContent.value = newNote.content || ''
        initialContentLength.value = newNote.content?.length || 0
      }
    }, { immediate: true })

    const updateTitle = async () => {
      if (!props.note || noteTitle.value === props.note.title) return

      const user = authService.getUser()
      if (!user) return

      try {
        await notesAPI.setTitle(props.note._id, user, noteTitle.value)
        emit('note-updated')
      } catch (error) {
        console.error('Error updating title:', error)
        alert('Error updating title: ' + (error.error || 'Unknown error'))
      }
    }

    const updateContent = async () => {
      if (!props.note || noteContent.value === props.note.content) return

      const user = authService.getUser()
      if (!user) return

      saving.value = true
      try {
        await notesAPI.updateContent(props.note._id, noteContent.value)
        emit('note-updated')
      } catch (error) {
        console.error('Error updating content:', error)
        alert('Error updating content: ' + (error.error || 'Unknown error'))
      } finally {
        saving.value = false
      }
    }

    const onContentChange = () => {
      // Debounce content updates
      if (saveTimeout.value) {
        clearTimeout(saveTimeout.value)
      }
      
      saveTimeout.value = setTimeout(() => {
        updateContent()
      }, 1000) // Save after 1 second of inactivity
    }

    const saveNote = async () => {
      await Promise.all([
        updateTitle(),
        updateContent()
      ])
    }

    const deleteNote = async () => {
      if (!confirm(`Are you sure you want to delete "${props.note.title}"?`)) {
        return
      }

      const user = authService.getUser()
      if (!user) return

      try {
        await notesAPI.deleteNote(props.note._id)
        emit('note-deleted')
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Error deleting note: ' + (error.error || 'Unknown error'))
      }
    }

    const exitEditor = async () => {
      // Save the note before exiting
      await saveNote()
      
      // Auto-generate summary if needed
      if (summaryPanelRef.value && summaryPanelRef.value.autoGenerateSummaryIfNeeded) {
        await summaryPanelRef.value.autoGenerateSummaryIfNeeded()
      }
      
      emit('exit-editor')
    }

    const toggleTags = () => {
      showTags.value = !showTags.value
      if (showTags.value) {
        showSummary.value = false
      }
    }

    const toggleSummary = () => {
      console.log('🔍 [NoteEditor] toggleSummary called, current showSummary:', showSummary.value)
      showSummary.value = !showSummary.value
      console.log('🔍 [NoteEditor] showSummary after toggle:', showSummary.value)
      if (showSummary.value) {
        showTags.value = false
      }
    }

    const refreshTags = () => {
      // Tags will be refreshed by parent component
    }

    const refreshSummary = () => {
      // Summary will be refreshed by parent component
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    return {
      noteTitle,
      noteContent,
      saving,
      showTags,
      showSummary,
      summaryPanelRef,
      updateTitle,
      updateContent,
      onContentChange,
      saveNote,
      deleteNote,
      exitEditor,
      toggleTags,
      toggleSummary,
      refreshTags,
      refreshSummary,
      formatDate
    }
  }
}
</script>

<style scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.editor-title {
  flex: 1;
  margin-right: 1rem;
}

.title-input {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  border: none;
  background: none;
  padding: 0.5rem 0;
  outline: none;
}

.title-input:focus {
  border-bottom: 2px solid #3498db;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-content {
  flex: 1;
  margin-bottom: 1rem;
}

.content-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.6;
  font-family: inherit;
  resize: none;
  padding: 0;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.note-metadata {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
}

.meta-item {
  white-space: nowrap;
}

.editor-tools {
  display: flex;
  gap: 0.5rem;
}

.tags-panel,
.summary-panel {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.btn-sm span {
  margin-right: 0.25rem;
}
</style>
