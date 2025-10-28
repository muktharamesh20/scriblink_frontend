<template>
  <div class="dashboard">
    <div v-if="!selectedNote" class="dashboard-content">
      <div class="welcome-container">
        <div class="welcome-content">
          <h2>Welcome to Scriblink</h2>
          
          <!-- Search Bar -->
          <div class="search-section">
            <SearchBar @note-selected="selectNote" />
          </div>
          
          <div class="welcome-actions">
            <button @click="createNewNote" class="btn btn-primary">
              Create Note
            </button>
            <button @click="createNewFolder" class="btn btn-secondary">
              Create Folder
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <FolderTree 
          :folders="folders"
          :current-folder="currentFolder"
          :root-notes="rootNotes"
          :all-notes="allNotes"
          :selected-note="selectedNote"
          @folder-selected="selectFolder"
          @folder-created="refreshFolders"
          @folder-deleted="refreshFolders"
          @folder-moved="handleFolderMoved"
          @note-selected="selectNote"
          @note-created="handleNoteCreated"
          @note-moved="handleNoteMoved"
          @note-deleted="refreshNotes"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @folder-drag-over="handleFolderDragOver"
          @folder-drag-leave="handleFolderDragLeave"
        />
      </div>
    </div>

    <!-- Note editor takes full page when a note is selected -->
    <div v-if="selectedNote" class="note-editor-fullscreen">
      <NoteEditor 
        :note="selectedNote"
        @note-updated="refreshNotes"
        @note-deleted="handleNoteDeleted"
        @exit-editor="exitNoteEditor"
      />
    </div>

    <!-- Folder view when in a folder but no note selected -->
    <div v-else-if="currentFolder" class="main-content">
      <div class="folder-view">
        <div class="folder-header">
          <button @click="goBackToRoot" class="back-button">← Back to Root</button>
        </div>
        <FolderView 
          :folder="currentFolder"
          :notes="currentFolderNotes"
          @note-selected="selectNote"
          @note-created="handleNoteCreated"
          @note-deleted="refreshNotes"
          @note-moved="handleNoteMoved"
        />
      </div>
    </div>

    <div v-if="!selectedNote" class="tags-overview">
      <div class="tags-overview-content">
        <div class="tags-overview-header">
          <h3>Tags Overview</h3>
        </div>
        <div class="tags-grid">
        <div v-for="tagGroup in sortedTagsOverview" :key="tagGroup.tag" class="tag-group">
          <div class="tag-header">
            <span class="tag-name">{{ tagGroup.tag }}</span>
            <span class="tag-count">{{ tagGroup.notes.length }} notes</span>
          </div>
          <div class="tag-notes">
            <div 
              v-for="note in tagGroup.notes" 
              :key="note._id" 
              class="tag-note-item"
              @click="selectNote(note)"
              :class="{ 'selected': selectedNote && selectedNote._id === note._id }"
            >
              <div class="note-title">{{ note.title }}</div>
              <div class="note-meta">
                <span class="note-date">{{ formatRelativeTime(note.last_modified) }}</span>
                <span v-if="note.folderId && note.folderId !== rootFolderId" class="note-folder">{{ getFolderName(note.folderId) }}</span>
              </div>
              <button 
                @click.stop="removeTagFromNote(tagGroup.tag, note)"
                class="btn-remove-tag"
                title="Remove tag from note"
              >
                ×
              </button>
            </div>
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
import SearchBar from './SearchBar.vue'

