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
        <FolderTree 
          :folders="folders" 
          :current-folder="currentFolder"
          @folder-selected="selectFolder"
          @folder-created="refreshFolders"
          @folder-deleted="refreshFolders"
        />
      </div>

      <div class="main-content">
        <div v-if="currentFolder" class="folder-view">
          <FolderView 
            :folder="currentFolder"
            :notes="currentFolderNotes"
            @note-selected="selectNote"
            @note-created="refreshNotes"
            @note-deleted="refreshNotes"
            @note-moved="refreshNotes"
          />
        </div>

        <div v-if="selectedNote" class="note-editor">
          <NoteEditor 
            :note="selectedNote"
            @note-updated="refreshNotes"
            @note-deleted="refreshNotes"
          />
        </div>

        <div v-if="!currentFolder && !selectedNote" class="welcome">
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
import { folderAPI, notesAPI } from '../services/apiServices.js'
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

    const currentFolderNotes = computed(() => {
      if (!currentFolder.value) return []
      return notes.value.filter(note => 
        note.folderId === currentFolder.value._id
      )
    })

    const initializeUser = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        // Initialize root folder if it doesn't exist
        await folderAPI.initializeFolder(user)
        await refreshFolders()
        await refreshNotes()
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    const refreshFolders = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        // Get root folder details
        const rootFolders = await folderAPI.getFolderDetails('root')
        folders.value = rootFolders || []
      } catch (error) {
        console.error('Error refreshing folders:', error)
      }
    }

    const refreshNotes = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        const userNotes = await notesAPI.getNotesByUser(user)
        notes.value = userNotes || []
      } catch (error) {
        console.error('Error refreshing notes:', error)
      }
    }

    const selectFolder = (folder) => {
      currentFolder.value = folder
      selectedNote.value = null
    }

    const selectNote = (note) => {
      selectedNote.value = note
    }

    const createNewNote = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        const response = await notesAPI.createNote(user, 'Untitled Note')
        if (response.note) {
          await refreshNotes()
          // Select the newly created note
          const newNote = notes.value.find(note => note._id === response.note)
          if (newNote) {
            selectNote(newNote)
          }
        }
      } catch (error) {
        console.error('Error creating note:', error)
      }
    }

    const createNewFolder = async () => {
      const user = authService.getUser()
      if (!user) return

      const title = prompt('Enter folder name:')
      if (!title) return

      try {
        await folderAPI.createFolder(user, title, 'root')
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
      selectFolder,
      selectNote,
      createNewNote,
      createNewFolder,
      refreshFolders,
      refreshNotes
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
</style>
