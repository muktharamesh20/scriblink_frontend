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
          Edit
        </button>
        <button 
          @click="regenerateSummary" 
          class="btn-icon"
          title="Regenerate summary with AI"
          :disabled="loading || generating"
        >
          {{ generating ? 'Generating...' : 'Regenerate' }}
        </button>
      </div>
    </div>

            <div v-if="loading" class="loading-message">
              <div class="colorful-spinner"></div>
              <span>Loading summary...</span>
            </div>

            <div v-else-if="generating" class="loading-message">
              <div class="colorful-spinner"></div>
              <span>Generating AI summary...</span>
            </div>

    <div v-else class="summary-content">
             <!-- View mode -->
             <div v-if="!isEditing" class="summary-display">
               <div v-if="summary && summary.trim()" class="summary-text" v-html="renderedSummary"></div>
        <div v-else class="empty-summary">
          <p class="empty-message">No summary yet.</p>
          <button 
            @click="generateSummary" 
            class="btn btn-primary btn-sm"
            :disabled="generating"
          >
                    {{ generating ? 'Generating...' : 'Generate AI Summary' }}
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
import { ref, onMounted, watch, defineExpose, computed } from 'vue'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'
import { marked } from 'marked'

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
        console.log('Generating summary for note:', props.note._id)
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
        return '<p>Error rendering markdown</p>'
      }
    })

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
      renderedSummary,
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
  background: transparent;
  border-radius: 0;
  border: none;
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
  color: var(--text-primary); /* Adapts to theme */
  font-weight: 600; /* Make it bolder */
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: var(--bg-card); /* Adapts to theme */
  border: 1px solid var(--border-primary); /* Adapts to theme */
  border-radius: 8px; /* More modern rounded corners */
  padding: 0.75rem 1rem; /* Better padding */
  cursor: pointer;
  font-size: 0.9rem; /* Better font size */
  font-weight: 500; /* Better font weight */
  color: var(--text-primary); /* Adapts to theme */
  transition: all var(--transition-fast); /* Use theme transition */
  box-shadow: var(--shadow-sm); /* Add subtle shadow */
  min-width: 80px; /* Ensure consistent width */
}

.btn-icon:hover:not(:disabled) {
  background: var(--bg-hover); /* Use theme hover color */
  border-color: var(--border-accent); /* Use theme accent border */
  transform: translateY(-2px); /* Subtle lift effect */
  box-shadow: var(--shadow-md); /* Stronger shadow on hover */
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-message {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary); /* Adapts to theme */
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Colorful spinner matching logo aesthetic */
.colorful-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid transparent;
  border-top: 4px solid #ff6b6b; /* Coral red */
  border-right: 4px solid #4ecdc4; /* Teal */
  border-bottom: 4px solid #45b7d1; /* Sky blue */
  border-left: 4px solid #96ceb4; /* Mint green */
  border-radius: 50%;
  animation: colorful-spin 1.2s linear infinite;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
}

@keyframes colorful-spin {
  0% { 
    transform: rotate(0deg);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
  }
  25% { 
    box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
  }
  50% { 
    box-shadow: 0 0 20px rgba(69, 183, 209, 0.3);
  }
  75% { 
    box-shadow: 0 0 20px rgba(150, 206, 180, 0.3);
  }
  100% { 
    transform: rotate(360deg);
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
  }
}

.summary-content {
  margin: 1rem 0;
}

.summary-display {
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  min-height: 100px;
  box-shadow: none;
}

.summary-text {
  margin: 0;
  line-height: 1.6;
  color: var(--text-primary); /* Adapts to theme */
  white-space: pre-wrap;
}

.empty-summary {
  text-align: center;
  padding: 2rem;
}

.empty-message {
  margin: 0 0 1rem 0;
  color: var(--text-secondary); /* Adapts to theme */
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
  border: 1px solid var(--border-primary); /* Adapts to theme */
  border-radius: 8px; /* More modern rounded corners */
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  background: var(--bg-card); /* Adapts to theme */
  color: var(--text-primary); /* Adapts to theme */
  transition: all var(--transition-fast); /* Use theme transition */
}

.summary-textarea:focus {
  outline: none;
  border-color: var(--border-accent); /* Use theme accent border */
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1); /* Subtle focus ring */
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-tertiary); /* Use theme background */
  border: 1px solid var(--border-primary); /* Use theme border */
  border-radius: 8px; /* More modern rounded corners */
  color: var(--text-primary); /* Adapts to theme */
  font-size: 0.9rem;
}

.summary-metadata {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-primary); /* Adapts to theme */
  color: var(--text-secondary); /* Adapts to theme */
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
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-secondary);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: var(--text-muted);
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

/* Markdown styles for summary */
.summary-text h1,
.summary-text h2,
.summary-text h3,
.summary-text h4,
.summary-text h5,
.summary-text h6 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-text h1 { font-size: 1.4rem; }
.summary-text h2 { font-size: 1.2rem; }
.summary-text h3 { font-size: 1.1rem; }
.summary-text h4 { font-size: 1rem; }
.summary-text h5 { font-size: 0.9rem; }
.summary-text h6 { font-size: 0.8rem; color: var(--text-muted); }

.summary-text p {
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.summary-text ul,
.summary-text ol {
  margin-bottom: 0.75rem;
  padding-left: 1.25rem;
}

.summary-text li {
  margin-bottom: 0.25rem;
}

.summary-text blockquote {
  border-left: 3px solid var(--accent-primary);
  margin: 0.75rem 0;
  padding: 0.5rem 0.75rem;
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  font-style: italic;
}

.summary-text code {
  background-color: var(--bg-tertiary);
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85em;
  color: var(--accent-warning);
}

.summary-text pre {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.75rem 0;
  font-size: 0.85rem;
}

.summary-text pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.summary-text strong {
  font-weight: 600;
  color: #2c3e50;
}

.summary-text em {
  font-style: italic;
  color: #555;
}

.summary-text a {
  color: #3498db;
  text-decoration: none;
}

.summary-text a:hover {
  text-decoration: underline;
}
</style>