export default {
  name: 'Dashboard',
  components: {
    FolderTree,
    FolderView,
    NoteEditor,
    SearchBar
  },
  setup() {
    const folders = ref([])
    const notes = ref([])
    const currentFolder = ref(null)
    const selectedNote = ref(null)
    const loading = ref(false)
    const isDraggingItem = ref(false)
    const isDraggingOverFolder = ref(false)

    const currentFolderNotes = computed(() => {
      if (!currentFolder.value) return []
      // When we're in a folder, the notes.value already contains only notes for that folder
      // because refreshNotes() loads notes for the current folder
      return notes.value
    })

    const allNotes = ref([])

    const loadAllNotes = async () => {
      const user = authService.getUser()
      
      console.log('🔄 loadAllNotes called with:', { user })
      
      if (!user) {
        console.log('❌ Missing user:', { user })
        return
      }

      try {
        console.log('🔄 Loading all notes for sidebar...')
        // Get ALL notes for the user (not just root folder notes)
        const userNotes = await requestAPI.getUserNotes(user, undefined)
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
        console.log('🔍 rootFolder:', rootFolder)
        
        // Backend now computes folderId from folder.elements for display
        const isRootNote = note.folderId === rootFolder
        console.log('🔍 isRootNote:', isRootNote)
        return isRootNote
      })
      console.log('🔍 rootNotes filtered:', filtered.length, 'notes')
      return filtered
    })

    // Tags overview data
    const tagsOverview = ref([])

    // Computed property for root folder ID
    const rootFolderId = computed(() => {
      return authService.getRootFolder()
    })

    // Computed property for sorted tags overview
    const sortedTagsOverview = computed(() => {
      if (!tagsOverview.value.length) return []
      
      // Sort by priority (High > Medium > Low > others) and then by recency
      const priorityOrder = {
        'High Priority': 1,
        'Medium Priority': 2, 
        'Low Priority': 3,
        'Go to Office Hours': 4,
        'Review Needed': 5
      }
      
      return tagsOverview.value
        .map(tagGroup => ({
          ...tagGroup,
          notes: tagGroup.notes.sort((a, b) => {
            // Sort notes by last_modified (most recent first)
            return new Date(b.last_modified) - new Date(a.last_modified)
          })
        }))
        .sort((a, b) => {
          const aPriority = priorityOrder[a.tag] || 999
          const bPriority = priorityOrder[b.tag] || 999
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }
          
          // If same priority, sort by most recent note
          const aLatest = a.notes[0]?.last_modified || 0
          const bLatest = b.notes[0]?.last_modified || 0
          return new Date(bLatest) - new Date(aLatest)
        })
    })

    // Load tags overview data
    const loadTagsOverview = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        // Get all user tags
        const response = await requestAPI.getUserTags(user)
        if (response.tags && response.tags.length > 0) {
          // Create a map of tag labels to tag IDs
          const tagIdMap = {}
          for (const tag of response.tags) {
            if (typeof tag === 'object' && tag.label && tag._id) {
              tagIdMap[tag.label] = tag._id
            }
          }
          
          // Group notes by tag
          const tagGroups = {}
          
          // Initialize tag groups with both label and ID
          for (const tag of response.tags) {
            const tagLabel = typeof tag === 'string' ? tag : tag.label
            tagGroups[tagLabel] = {
              label: tagLabel,
              id: typeof tag === 'string' ? tagIdMap[tag] : tag._id,
              notes: []
            }
          }
          
          // For each note, get its tags and add to appropriate groups
          for (const note of allNotes.value) {
            try {
              const noteTagsResponse = await requestAPI.getItemTags(user, note._id)
              
              // Handle both old format {tags: [...]} and new format [...]
              let tagsArray = []
              if (noteTagsResponse && Array.isArray(noteTagsResponse)) {
                // New format: direct array of tag objects
                tagsArray = noteTagsResponse
              } else if (noteTagsResponse && noteTagsResponse.tags && Array.isArray(noteTagsResponse.tags)) {
                // Old format: {tags: [...]}
                tagsArray = noteTagsResponse.tags
              }
              
              if (tagsArray.length > 0) {
                for (const tag of tagsArray) {
                  // Handle both string tags and object tags with tagId and label
                  const tagLabel = typeof tag === 'string' ? tag : tag.label
                  const tagId = typeof tag === 'string' ? tagIdMap[tag] : tag.tagId
                  
                  if (tagGroups[tagLabel]) {
                    // Store the note with its tag ID for removal
                    tagGroups[tagLabel].notes.push({
                      ...note,
                      tagId: tagId
                    })
                  }
                }
              }
            } catch (error) {
              console.log(`No tags found for note ${note._id}:`, error)
            }
          }
          
          // Convert to array format and filter out empty groups
          tagsOverview.value = Object.entries(tagGroups)
            .filter(([tagLabel, tagData]) => tagData.notes.length > 0)
            .map(([tagLabel, tagData]) => ({
              tag: tagLabel,
              tagId: tagData.id,
              notes: tagData.notes
            }))
        } else {
          tagsOverview.value = []
        }
      } catch (error) {
        console.error('Error loading tags overview:', error)
        tagsOverview.value = []
      }
    }

    const removeTagFromNote = async (tagLabel, note) => {
      const user = authService.getUser()
      if (!user) return

      try {
        // Use the tagId that was stored with the note
        const tagId = note.tagId || tagLabel // Fallback to label if no ID
        
        console.log('🏷️ [Dashboard] Removing tag from note:', { tagLabel, tagId, noteId: note._id })
        await requestAPI.untagItem(user, note._id, tagId)
        
        // Refresh the tags overview to reflect the change
        await loadTagsOverview()
        
        console.log('✅ [Dashboard] Tag removed successfully')
      } catch (error) {
        console.error('❌ [Dashboard] Error removing tag:', error)
        alert('Error removing tag: ' + (error.error || 'Unknown error'))
      }
    }

    // Helper function to format relative time
    const formatRelativeTime = (dateString) => {
      if (!dateString) return 'Unknown'
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    }

    // Helper function to get folder name
    const getFolderName = (folderId) => {
      // Search through all folders recursively
      const findFolderRecursively = (folderList) => {
        for (const folder of folderList) {
          if (folder._id === folderId) {
            return folder.title
          }
          // Search in nested folders
          if (folder.children && folder.children.length > 0) {
            const found = findFolderRecursively(folder.children)
            if (found) return found
          }
        }
        return null
      }
      
      const folderName = findFolderRecursively(folders.value)
      return folderName || 'Unknown Folder'
    }

    const initializeUser = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        await refreshFolders()
        await refreshNotes()
        await loadAllNotes()
        await loadTagsOverview()
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    const handleFolderMoved = () => {
      console.log('🚀 [Dashboard.handleFolderMoved] Folder moved event received');
      refreshFolders();
    }

    const handleNoteMoved = async () => {
      console.log('🚀 [Dashboard.handleNoteMoved] Note moved event received');
      // Refresh both folders (to update elements arrays) and notes
      await refreshFolders();
      await refreshNotes();
    }

    const refreshFolders = async () => {
      console.log('🚀 [Dashboard.refreshFolders] Starting folder refresh');
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      console.log('🔍 [Dashboard.refreshFolders] User and root folder:', { user, rootFolder });
      
      if (!user || !rootFolder) {
        console.error('❌ [Dashboard.refreshFolders] Missing user or root folder');
        return
      }

      try {
        console.log('🔄 [Dashboard.refreshFolders] Calling requestAPI.getFolderStructure');
        // Get folder structure using Request API without folderId to get ALL folders in a flat array
        const folderStructure = await requestAPI.getFolderStructure(user, undefined)
        console.log('🔍 [Dashboard.refreshFolders] Folder structure received:', folderStructure);
        
        const allFolders = folderStructure.folders || []
        console.log('🔍 [Dashboard.refreshFolders] All folders count:', allFolders.length);
        console.log('🔍 [Dashboard.refreshFolders] All folders:', allFolders.map(f => ({ _id: f._id, title: f.title, folders: f.folders })));
        
        // Build hierarchy client-side from flat data
        const buildHierarchy = (folders) => {
          console.log('🔍 [Dashboard.refreshFolders] Building hierarchy for folders:', folders.map(f => f._id));
          return folders.map(folder => {
            // Find children of this folder
            const children = allFolders.filter(child => 
              folder.folders && folder.folders.includes(child._id)
            )
            console.log('🔍 [Dashboard.refreshFolders] Children for folder', folder._id, ':', children.map(c => c._id));
            
            // Recursively build children
            const nestedChildren = buildHierarchy(children)
            
            return {
              ...folder,
              children: nestedChildren
            }
          })
        }

        // Find the root folder object and its direct children
        const rootFolderObj = allFolders.find(f => f._id === rootFolder)
        console.log('🔍 [Dashboard.refreshFolders] Root folder object:', rootFolderObj);
        
        // Get direct children of the root folder
        let rootFolders = []
        if (rootFolderObj && rootFolderObj.folders && rootFolderObj.folders.length > 0) {
          // Find folders that are in the root's folders array
          rootFolders = allFolders.filter(folder => 
            rootFolderObj.folders.includes(folder._id)
          )
        } else {
          // If no root folder found or it has no children, find folders that are not children of any other folder
          rootFolders = allFolders.filter(folder => {
            if (folder._id === rootFolder) return false // Exclude root itself
            
            // Check if this folder is a child of any other non-root folder
            return !allFolders.some(otherFolder => 
              otherFolder._id !== rootFolder && 
              otherFolder.folders && 
              otherFolder.folders.includes(folder._id)
            )
          })
        }
        console.log('🔍 [Dashboard.refreshFolders] Root folders found:', rootFolders.map(f => ({ _id: f._id, title: f.title })));

        // Build nested hierarchy starting from root folders
        const hierarchy = buildHierarchy(rootFolders)
        console.log('🔍 [Dashboard.refreshFolders] Built hierarchy:', hierarchy);
        
        // Debug: Check if any folder has children
        const checkHierarchy = (folders, level = 0) => {
          folders.forEach(folder => {
            console.log(`${'  '.repeat(level)}📁 ${folder.title} (${folder._id}) - Children: ${folder.children?.length || 0}`);
            if (folder.children && folder.children.length > 0) {
              checkHierarchy(folder.children, level + 1);
            }
          });
        };
        console.log('🔍 [Dashboard.refreshFolders] Hierarchy structure:');
        checkHierarchy(hierarchy);
        
        folders.value = hierarchy
        console.log('✅ [Dashboard.refreshFolders] Folders updated in reactive state');
        
        // Also refresh sidebar notes when folders change
        console.log('🔄 [Dashboard.refreshFolders] Refreshing notes');
        await loadAllNotes()
        console.log('✅ [Dashboard.refreshFolders] Folder refresh completed');
      } catch (error) {
        console.error('❌ [Dashboard.refreshFolders] Error refreshing folders:', error)
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
        
        // Auto-refresh Tags Overview when notes are updated
        await loadTagsOverview()
      } catch (error) {
        console.error('Error refreshing notes:', error)
      }
    }

    const selectFolder = async (folder) => {
      console.log('🔍 selectFolder called with:', folder)
      currentFolder.value = folder
      selectedNote.value = null
      
      console.log('🔍 currentFolder set to:', currentFolder.value)
      
      // Load notes for the selected folder
      const user = authService.getUser()
      if (!user) return
      
      try {
        const folderNotes = await requestAPI.getUserNotes(user, folder._id)
        notes.value = folderNotes.notes || []
        console.log('🔍 Loaded notes for folder:', folderNotes.notes?.length || 0, 'notes')
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
      // Tags Overview will be refreshed by refreshNotes() which calls loadTagsOverview()
    }

    const exitNoteEditor = async () => {
      // Clear the selected note to return to dashboard
      selectedNote.value = null
      
      // Auto-refresh Tags Overview when exiting a note
      await loadTagsOverview()
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

    // Global drag state handlers
    const handleDragStart = () => {
      console.log('🚀 [Dashboard] Drag started')
      isDraggingItem.value = true
      isDraggingOverFolder.value = false
    }

    const handleDragEnd = () => {
      console.log('🏁 [Dashboard] Drag ended')
      isDraggingItem.value = false
      isDraggingOverFolder.value = false
    }

    const handleFolderDragOver = () => {
      isDraggingOverFolder.value = true
    }

    const handleFolderDragLeave = () => {
      isDraggingOverFolder.value = false
    }

    const createNewNote = async () => {
      const user = authService.getUser()
      const rootFolder = authService.getRootFolder()
      
      console.log('🔍 createNewNote debug:', {
        user,
        rootFolder,
        rootFolderType: typeof rootFolder,
        currentFolder: currentFolder.value,
        currentFolderId: currentFolder.value?._id
      })
      
      if (!user) {
        console.error('❌ No user found')
        alert('Error: No user found. Please log in again.')
        return
      }
      
      if (!rootFolder) {
        console.error('❌ No root folder found')
        alert('Error: No root folder found. Please try refreshing the page.')
        return
      }

      try {
        // Create note using Request API with current folder or root folder
        const folderId = currentFolder.value?._id || rootFolder
        console.log('📝 Creating note in folder:', folderId, 'type:', typeof folderId)
        
        if (!folderId || folderId === 'undefined') {
          throw new Error('Invalid folder ID: ' + folderId)
        }
        
        const response = await requestAPI.createNote(user, 'Start writing your note...', folderId, 'Untitled Note')
        console.log('✅ Note created:', response)
        
        if (response.note) {
          await refreshNotes()
          // Select the newly created note
          const newNote = notes.value.find(note => note._id === response.note)
          if (newNote) {
            selectNote(newNote)
          } else {
            // If note not found in refreshed list, create a temporary note object
            // This handles race conditions where the note might not be immediately available
            console.log('⚠️ Note not found in refreshed list, creating temporary note object')
            const tempNote = {
              _id: response.note,
              title: 'Untitled Note',
              content: 'Start writing your note...',
              folderId: folderId,
              date_created: new Date().toISOString(),
              last_modified: new Date().toISOString()
            }
            selectNote(tempNote)
          }
        }
      } catch (error) {
        console.error('❌ Error creating note:', error)
        alert('Error creating note: ' + (error.error || 'Unknown error'))
      }
    }

    const handleNoteCreated = async (response) => {
      console.log('🔄 Note created from FolderView, refreshing notes...')
      await refreshNotes()
      
      // Use the same mechanism as createNewNote - find note by ID from response
      if (response && response.note) {
        const newNote = notes.value.find(note => note._id === response.note)
        if (newNote) {
          console.log('📝 Selecting newly created note:', newNote.title)
          selectNote(newNote)
        } else {
          // If note not found in refreshed list, create a temporary note object
          // This handles race conditions where the note might not be immediately available
          console.log('⚠️ Note not found in refreshed list, creating temporary note object')
          const tempNote = {
            _id: response.note,
            title: 'Untitled Note',
            content: 'Start writing your note...',
            folderId: currentFolder.value?._id || authService.getRootFolder(),
            date_created: new Date().toISOString(),
            last_modified: new Date().toISOString()
          }
          selectNote(tempNote)
        }
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
      isDraggingItem,
      isDraggingOverFolder,
      selectFolder,
      selectNote,
      handleNoteDeleted,
      exitNoteEditor,
      goBackToRoot,
      handleDragStart,
      handleDragEnd,
      handleFolderDragOver,
      handleFolderDragLeave,
      createNewNote,
      createNewFolder,
      handleNoteCreated,
      refreshFolders,
      refreshNotes,
      loadAllNotes,
      handleFolderMoved,
      handleNoteMoved,
      sortedTagsOverview,
      rootFolderId,
      removeTagFromNote,
      formatRelativeTime,
      getFolderName
    }
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-primary);
  margin-bottom: 1rem;
}

.dashboard-header h1 {
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
}

.dashboard-content {
  display: flex;
  align-items: center;
  padding: 2rem 2rem 2rem 2rem;
  width: 100%;
  gap: 2rem;
  background: var(--bg-secondary);
}

.note-editor-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.sidebar {
  width: 300px;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  overflow-y: auto;
  transition: all var(--transition-normal);
  min-height: 300px;
  max-height: 50vh;
}

.sidebar:hover {
  box-shadow: var(--shadow-lg);
}

.welcome-sidebar {
  width: 300px;
  min-height: 500px;
  max-height: 70vh;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  overflow-y: auto;
  transition: all var(--transition-normal);
}

.welcome-sidebar:hover {
  box-shadow: var(--shadow-lg);
}

.welcome-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.welcome-content {
  text-align: center;
}

.welcome-content h2 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 700;
}

