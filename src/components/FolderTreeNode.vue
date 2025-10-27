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
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div class="folder-item">
        <button 
          @click.stop="toggleExpanded" 
          class="btn-toggle"
          :class="{ expanded: isExpanded }"
          title="Toggle folder"
        >
          {{ isExpanded ? '▼' : '▶' }}
        </button>
        
        <span class="folder-name">{{ folder.title }}</span>
        <div class="folder-actions">
          <button 
            @click.stop="console.log('Delete button clicked!', folder); deleteFolder(folder)" 
            class="btn-delete"
            title="Delete folder"
          >
            ×
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
        draggable="true"
        @dragstart="handleNoteDragStart($event, note)"
        @dragend="handleNoteDragEnd"
      >
        <span class="note-icon">•</span>
        <span class="note-title">{{ note.title || 'Untitled Note' }}</span>
        <button 
          @click.stop="deleteNote(note)" 
          class="btn-delete-note"
          title="Delete note"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Nested folders -->
    <div v-if="isExpanded && folder.children && folder.children.length > 0" class="nested-folders">
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
        @note-moved="$emit('note-moved')"
        @drag-start="$emit('drag-start')"
        @drag-end="$emit('drag-end')"
        @folder-drag-over="$emit('folder-drag-over')"
        @folder-drag-leave="$emit('folder-drag-leave')"
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
  emits: ['folder-selected', 'folder-created', 'folder-deleted', 'folder-moved', 'note-selected', 'note-moved', 'note-deleted', 'drag-start', 'drag-end', 'folder-drag-over', 'folder-drag-leave'],
  setup(props, { emit }) {
    // Auto-expand folders that have children
    const hasSubfolders = props.folder.children && props.folder.children.length > 0
    const isExpanded = ref(hasSubfolders) // Start expanded if has subfolders
    const isDragOver = ref(false)
    
    // Debug: Log the folder object
    console.log('🔍 FolderTreeNode setup - folder:', props.folder)
    console.log('🔍 FolderTreeNode setup - folder keys:', Object.keys(props.folder))
    console.log('🔍 FolderTreeNode setup - folder._id:', props.folder._id)
    console.log('🔍 FolderTreeNode setup - folder.children:', props.folder.children)

    const hasChildren = computed(() => {
      // Folder has children if it has subfolders OR notes
      const hasSubfolders = props.folder.children && props.folder.children.length > 0
      const hasNotes = folderNotes.value.length > 0
      return hasSubfolders || hasNotes
    })

    // Get notes that belong to this folder (using computed folderId from backend)
    const folderNotes = computed(() => {
      return props.allNotes.filter(note => note.folderId === props.folder._id)
    })

    const toggleExpanded = () => {
      isExpanded.value = !isExpanded.value
    }

    const deleteFolder = async (folder) => {
      console.log('🗑️ deleteFolder called with:', folder)
      
      if (!confirm(`Are you sure you want to delete "${folder.title}"?`)) {
        console.log('❌ User cancelled deletion')
        return
      }

      console.log('✅ User confirmed deletion')
      const user = authService.getUser()
      if (!user) {
        console.log('❌ No user found')
        return
      }

      console.log('🔄 Calling requestAPI.deleteFolder with:', { folderId: folder._id, user })
      try {
        const result = await requestAPI.deleteFolder(folder._id, user)
        console.log('✅ Folder deleted successfully:', result)
        emit('folder-deleted')
      } catch (error) {
        console.error('❌ Error deleting folder:', error)
        alert('Error deleting folder: ' + (error.error || 'Unknown error'))
      }
    }

    const deleteNote = async (note) => {
      console.log('🗑️ deleteNote called with:', note)
      
      if (!confirm(`Are you sure you want to delete "${note.title || 'Untitled Note'}"?`)) {
        console.log('❌ User cancelled deletion')
        return
      }

      console.log('✅ User confirmed deletion')
      const user = authService.getUser()
      if (!user) {
        console.log('❌ No user found')
        return
      }

      console.log('🔄 Calling requestAPI.deleteNote with:', { noteId: note._id, user })
      try {
        const result = await requestAPI.deleteNote(note._id, user)
        console.log('✅ Note deleted successfully:', result)
        emit('note-deleted')
      } catch (error) {
        console.error('❌ Error deleting note:', error)
        alert('Error deleting note: ' + (error.error || 'Unknown error'))
      }
    }

    const handleDragStart = (event) => {
      console.log('🚀 [FolderTreeNode.handleDragStart] Starting drag operation');
      emit('drag-start')
      
      console.log('🔍 [FolderTreeNode.handleDragStart] Folder being dragged:', {
        id: props.folder._id,
        title: props.folder.title,
        idType: typeof props.folder._id
      });
      
      const dragData = {
        type: 'folder',
        id: props.folder._id,
        title: props.folder.title
      };
      
      console.log('🔍 [FolderTreeNode.handleDragStart] Setting drag data:', dragData);
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
      event.dataTransfer.effectAllowed = 'move'
      
      console.log('✅ [FolderTreeNode.handleDragStart] Drag operation initialized');
    }

    const handleDragEnd = () => {
      console.log('🏁 [FolderTreeNode.handleDragEnd] Drag ended');
      emit('drag-end')
    }

    const handleNoteDragStart = (event, note) => {
      emit('drag-start')
      event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'note',
        id: note._id,
        title: note.title || 'Untitled Note'
      }))
      event.dataTransfer.effectAllowed = 'move'
    }

    const handleNoteDragEnd = () => {
      emit('drag-end')
    }

    const handleDragOver = (event) => {
      console.log('🔍 [FolderTreeNode.handleDragOver] Drag over event');
      event.preventDefault()
      event.stopPropagation() // Prevent event from bubbling to parent folders
      event.dataTransfer.dropEffect = 'move'
      emit('folder-drag-over')
    }

    const handleDragEnter = (event) => {
      console.log('🔍 [FolderTreeNode.handleDragEnter] Drag enter event');
      event.preventDefault()
      event.stopPropagation() // Prevent event from bubbling to parent folders
      isDragOver.value = true
      emit('folder-drag-over')
      console.log('🔍 [FolderTreeNode.handleDragEnter] Set isDragOver to true');
    }

    const handleDragLeave = (event) => {
      console.log('🔍 [FolderTreeNode.handleDragLeave] Drag leave event');
      // Only set drag over to false if we're leaving the entire folder node
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOver.value = false
        emit('folder-drag-leave')
        console.log('🔍 [FolderTreeNode.handleDragLeave] Set isDragOver to false');
      }
    }

    const handleDrop = async (event) => {
      console.log('🚀 [FolderTreeNode.handleDrop] Starting handleDrop');
      event.preventDefault()
      event.stopPropagation()
      isDragOver.value = false
      emit('folder-drag-leave') // Clear folder drag state
      emit('drag-end') // Clear global drag state
      
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      console.log('🔍 [FolderTreeNode.handleDrop] Drop data:', {
        data,
        targetFolder: props.folder._id,
        targetFolderTitle: props.folder.title,
        targetFolderType: typeof props.folder._id
      })
      
      if (data.type === 'folder' && data.id !== props.folder._id) {
        console.log('📁 [FolderTreeNode.handleDrop] Processing folder move operation');
        // Move folder to this folder
        const user = authService.getUser()
        console.log('🔍 [FolderTreeNode.handleDrop] User check:', { user, hasUser: !!user });
        if (!user) {
          console.error('❌ [FolderTreeNode.handleDrop] No user found for moveFolder')
          return
        }

        // Check if this operation is already in progress to prevent duplicates
        const operationKey = `move-${data.id}-${props.folder._id}`
        console.log('🔍 [FolderTreeNode.handleDrop] Operation key:', operationKey);
        console.log('🔍 [FolderTreeNode.handleDrop] Pending operations check:', { 
          hasPendingOps: !!window.pendingOperations, 
          isPending: window.pendingOperations?.has(operationKey) 
        });
        
        if (window.pendingOperations && window.pendingOperations.has(operationKey)) {
          console.log('⏳ [FolderTreeNode.handleDrop] Operation already in progress, skipping duplicate')
          return
        }
        
        // Mark operation as in progress
        if (!window.pendingOperations) {
          window.pendingOperations = new Set()
        }
        window.pendingOperations.add(operationKey)
        console.log('🔍 [FolderTreeNode.handleDrop] Added operation to pending set');

        console.log('📁 [FolderTreeNode.handleDrop] Moving folder:', data.id, 'to:', props.folder._id)
        console.log('🔍 [FolderTreeNode.handleDrop] Move parameters:', {
          sourceFolderId: data.id,
          targetFolderId: props.folder._id,
          targetFolder: props.folder,
          targetFolderKeys: Object.keys(props.folder),
          targetFolderIdValue: props.folder._id,
          targetFolderIdType: typeof props.folder._id,
          user: user
        })
        
        try {
          console.log('🔄 [FolderTreeNode.handleDrop] Calling requestAPI.moveFolder');
          const result = await requestAPI.moveFolder(data.id, props.folder._id)
          console.log('✅ [FolderTreeNode.handleDrop] Folder moved successfully:', result)
          console.log('🔄 [FolderTreeNode.handleDrop] Emitting folder-moved event');
          emit('folder-moved')
          console.log('✅ [FolderTreeNode.handleDrop] folder-moved event emitted');
        } catch (error) {
          console.error('❌ [FolderTreeNode.handleDrop] Error moving folder:', error)
          alert('Error moving folder: ' + (error.error || 'Unknown error'))
        } finally {
          // Remove operation from pending set
          window.pendingOperations.delete(operationKey)
          console.log('🔍 [FolderTreeNode.handleDrop] Removed operation from pending set');
        }
      } else if (data.type === 'note') {
        console.log('📄 [FolderTreeNode.handleDrop] Processing note move operation');
        // Move note to this folder
        const user = authService.getUser()
        console.log('🔍 [FolderTreeNode.handleDrop] User check for note move:', { user, hasUser: !!user });
        if (!user) {
          console.error('❌ [FolderTreeNode.handleDrop] No user found for moveNote')
          return
        }

        console.log('📄 [FolderTreeNode.handleDrop] Moving note:', data.id, 'to folder:', props.folder._id)
        
        try {
          console.log('🔄 [FolderTreeNode.handleDrop] Calling requestAPI.moveNote');
          const result = await requestAPI.moveNote(data.id, props.folder._id, user)
          console.log('✅ [FolderTreeNode.handleDrop] Note moved successfully:', result)
          emit('note-moved')
        } catch (error) {
          console.error('❌ [FolderTreeNode.handleDrop] Error moving note:', error)
          alert('Error moving note: ' + (error.error || 'Unknown error'))
        }
      } else {
        console.log('🔍 [FolderTreeNode.handleDrop] Drop not processed:', { 
          dataType: data.type, 
          isSelfMove: data.id === props.folder._id,
          reason: data.id === props.folder._id ? 'self-move' : 'not-folder'
        });
      }
    }

    return {
      isExpanded,
      isDragOver,
      hasChildren,
      folderNotes,
      toggleExpanded,
      deleteFolder,
      deleteNote,
      handleDragStart,
      handleDragEnd,
      handleNoteDragStart,
      handleNoteDragEnd,
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
  border-radius: 8px;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.tree-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(2px);
}

