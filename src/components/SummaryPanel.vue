<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h3>Summary</h3>
      <div class="panel-actions">
        <button 
          v-if="!isEditing" 
          @click="startEditing" 
          class="btn-icon"
          title="Edit summary"
          :disabled="loading"
        >
          ✏️
        </button>
        <button 
          @click="regenerateSummary" 
          class="btn-icon"
          title="Regenerate summary with AI"
          :disabled="loading || generating"
        >
          {{ generating ? '⏳' : '🔄' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-message">
      <span class="spinner">⏳</span> Loading summary...
    </div>

    <div v-else-if="generating" class="loading-message">
      <span class="spinner">🤖</span> Generating AI summary...
    </div>

    <div v-else class="summary-content">
      <!-- View mode -->
      <div v-if="!isEditing" class="summary-display">
        <p v-if="summary && summary.trim()" class="summary-text">
          {{ summary }}
        </p>
        <div v-else class="empty-summary">
          <p class="empty-message">No summary yet.</p>
          <button 
            @click="generateSummary" 
            class="btn btn-primary btn-sm"
            :disabled="generating"
          >
            {{ generating ? '⏳ Generating...' : '🤖 Generate AI Summary' }}
          </button>
        </div>
      </div>

      <!-- Edit mode -->
      <div v-else class="summary-edit">
        <textarea 
          v-model="editingSummary"
          class="summary-textarea"
          placeholder="Enter a custom summary for this note..."
          rows="5"
        ></textarea>
        <div class="edit-actions">
          <button @click="saveSummary" class="btn btn-primary btn-sm" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button @click="cancelEditing" class="btn btn-secondary btn-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="lastGenerated" class="summary-metadata">
      <small>Last updated: {{ formatDate(lastGenerated) }}</small>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, defineExpose } from 'vue'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'SummaryPanel',
  props: {
    note: {
      type: Object,
      required: true
    },
    autoGenerate: {
      type: Boolean,
      default: false
    }
  },
  emits: ['summary-updated'],
  setup(props, { emit }) {
    const summary = ref('')
    const editingSummary = ref('')
    const isEditing = ref(false)
    const loading = ref(false)
    const saving = ref(false)
    const generating = ref(false)
    const error = ref('')
    const lastGenerated = ref(null)
    const initialContentLength = ref(0)

    const loadSummary = async () => {
      const user = authService.getUser()
      if (!user) return

      loading.value = true
      error.value = ''

      try {
        console.log('🔍 [SummaryPanel] Loading summary for note:', props.note._id, 'user:', user)
        const response = await requestAPI.getSummary(user, props.note._id)
        console.log('🔍 [SummaryPanel] Summary response:', response)
        if (response.summary) {
          summary.value = response.summary
          lastGenerated.value = new Date()
        } else {
          summary.value = ''
        }
      } catch (err) {
        console.error('Error loading summary:', err)
        // It's okay if there's no summary yet
        summary.value = ''
      } finally {
        loading.value = false
      }
    }

    const generateSummary = async () => {
      const user = authService.getUser()
      if (!user) return

      // Check if note has content
      if (!props.note.content || props.note.content.trim().length < 10) {
        error.value = 'Note content is too short to generate a summary'
        return
      }

      generating.value = true
      error.value = ''

      try {
        console.log('🤖 Generating summary for note:', props.note._id)
        const response = await requestAPI.generateSummary(user, props.note._id)
        
        if (response.summary) {
          summary.value = response.summary
          lastGenerated.value = new Date()
          initialContentLength.value = props.note.content.length
          emit('summary-updated')
        } else if (response.error) {
          error.value = response.error
        }
      } catch (err) {
        console.error('Error generating summary:', err)
        error.value = err.error || 'Failed to generate summary'
      } finally {
        generating.value = false
      }
    }

    const regenerateSummary = async () => {
      if (confirm('Generate a new AI summary? This will replace the current summary.')) {
        await generateSummary()
      }
    }

    const startEditing = () => {
      editingSummary.value = summary.value
      isEditing.value = true
    }

    const cancelEditing = () => {
      editingSummary.value = ''
      isEditing.value = false
    }

    const saveSummary = async () => {
      const user = authService.getUser()
      if (!user) return

      saving.value = true
      error.value = ''

      try {
        await requestAPI.setSummary(user, props.note._id, editingSummary.value)
        summary.value = editingSummary.value
        lastGenerated.value = new Date()
        initialContentLength.value = props.note.content.length
        isEditing.value = false
        emit('summary-updated')
      } catch (err) {
        console.error('Error saving summary:', err)
        error.value = err.error || 'Failed to save summary'
      } finally {
        saving.value = false
      }
    }

    const checkForSignificantChanges = () => {
      if (!props.note.content) return false
      
      const currentLength = props.note.content.length
      const changePercent = Math.abs(currentLength - initialContentLength.value) / Math.max(initialContentLength.value, 1)
      
      // Consider 30% change as significant
      return changePercent > 0.3
    }

    const autoGenerateSummaryIfNeeded = async () => {
      // Only auto-generate if:
      // 1. Summary is empty or whitespace
      // 2. Note has substantial content
      if ((!summary.value || summary.value.trim() === '') && props.note.content && props.note.content.trim().length > 50) {
        console.log('📝 Auto-generating summary for note on exit')
        await generateSummary()
      } else if (summary.value && checkForSignificantChanges()) {
        // Notify user about significant changes
        console.log('⚠️ Significant changes detected. Consider regenerating summary.')
      }
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }

    // Watch for auto-generate trigger
    watch(() => props.autoGenerate, (shouldAuto) => {
      if (shouldAuto) {
        autoGenerateSummaryIfNeeded()
      }
    })

    onMounted(() => {
      console.log('🔍 [SummaryPanel] Component mounted for note:', props.note._id)
      loadSummary()
      initialContentLength.value = props.note.content?.length || 0
    })

    // Watch for note changes and reload data
    watch(() => props.note._id, (newNoteId, oldNoteId) => {
      if (newNoteId !== oldNoteId) {
        console.log('🔍 [SummaryPanel] Note changed from', oldNoteId, 'to', newNoteId)
        summary.value = ''
        error.value = ''
        lastGenerated.value = null
        loadSummary()
        initialContentLength.value = props.note.content?.length || 0
      }
    })

    // Expose method for parent to trigger auto-generation
    defineExpose({
      autoGenerateSummaryIfNeeded
    })

    return {
      summary,
      editingSummary,
      isEditing,
      loading,
      saving,
      generating,
      error,
      lastGenerated,
      loadSummary,
      generateSummary,
      regenerateSummary,
      startEditing,
      cancelEditing,
      saveSummary,
      autoGenerateSummaryIfNeeded,
      formatDate
    }
  }
}
</script>

<style scoped>
.summary-panel {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.btn-icon:hover:not(:disabled) {
  background: #3498db;
  border-color: #3498db;
  transform: scale(1.1);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-message {
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1rem;
}

.spinner {
  display: inline-block;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.summary-content {
  margin: 1rem 0;
}

.summary-display {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
  min-height: 100px;
}

.summary-text {
  margin: 0;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
}

.empty-summary {
  text-align: center;
  padding: 2rem;
}

.empty-message {
  margin: 0 0 1rem 0;
  color: #999;
  font-style: italic;
}

.summary-edit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
}

.summary-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  font-size: 0.9rem;
}

.summary-metadata {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ddd;
  color: #999;
  font-size: 0.85rem;
}

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}
</style>