.welcome-content p {
  margin: 0 0 2rem 0;
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.5;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  max-height: 70vh;
}

.main-content.full-width {
  width: 100%;
  max-width: none;
}

.folder-view {
  flex: 1;
  min-height: 500px;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  overflow-y: auto;
  transition: all var(--transition-normal);
}

.folder-view:hover {
  box-shadow: var(--shadow-lg);
}

.note-editor {
  flex: 1;
  min-height: 500px;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  overflow-y: auto;
  transition: all var(--transition-normal);
}

.note-editor:hover {
  box-shadow: var(--shadow-lg);
}

.welcome-content h2 {
  margin: 0 0 2rem 0;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 700;
}

.search-section {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto 2rem auto;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
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
  border-bottom: 1px solid var(--border-primary);
}

.back-button {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-secondary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
}

.back-button:hover {
  background: var(--bg-hover);
  border-color: var(--border-accent);
  transform: translateY(-1px);
}

.folder-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.sidebar-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.sidebar-notes h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-item {
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.note-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(4px);
}

.note-item.active {
  background-color: var(--bg-hover);
  border-left: 3px solid var(--accent-primary);
}

.note-title {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Tags Overview Styles */
.tags-overview {
  width: 100%;
  background: var(--bg-primary);
  transition: all var(--transition-normal);
}

.tags-overview-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.tags-overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem 1rem 0 1rem;
}

.tags-overview-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 0 1rem 1rem 1rem;
}

.tag-group {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-fast);
}

.tag-group:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.tag-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.tag-count {
  background: var(--accent-blue);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag-notes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-note-item {
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  position: relative;
}

.tag-note-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-secondary);
  transform: translateX(4px);
}

.tag-note-item.selected {
  background-color: rgba(66, 165, 245, 0.1);
  border-color: var(--accent-blue);
}

.btn-remove-tag {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.tag-note-item:hover .btn-remove-tag {
  opacity: 1;
}

.btn-remove-tag:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: scale(1.1);
}

.note-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.note-date {
  font-style: italic;
}

.note-folder {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

/* Responsive design for tags overview */
@media (max-width: 768px) {
  .tags-grid {
    grid-template-columns: 1fr;
  }
  
  .tags-overview {
    margin-top: 1rem;
    padding: 0.75rem;
  }
}
</style>
