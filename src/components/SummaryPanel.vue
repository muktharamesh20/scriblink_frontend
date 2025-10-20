<template>
  <div class="summary-panel">
    <div class="panel-header">
      <h4>Summary</h4>
      <div class="panel-actions">
        <button @click="generateAISummary" class="btn btn-primary btn-sm" :disabled="generating">
          {{ generating ? 'Generating...' : '🤖 AI Summary' }}
        </button>
        <button @click="showManualForm = !showManualForm" class="btn btn-sm">
          {{ showManualForm ? 'Cancel' : '✏️ Manual' }}
        </button>
      </div>
    </div>

    <div v-if="showManualForm" class="manual-summary-form">
      <textarea 
        v-model="manualSummary" 
        placeholder="Enter summary manually..."
        class="form-textarea"
        rows="3"
      ></textarea>
      <div class="form-actions">
        <button @click="saveManualSummary" class="btn btn-primary btn-sm">Save</button>
        <button @click="cancelManual" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>

    <div class="summary-content">
      <div v-if="!currentSummary" class="empty-summary">
        <p>No summary available</p>
        <p class="text-muted">Create a summary manually or generate one with AI</p>
      </div>
      
      <div v-else class="summary-display">
        <div class="summary-text">{{ currentSummary }}</div>
        <div class="summary-actions">
          <button @click="editSummary" class="btn btn-sm btn-secondary">Edit</button>
          <button @click="deleteSummary" class="btn btn-sm btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { summariesAPI } from '../services/apiServices.js'

export default {
  name: 'SummaryPanel',
  props: {
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['summary-updated'],
  setup(props, { emit }) {
    const currentSummary = ref('')
    const showManualForm = ref(false)
    const manualSummary = ref('')
    const generating = ref(false)
    const loading = ref(false)

    const loadSummary = async () => {
      // Note: The API doesn't have a direct "get summary" endpoint
      // This would need to be implemented based on how summaries are stored
      // For now, we'll assume summaries are stored with the note or separately
      currentSummary.value = ''
    }

    const generateAISummary = async () => {
      if (!props.note || !props.note.content) {
        alert('Note must have content to generate AI summary')
        return
      }

      generating.value = true
      try {
        const response = await summariesAPI.setSummaryWithAI(props.note._id, props.note.content)
        if (response.summary) {
          currentSummary.value = response.summary
          emit('summary-updated')
        }
      } catch (error) {
        console.error('Error generating AI summary:', error)
        alert('Error generating AI summary: ' + (error.error || 'Unknown error'))
      } finally {
        generating.value = false
      }
    }

    const saveManualSummary = async () => {
      if (!manualSummary.value.trim()) return

      try {
        const response = await summariesAPI.setSummary(props.note._id, manualSummary.value.trim())
        if (response.summary) {
          currentSummary.value = response.summary
          emit('summary-updated')
          cancelManual()
        }
      } catch (error) {
        console.error('Error saving manual summary:', error)
        alert('Error saving summary: ' + (error.error || 'Unknown error'))
      }
    }

    const editSummary = () => {
      manualSummary.value = currentSummary.value
      showManualForm.value = true
    }

    const deleteSummary = async () => {
      if (!confirm('Are you sure you want to delete this summary?')) {
        return
      }

      try {
        await summariesAPI.deleteSummary(props.note._id)
        currentSummary.value = ''
        emit('summary-updated')
      } catch (error) {
        console.error('Error deleting summary:', error)
        alert('Error deleting summary: ' + (error.error || 'Unknown error'))
      }
    }

    const cancelManual = () => {
      showManualForm.value = false
      manualSummary.value = ''
    }

    onMounted(() => {
      loadSummary()
    })

    return {
      currentSummary,
      showManualForm,
      manualSummary,
      generating,
      generateAISummary,
      saveManualSummary,
      editSummary,
      deleteSummary,
      cancelManual
    }
  }
}
</script>

<style scoped>
.summary-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h4 {
  color: #2c3e50;
  font-size: 1rem;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.manual-summary-form {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.form-textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.summary-content {
  min-height: 50px;
}

.empty-summary {
  text-align: center;
  color: #666;
  padding: 1rem;
}

.empty-summary p {
  margin-bottom: 0.5rem;
}

.summary-display {
  background: white;
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.summary-text {
  color: #333;
  line-height: 1.5;
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.summary-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.text-muted {
  color: #666;
  font-size: 0.8rem;
}
</style>
