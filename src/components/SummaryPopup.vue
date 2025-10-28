<template>
  <div v-if="isVisible" class="summary-popup-overlay" @click="closePopup">
    <div class="summary-popup" @click.stop>
      <div class="summary-popup-header">
        <h3>{{ note.title || 'Untitled Note' }}</h3>
        <button @click="closePopup" class="btn-close">×</button>
      </div>
      
      <div class="summary-popup-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading summary...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <p class="error-message">{{ error }}</p>
          <button @click="loadSummary" class="btn btn-primary btn-sm">Retry</button>
        </div>
        
        <div v-else-if="!summary" class="no-summary-state">
          <div v-if="!isEditing">
            <div class="no-summary-icon">✨</div>
            <p>No summary available for this note.</p>
            <div class="no-summary-actions">
              <button @click="generateSummary" class="btn btn-primary btn-sm" :disabled="generating">
                {{ generating ? 'Generating...' : 'Generate Summary' }}
              </button>
              <button @click="createOwnSummary" class="btn btn-secondary btn-sm">
                Create Your Own
              </button>
            </div>
          </div>
          
          <div v-else class="summary-edit">
            <div class="summary-actions">
              <button @click="saveSummary" class="btn btn-primary btn-sm" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button @click="cancelEditing" class="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
            <textarea 
              v-model="editingSummary" 
              class="summary-textarea"
              placeholder="Enter summary..."
              rows="8"
            ></textarea>
          </div>
        </div>
        
        <div v-else class="summary-content">
          <div class="summary-actions">
            <button @click="startEditing" class="btn btn-secondary btn-sm" v-if="!isEditing">
              Edit
            </button>
            <button @click="saveSummary" class="btn btn-primary btn-sm" v-if="isEditing" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
            <button @click="cancelEditing" class="btn btn-secondary btn-sm" v-if="isEditing">
              Cancel
            </button>
            <button @click="regenerateSummary" class="btn btn-secondary btn-sm" v-if="!isEditing">
              Regenerate
            </button>
          </div>
          
          <div v-if="isEditing" class="summary-edit">
            <textarea 
              v-model="editingSummary" 
              class="summary-textarea"
              placeholder="Enter summary..."
              rows="8"
            ></textarea>
          </div>
          
          <div v-else class="summary-display" v-html="renderedSummary"></div>
          
          <div class="summary-meta" v-if="summary">
            <small class="summary-date">
              {{ summaryDate ? `Last updated: ${formatDate(summaryDate)}` : '' }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { authService } from '../services/authService.js'
import { requestAPI } from '../services/apiServices.js'

export default {
  name: 'SummaryPopup',
  props: {
    note: {
      type: Object,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const summary = ref('')
    const editingSummary = ref('')
    const isEditing = ref(false)
    const loading = ref(false)
    const saving = ref(false)
    const generating = ref(false)
    const error = ref('')
    const summaryDate = ref(null)

    // Load summary when popup opens
    watch(() => props.isVisible, async (isVisible) => {
      if (isVisible) {
        await loadSummary()
      }
    })

    const loadSummary = async () => {
      const user = authService.getUser()
      if (!user) return

      loading.value = true
      error.value = ''

      try {
        console.log('🔍 [SummaryPopup] Loading summary for note:', props.note._id)
        const response = await requestAPI.getSummary(user, props.note._id)
        console.log('🔍 [SummaryPopup] Summary response:', response)
        
        if (response.summary) {
          summary.value = response.summary
          summaryDate.value = new Date()
        } else {
          summary.value = ''
        }
      } catch (err) {
        console.error('Error loading summary:', err)
        
        // Check if this is a "no summary found" error vs actual API failure
        if (err.error && err.error.includes('No summary found')) {
          // This is expected - no summary exists yet
          summary.value = ''
          error.value = ''
        } else {
          // This is an actual API failure
          error.value = 'Failed to load summary'
        }
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
        console.log('Generating summary for note:', props.note._id)
        const response = await requestAPI.generateSummary(user, props.note._id)
        
        if (response.summary) {
          summary.value = response.summary
          summaryDate.value = new Date()
        } else if (response.error) {
          error.value = 'Cannot generate high quality summary. Please try again or write your own.'
        }
      } catch (err) {
        console.error('Error generating summary:', err)
        error.value = 'Cannot generate high quality summary. Please try again or write your own.'
      } finally {
        generating.value = false
      }
    }

    const regenerateSummary = async () => {
      if (confirm('Generate a new AI summary? This will replace the current summary.')) {
        await generateSummary()
      }
    }

    const createOwnSummary = () => {
      // Start editing mode with empty summary
      editingSummary.value = ''
      isEditing.value = true
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
        summaryDate.value = new Date()
        isEditing.value = false
      } catch (err) {
        console.error('Error saving summary:', err)
        error.value = err.error || 'Failed to save summary'
      } finally {
        saving.value = false
      }
    }

    const closePopup = () => {
      emit('close')
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }

    // Configure marked for summary rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    })

    // Computed property for rendered markdown summary
    const renderedSummary = computed(() => {
      if (!summary.value) return ''
      try {
        return marked(summary.value)
      } catch (error) {
        console.error('Error rendering summary markdown:', error)
        return '<p>Error rendering summary</p>'
      }
    })

    return {
      summary,
      editingSummary,
      isEditing,
      loading,
      saving,
      generating,
      error,
      summaryDate,
      loadSummary,
      generateSummary,
      regenerateSummary,
      createOwnSummary,
      startEditing,
      cancelEditing,
      saveSummary,
      closePopup,
      formatDate,
      renderedSummary
    }
  }
}
</script>

<style scoped>
.summary-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.summary-popup {
  background: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.summary-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  border-radius: 10px 10px 0 0;
}

.summary-popup-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.summary-popup-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.error-state,
.no-summary-state {
  text-align: center;
  padding: 2rem 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--border-secondary);
  border-top: 3px solid var(--border-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-summary-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-summary-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-message {
  color: var(--text-error);
  margin-bottom: 1rem;
}

.summary-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-edit {
  margin-bottom: 1rem;
}

.summary-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
}

.summary-textarea:focus {
  outline: none;
  border-color: var(--border-accent);
}

.summary-display {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.summary-display :deep(h1),
.summary-display :deep(h2),
.summary-display :deep(h3) {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.summary-display :deep(p) {
  margin-bottom: 0.75rem;
}

.summary-display :deep(p:last-child) {
  margin-bottom: 0;
}

.summary-display :deep(ul),
.summary-display :deep(ol) {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.summary-display :deep(li) {
  margin-bottom: 0.25rem;
}

.summary-display :deep(strong) {
  color: var(--text-primary);
  font-weight: 600;
}

.summary-display :deep(em) {
  color: var(--text-secondary);
  font-style: italic;
}

.summary-meta {
  text-align: right;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-secondary);
}

.summary-date {
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .summary-popup {
    margin: 0.5rem;
    max-height: 90vh;
  }
  
  .summary-popup-header {
    padding: 0.75rem 1rem;
  }
  
  .summary-popup-content {
    padding: 1rem;
  }
  
  .summary-actions {
    flex-direction: column;
  }
  
  .summary-actions .btn {
    width: 100%;
  }
}
</style>
