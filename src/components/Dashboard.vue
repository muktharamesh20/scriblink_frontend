<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="dashboard-actions">
        <button @click="createNewNote" class="btn btn-primary">
          <span>📝</span> New Note
        </button>
        <button @click="createNewFolder" class="btn btn-secondary">
          <span>📁</span> New Folder
        </button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="sidebar">
        <!-- Root drop zone -->
        <div 
          class="root-drop-zone"
          :class="{ 'drag-over': isRootDragOver }"
          @dragover="handleRootDragOver"
          @dragenter="handleRootDragEnter"
          @dragleave="handleRootDragLeave"
          @drop="handleRootDrop"
        >
          <h3>📁 Root</h3>
          <p>Drop folders here to move to root</p>
        </div>
        
        <FolderTree 
          :folders="folders"
          :current-folder="currentFolder"
          :root-notes="rootNotes"
          :all-notes="allNotes"
          :selected-note="selectedNote"
          @folder-selected="selectFolder"
          @folder-created="refreshFolders"
          @folder-deleted="refreshFolders"
          @folder-moved="refreshFolders"
          @note-selected="selectNote"
        />
        
      </div>

      <div class="main-content">
        <!-- Note editor takes full space when a note is selected -->
        <div v-if="selectedNote" class="note-editor">
          <NoteEditor 
            :note="selectedNote"
            @note-updated="refreshNotes"
            @note-deleted="handleNoteDeleted"
            @exit-editor="exitNoteEditor"
          />
        </div>

        <!-- Folder view when in a folder but no note selected -->
        <div v-else-if="currentFolder" class="folder-view">
          <div class="folder-header">
            <button @click="goBackToRoot" class="back-button">← Back to Root</button>
            <h2>{{ currentFolder.title }}</h2>
          </div>
          <FolderView 
            :folder="currentFolder"
            :notes="currentFolderNotes"
            @note-selected="selectNote"
            @note-created="refreshNotes"
            @note-deleted="refreshNotes"
            @note-moved="refreshNotes"
          />
        </div>

        <!-- Welcome screen when no folder and no note selected -->
        <div v-else class="welcome">
          <div class="welcome-content">
            <h2>Welcome to ScribLink</h2>
            <p>Create your first note or folder to get started!</p>
            <div class="welcome-actions">
              <button @click="createNewNote" class="btn btn-primary">
                <span>📝</span> Create Note
              </button>
              <button @click="createNewFolder" class="btn btn-secondary">
                <span>📁</span> Create Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { authService } from '../services/authService.js'
import { requestAPI } from '../services/apiServices.js'
import FolderTree from './FolderTree.vue'
import FolderView from './FolderView.vue'
import NoteEditor from './NoteEditor.vue'