.tree-item.active {
  background-color: rgba(66, 165, 245, 0.1);
  border-color: var(--accent-blue);
}

.tree-item.drag-over {
  background-color: rgba(66, 165, 245, 0.1);
  border: 2px dashed var(--accent-blue);
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
  font-size: 1rem;
  color: var(--accent-blue);
}

.folder-name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
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
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 1.2rem;
  color: var(--error);
  transition: all var(--transition-fast);
  line-height: 1;
}

.btn-delete:hover {
  background-color: rgba(244, 67, 54, 0.1);
  transform: scale(1.1);
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
  border-radius: 4px;
  font-size: 0.75rem;
  transition: all var(--transition-fast);
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-blue);
}

.btn-toggle:hover {
  background-color: var(--bg-hover);
  transform: scale(1.1);
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
  border-radius: 8px;
  transition: all var(--transition-fast);
  margin: 0.125rem 0;
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(2px);
}

.note-item.active {
  background-color: rgba(66, 165, 245, 0.1);
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.note-icon {
  margin-right: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.note-title {
  font-size: 0.9rem;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.btn-delete-note {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0.25rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.note-item:hover .btn-delete-note {
  opacity: 1;
  color: var(--text-primary);
}

.btn-delete-note:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: scale(1.1);
}
</style>
