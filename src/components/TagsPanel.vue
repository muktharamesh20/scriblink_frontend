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
      { value: 'High Priority', label: 'High Priority', icon: '●' },
      { value: 'Medium Priority', label: 'Medium Priority', icon: '●' },
      { value: 'Low Priority', label: 'Low Priority', icon: '●' },
      { value: 'Office Hours', label: 'Go to Office Hours', icon: '●' },
      { value: 'Review Needed', label: 'Review Needed', icon: '●' }
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
          // Store tag objects with both label and id
          activeTags.value = response.tags.map(tag => ({
            label: tag.label || tag,
            id: tag._id || tag.id || tag
          }))
        }
      } catch (err) {
        console.error('Error loading tags:', err)
        error.value = 'Failed to load tags'
      }
    }

    const isTagActive = (tagValue) => {
      return activeTags.value.some(tag => tag.label === tagValue)
    }

    const toggleTag = async (tagValue) => {
      const user = authService.getUser()
      if (!user) return

      loading.value = true
      error.value = ''

      try {
        if (isTagActive(tagValue)) {
          // Remove tag - find the tag object to get the ID
          const tagToRemove = activeTags.value.find(tag => tag.label === tagValue)
          if (tagToRemove) {
            // Use tag ID if available, otherwise use the label
            const tagIdentifier = tagToRemove.id || tagToRemove.label
            console.log('🗑️ Removing tag with identifier:', tagIdentifier)
            await requestAPI.untagItem(user, props.note._id, tagIdentifier)
            activeTags.value = activeTags.value.filter(tag => tag.label !== tagValue)
          }
        } else {
          // Add tag
          const response = await requestAPI.tagItem(user, props.note._id, tagValue)
          // Store the tag with the ID returned from the API
          activeTags.value.push({ 
            label: tagValue, 
            id: response.tag || response.tagId || null 
          })
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
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.panel-header {
  margin-bottom: 1rem;
}

.panel-header h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.help-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.tag-button:hover:not(:disabled) {
  border-color: var(--border-accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  background: var(--bg-hover);
}

.tag-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-button.tag-active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  color: var(--text-inverse);
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

.tag-icon {
  font-size: 0.8rem;
  opacity: 0.8;
}

.tag-label {
  white-space: nowrap;
  letter-spacing: 0.025em;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
}
</style>