export default {
  name: 'Dashboard',
  components: {
    FolderTree,
    FolderView,
    NoteEditor
  },
  setup() {
    const folders = ref([])
    const notes = ref([])
    const currentFolder = ref(null)
    const selectedNote = ref(null)
    const loading = ref(false)
    const isRootDragOver = ref(false)

    const currentFolderNotes = computed(() => {
      if (!currentFolder.value) return []
      // When we're in a folder, the notes.value already contains only notes for that folder
      // because refreshNotes() loads notes for the current folder
      return notes.value
    })

    const allNotes = ref([])

    const loadAllNotes = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      
      console.log('🔄 loadAllNotes called with:', { user, rootFolder })
      
      if (!user || !rootFolder) {
        console.log('❌ Missing user or rootFolder:', { user, rootFolder })
        return
      }

      try {
        console.log('🔄 Loading all notes for sidebar...')
        const userNotes = await requestAPI.getUserNotes(user, rootFolder)
        console.log('📦 API response:', userNotes)
        allNotes.value = userNotes.notes || []
        console.log('✅ Loaded notes for sidebar:', allNotes.value.length, 'notes')
        console.log('📝 Notes data:', allNotes.value)
      } catch (error) {
        console.error('❌ Error loading all notes:', error)
      }
    }

    // Get notes that belong to the root folder (not in any subfolder)
    const rootNotes = computed(() => {
      const rootFolder = authService.getRootFolder()
      console.log('🔍 rootNotes computed - rootFolder:', rootFolder, 'allNotes:', allNotes.value.length)
      console.log('🔍 allNotes data:', allNotes.value)
      
      if (!rootFolder) return []
      
      const filtered = allNotes.value.filter(note => {
        console.log('🔍 filtering note:', note)
        console.log('🔍 note keys:', Object.keys(note))
        console.log('🔍 note.folderId:', note.folderId)
        console.log('🔍 note.folder:', note.folder)
        console.log('🔍 rootFolder:', rootFolder)
        
        // If note has no folderId or folderId is null/undefined, treat it as root note
        // If note has folderId, check if it matches the root folder
        const isRootNote = !note.folderId || note.folderId === rootFolder || note.folderId === null
        console.log('🔍 isRootNote:', isRootNote)
        return isRootNote
      })
      console.log('🔍 rootNotes filtered:', filtered.length, 'notes')
      return filtered
    })

    const initializeUser = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        await refreshFolders()
        await refreshNotes()
        await loadAllNotes()
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    const refreshFolders = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      if (!user || !rootFolder) return

      try {
        // Get folder structure using Request API with root folder ID
        const folderStructure = await requestAPI.getFolderStructure(user, rootFolder)
        folders.value = folderStructure.folders || []
      } catch (error) {
        console.error('Error refreshing folders:', error)
      }
    }

    const refreshNotes = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      if (!user || !rootFolder) return

      try {
        // Get user notes for the current folder or root folder
        const folderId = currentFolder.value?._id || rootFolder
        const userNotes = await requestAPI.getUserNotes(user, folderId)
        notes.value = userNotes.notes || []
        
        // Also refresh sidebar notes
        await loadAllNotes()
      } catch (error) {
        console.error('Error refreshing notes:', error)
      }
    }

    const selectFolder = async (folder) => {
      currentFolder.value = folder
      selectedNote.value = null
      
      // Load notes for the selected folder
      const user = authService.getUser()
      if (!user) return
      
      try {
        const folderNotes = await requestAPI.getUserNotes(user, folder._id)
        notes.value = folderNotes.notes || []
      } catch (error) {
        console.error('Error loading folder notes:', error)
      }
    }

    const selectNote = (note) => {
      selectedNote.value = note
    }

    const handleNoteDeleted = async () => {
      // Clear the selected note to return to dashboard
      selectedNote.value = null
      // Refresh the notes list to remove the deleted note
      await refreshNotes()
    }

    const exitNoteEditor = () => {
      // Clear the selected note to return to dashboard
      selectedNote.value = null
    }

    const goBackToRoot = async () => {
      currentFolder.value = null
      selectedNote.value = null
      
      // Load root notes
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      if (!user || !rootFolder) return
      
      try {
        const rootNotes = await requestAPI.getUserNotes(user, rootFolder)
        notes.value = rootNotes.notes || []
      } catch (error) {
        console.error('Error loading root notes:', error)
      }
    }

    // Root drop zone handlers
    const handleRootDragOver = (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }

    const handleRootDragEnter = (event) => {
      event.preventDefault()
      isRootDragOver.value = true
    }

    const handleRootDragLeave = (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isRootDragOver.value = false
      }
    }

    const handleRootDrop = async (event) => {
      event.preventDefault()
      isRootDragOver.value = false
      
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      console.log('🔍 handleRootDrop debug:', {
        data,
        user: authService.getUser(),
        rootFolder: authService.getRootFolder()
      })
      
      if (data.type === 'folder') {
        const user = authService.getUser()
        const rootFolder = authService.getRootFolder()
        if (!user || !rootFolder) {
          console.error('❌ Missing user or root folder for root drop')
          return
        }

        console.log('📁 Moving folder to root:', data.id, 'to root:', rootFolder)
        
        try {
          const result = await requestAPI.moveFolder(data.id, rootFolder)
          console.log('✅ Folder moved to root successfully:', result)
          await refreshFolders()
        } catch (error) {
          console.error('❌ Error moving folder to root:', error)
          alert('Error moving folder to root: ' + (error.error || 'Unknown error'))
        }
      }
    }

    const createNewNote = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      
      console.log('🔍 createNewNote debug:', {
        user,
        rootFolder,
        currentFolder: currentFolder.value
      })
      
      if (!user) {
        console.error('❌ No user found')
        return
      }
      
      if (!rootFolder) {
        console.error('❌ No root folder found')
        return
      }

      try {
        // Create note using Request API with current folder or root folder
        const folderId = currentFolder.value?._id || rootFolder
        console.log('📝 Creating note in folder:', folderId)
        
        const response = await requestAPI.createNote(user, 'Start writing your note...', folderId, 'Untitled Note')
        console.log('✅ Note created:', response)
        
        if (response.note) {
          await refreshNotes()
          // Select the newly created note
          const newNote = notes.value.find(note => note._id === response.note)
          if (newNote) {
            selectNote(newNote)
          }
        }
      } catch (error) {
        console.error('❌ Error creating note:', error)
        alert('Error creating note: ' + (error.error || 'Unknown error'))
      }
    }

    const createNewFolder = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      if (!user || !rootFolder) return

      const title = prompt('Enter folder name:')
      if (!title) return

      try {
        // Create folder using Request API
        const parentFolderId = currentFolder.value?._id || rootFolder
        await requestAPI.createFolder(user, title, parentFolderId)
        await refreshFolders()
      } catch (error) {
        console.error('Error creating folder:', error)
      }
    }

    onMounted(() => {
      initializeUser()
    })

    return {
      folders,
      notes,
      currentFolder,
      selectedNote,
      currentFolderNotes,
      allNotes,
      rootNotes,
      isRootDragOver,
      selectFolder,
      selectNote,
      handleNoteDeleted,
      exitNoteEditor,
      goBackToRoot,
      handleRootDragOver,
      handleRootDragEnter,
      handleRootDragLeave,
      handleRootDrop,
      createNewNote,
      createNewFolder,
      refreshFolders,
      refreshNotes,
      loadAllNotes
    }
  }
}
</script>

<style scoped>
.dashboard {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  font-size: 1.5rem;
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-content {
  display: flex;
  flex: 1;
  gap: 1rem;
  min-height: 0;
}

.sidebar {
  width: 300px;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.folder-view {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.note-editor {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-content h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.welcome-content p {
  color: #666;
  margin-bottom: 2rem;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn span {
  margin-right: 0.5rem;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.back-button {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.back-button:hover {
  background: #7f8c8d;
}

.folder-header h2 {
  margin: 0;
  color: #2c3e50;
}

.root-drop-zone {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  transition: all 0.3s ease;
}

.root-drop-zone.drag-over {
  background: #e8f5e8;
  border-color: #4caf50;
  border-style: solid;
}

.root-drop-zone h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.root-drop-zone p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.sidebar-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.sidebar-notes h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-item {
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.note-item:hover {
  background-color: #f5f5f5;
}

.note-item.active {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.note-title {
  font-size: 0.9rem;
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
}
</style>
