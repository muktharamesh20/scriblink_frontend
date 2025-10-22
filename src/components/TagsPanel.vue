<template>
  <div class="tags-panel">
    <div class="panel-header">
      <h3>Tags</h3>
      <p class="help-text">Select tags to organize your note</p>
    </div>

    <div class="tags-container">
      <button
        v-for="tag in availableTags"
        :key="tag.value"
        :class="['tag-button', { 'tag-active': isTagActive(tag.value) }]"
        @click="toggleTag(tag.value)"
        :disabled="loading"
      >
        <span class="tag-icon">{{ tag.icon }}</span>
        <span class="tag-label">{{ tag.label }}</span>
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'TagsPanel',
  props: {
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['tags-updated'],
  setup(props, { emit }) {
    const availableTags = [
      { value: 'High Priority', label: 'High Priority', icon: '🔴' },
      { value: 'Medium Priority', label: 'Medium Priority', icon: '🟡' },
      { value: 'Low Priority', label: 'Low Priority', icon: '🟢' },
      { value: 'Office Hours', label: 'Go to Office Hours', icon: '🏫' },
      { value: 'Review Needed', label: 'Review Needed', icon: '👀' }
    ]

    const activeTags = ref([])
    const loading = ref(false)
    const error = ref('')

    const loadTags = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        const response = await requestAPI.getItemTags(user, props.note._id)
        if (response.tags) {
          activeTags.value = response.tags
        }
      } catch (err) {
        console.error('Error loading tags:', err)
        error.value = 'Failed to load tags'
      }
    }

    const isTagActive = (tagValue) => {
      return activeTags.value.includes(tagValue)
    }

    const toggleTag = async (tagValue) => {
      const user = authService.getUser()
      if (!user) return

      loading.value = true
      error.value = ''

      try {
        if (isTagActive(tagValue)) {
          // Remove tag
          await requestAPI.untagItem(user, props.note._id, tagValue)
          activeTags.value = activeTags.value.filter(t => t !== tagValue)
        } else {
          // Add tag
          await requestAPI.tagItem(user, props.note._id, tagValue)
          activeTags.value.push(tagValue)
        }
        emit('tags-updated')
      } catch (err) {
        console.error('Error toggling tag:', err)
        error.value = err.error || 'Failed to update tag'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      console.log('🔍 [TagsPanel] Component mounted for note:', props.note._id)
      loadTags()
    })

    // Watch for note changes and reload data
    watch(() => props.note._id, (newNoteId, oldNoteId) => {
      if (newNoteId !== oldNoteId) {
        console.log('🔍 [TagsPanel] Note changed from', oldNoteId, 'to', newNoteId)
        activeTags.value = []
        error.value = ''
        loadTags()
      }
    })

    return {
      availableTags,
      activeTags,
      loading,
      error,
      isTagActive,
      toggleTag
    }
  }
}
</script>

<style scoped>
.tags-panel {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.panel-header {
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.help-text {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  color: #555;
}

.tag-button:hover:not(:disabled) {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.tag-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-button.tag-active {
  background: #3498db;
  border-color: #3498db;
  color: white;
  font-weight: 600;
}

.tag-icon {
  font-size: 1.2rem;
}

.tag-label {
  white-space: nowrap;
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
</style>
