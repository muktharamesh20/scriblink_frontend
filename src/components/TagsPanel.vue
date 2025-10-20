<template>
  <div class="tags-panel">
    <div class="panel-header">
      <h4>Tags</h4>
      <button @click="showAddForm = !showAddForm" class="btn btn-sm">
        {{ showAddForm ? 'Cancel' : '+' }}
      </button>
    </div>

    <div v-if="showAddForm" class="add-tag-form">
      <input 
        v-model="newTagLabel" 
        type="text" 
        placeholder="Tag name"
        class="form-input"
        @keyup.enter="addTag"
      />
      <div class="form-actions">
        <button @click="addTag" class="btn btn-primary btn-sm">Add</button>
        <button @click="cancelAdd" class="btn btn-secondary btn-sm">Cancel</button>
      </div>
    </div>

    <div class="tags-list">
      <div v-if="tags.length === 0" class="empty-tags">
        <p>No tags yet</p>
      </div>
      
      <div v-else class="tags-grid">
        <div 
          v-for="tag in tags" 
          :key="tag._id"
          class="tag-item"
        >
          <span class="tag-label">{{ tag.label }}</span>
          <button 
            @click="removeTag(tag)" 
            class="btn-remove"
            title="Remove tag"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { tagsAPI } from '../services/apiServices.js'
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
    const tags = ref([])
    const showAddForm = ref(false)
    const newTagLabel = ref('')
    const loading = ref(false)

    const loadTags = async () => {
      const user = authService.getUser()
      if (!user || !props.note) return

      try {
        const noteTags = await tagsAPI.getTagsForItem(user, props.note._id)
        tags.value = noteTags || []
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }

    const addTag = async () => {
      if (!newTagLabel.value.trim()) return

      const user = authService.getUser()
      if (!user) return

      loading.value = true
      try {
        await tagsAPI.addTag(user, newTagLabel.value.trim(), props.note._id)
        await loadTags()
        emit('tags-updated')
        cancelAdd()
      } catch (error) {
        console.error('Error adding tag:', error)
        alert('Error adding tag: ' + (error.error || 'Unknown error'))
      } finally {
        loading.value = false
      }
    }

    const removeTag = async (tag) => {
      if (!confirm(`Remove tag "${tag.label}" from this note?`)) {
        return
      }

      try {
        await tagsAPI.removeTagFromItem(tag._id, props.note._id)
        await loadTags()
        emit('tags-updated')
      } catch (error) {
        console.error('Error removing tag:', error)
        alert('Error removing tag: ' + (error.error || 'Unknown error'))
      }
    }

    const cancelAdd = () => {
      showAddForm.value = false
      newTagLabel.value = ''
    }

    onMounted(() => {
      loadTags()
    })

    return {
      tags,
      showAddForm,
      newTagLabel,
      loading,
      addTag,
      removeTag,
      cancelAdd
    }
  }
}
</script>

<style scoped>
.tags-panel {
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

.add-tag-form {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tags-list {
  min-height: 50px;
}

.empty-tags {
  text-align: center;
  color: #666;
  padding: 1rem;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  display: flex;
  align-items: center;
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  gap: 0.25rem;
}

.tag-label {
  font-weight: 500;
}

.btn-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: rgba(255,255,255,0.2);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}
</style>
