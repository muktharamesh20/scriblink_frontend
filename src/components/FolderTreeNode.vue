<template>
  <div class="folder-node">
    <div 
      class="tree-item"
      :class="{ 
        active: currentFolder && currentFolder._id === folder._id,
        'has-children': hasChildren,
        'drag-over': isDragOver
      }"
      :style="{ paddingLeft: (level * 20) + 'px' }"
      @click="$emit('folder-selected', folder)"
      draggable="true"
      @dragstart="handleDragStart"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div class="folder-item">
        <button 
          @click.stop="toggleExpanded" 
          class="btn-toggle"
          v-if="hasChildren"
          :class="{ expanded: isExpanded }"
          title="Toggle folder"
        >
          {{ isExpanded ? '📂' : '📁' }}
        </button>
        <span v-else class="folder-spacer"></span>
        
        <span class="folder-icon">📁</span>
        <span class="folder-name">{{ folder.title }}</span>
        <div class="folder-actions">
          <button 
            @click.stop="deleteFolder(folder)" 
            class="btn-delete"
            title="Delete folder"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Notes in this folder -->
    <div v-if="isExpanded && folderNotes.length > 0" class="folder-notes">
      <div 
        v-for="note in folderNotes" 
        :key="note._id"
        class="note-item"
        :class="{ active: selectedNote && selectedNote._id === note._id }"
        :style="{ paddingLeft: ((level + 1) * 20) + 'px' }"
        @click="$emit('note-selected', note)"
      >
        <span class="note-icon">📄</span>
        <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
      </div>
    </div>

    <!-- Nested folders -->
    <div v-if="isExpanded && hasChildren" class="nested-folders">
      <FolderTreeNode 
        v-for="child in folder.children" 
        :key="child._id"
        :folder="child"
        :current-folder="currentFolder"
        :level="level + 1"
        :all-notes="allNotes"
        :selected-note="selectedNote"
        @folder-selected="$emit('folder-selected', $event)"
        @folder-created="$emit('folder-created')"
        @folder-deleted="$emit('folder-deleted')"
        @folder-moved="$emit('folder-moved')"
        @note-selected="$emit('note-selected', $event)"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { requestAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'

export default {
  name: 'FolderTreeNode',
  props: {
    folder: {
      type: Object,
      required: true
    },
    currentFolder: {
      type: Object,
      default: null
    },
    level: {
      type: Number,
      default: 0
    },
    allNotes: {
      type: Array,
      default: () => []
    },
    selectedNote: {
      type: Object,
      default: null
    }
  },
  emits: ['folder-selected', 'folder-created', 'folder-deleted', 'folder-moved', 'note-selected'],
  setup(props, { emit }) {
    const isExpanded = ref(false)
    const isDragOver = ref(false)
    
    // Debug: Log the folder object
    console.log('🔍 FolderTreeNode setup - folder:', props.folder)
    console.log('🔍 FolderTreeNode setup - folder keys:', Object.keys(props.folder))
    console.log('🔍 FolderTreeNode setup - folder._id:', props.folder._id)

    const hasChildren = computed(() => {
      return props.folder.children && props.folder.children.length > 0
    })

    // Get notes that belong to this folder
    const folderNotes = computed(() => {
      return props.allNotes.filter(note => note.folderId === props.folder._id)
    })

    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value
    }

    const deleteFolder = async (folder) => {
      if (!confirm(`Are you sure you want to delete "${folder.title}"?`)) {
        return
      }

      const user = authService.getUser()
      if (!user) return

      try {
        await requestAPI.deleteFolder(folder._id)
        emit('folder-deleted')
      } catch (error) {
        console.error('Error deleting folder:', error)
        alert('Error deleting folder: ' + (error.error || 'Unknown error'))
      }
    }

    const handleDragStart = (event) => {
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'folder',
        id: props.folder._id,
        title: props.folder.title
      }))
      event.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const handleDragEnter = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      // Only set drag over to false if we're leaving the entire folder node
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOver.value = false
      }
    }

    const handleDrop = async (event) => {
      event.preventDefault()
      isDragOver.value = false
      
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      console.log('🔍 handleDrop debug:', {
        data,
        targetFolder: props.folder._id,
        targetFolderTitle: props.folder.title
      })
      
      if (data.type === 'folder' && data.id !== props.folder._id) {
        // Move folder to this folder
        const user = authService.getUser()
        if (!user) {
          console.error('❌ No user found for moveFolder')
          return
        }

        console.log('📁 Moving folder:', data.id, 'to:', props.folder._id)
        console.log('🔍 Debug moveFolder params:', {
          folderId: data.id,
          newParentId: props.folder._id,
          folder: props.folder,
          folderKeys: Object.keys(props.folder),
          folderIdValue: props.folder._id,
          folderIdType: typeof props.folder._id
        })
        
        try {
          const result = await requestAPI.moveFolder(data.id, props.folder._id)
          console.log('✅ Folder moved successfully:', result)
          emit('folder-moved')
        } catch (error) {
          console.error('❌ Error moving folder:', error)
          alert('Error moving folder: ' + (error.error || 'Unknown error'))
        }
      }
    }

    return {
      isExpanded,
      isDragOver,
      hasChildren,
      folderNotes,
      toggleExpanded,
      deleteFolder,
      handleDragStart,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop
    }
  }
}
</script>

<style scoped>
.folder-node {
  width: 100%;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.tree-item:hover {
  background-color: #f5f5f5;
}

.tree-item.active {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.tree-item.drag-over {
  background-color: #e8f5e8;
  border: 2px dashed #4caf50;
}

.tree-item.dragging {
  opacity: 0.5;
}

.folder-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.folder-icon {
  font-size: 1.2rem;
}

.folder-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
}

.folder-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-item:hover .folder-actions {
  opacity: 1;
}

.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.btn-toggle:hover {
  background-color: #e0e0e0;
}

.btn-toggle.expanded {
  transform: rotate(0deg);
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
  font-size: 0.8rem;
  color: #f44336;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background-color: #ffebee;
}

.nested-folders {
  margin-left: 0;
}

/* Indentation for nested levels */
.tree-item[style*="paddingLeft"] {
  border-left: 1px solid #e0e0e0;
  margin-left: 0.5rem;
}

.folder-spacer {
  width: 1.5rem;
  display: inline-block;
}

.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 3px;
  font-size: 0.8rem;
  transition: background-color 0.2s;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle:hover {
  background-color: #e0e0e0;
}

.btn-toggle.expanded {
  transform: rotate(0deg);
}

/* Notes styling */
.folder-notes {
  margin-bottom: 0.5rem;
}

.note-item {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin: 0.125rem 0;
}

.note-item:hover {
  background-color: #f5f5f5;
}

.note-item.active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.note-icon {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.note-title {
  font-size: 0.9rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
