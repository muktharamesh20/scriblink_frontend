<template>
  <div class="search-container">
    <div class="search-input-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search notes and summaries..."
        class="search-input"
        @input="performSearch"
        @keyup.enter="selectFirstResult"
        @keydown.up="navigateResults(-1)"
        @keydown.down="navigateResults(1)"
        @keydown.escape="clearSearch"
        ref="searchInput"
      />
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>
    
    <!-- Search Results Dropdown -->
    <div v-if="showResults && searchResults.length > 0" class="search-results">
      <div class="search-results-header">
        <span class="results-count">{{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}</span>
        <button @click="clearSearch" class="clear-search">×</button>
      </div>
      
      <div class="search-results-list">
        <div
          v-for="(result, index) in searchResults"
          :key="result.note._id"
          class="search-result-item"
          :class="{ 'selected': index === selectedResultIndex }"
          @click="selectResult(result)"
          @mouseenter="selectedResultIndex = index"
        >
          <div class="result-title">
            <span class="result-type">{{ result.type }}</span>
            <span class="result-note-title" v-html="highlightText(result.note.title, searchQuery)"></span>
          </div>
          <div class="result-content" v-html="highlightText(result.content, searchQuery)"></div>
          <div class="result-meta">
            <span class="result-folder">{{ getFolderName(result.note.folderId) }}</span>
            <span class="result-date">{{ formatRelativeTime(result.note.last_modified) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Results -->
    <div v-if="showResults && searchQuery && searchResults.length === 0" class="no-results">
      <div class="no-results-content">
        <span class="no-results-icon">🔍</span>
        <span class="no-results-text">No results found for "{{ searchQuery }}"</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { authService } from '../services/authService.js'
import { notesAPI, summariesAPI } from '../services/apiServices.js'

export default {
  name: 'SearchBar',
  emits: ['note-selected'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const searchResults = ref([])
    const showResults = ref(false)
    const selectedResultIndex = ref(-1)
    const searchInput = ref(null)
    const allNotes = ref([])
    const allSummaries = ref(new Map()) // Map of noteId -> summary

    // Load all notes and summaries for search
    const loadSearchData = async () => {
      const user = authService.getUser()
      if (!user) return

      try {
        console.log('🔍 [SearchBar] Loading search data...')
        
        // Load all notes
        const userNotes = await notesAPI.getUserNotes(user, undefined, null, authService.getAccessToken())
        allNotes.value = userNotes.notes || []
        console.log('🔍 [SearchBar] Loaded notes:', allNotes.value.length)

        // Load summaries for all notes
        const summaryPromises = allNotes.value.map(async (note) => {
          try {
            const summaryResponse = await summariesAPI.getSummary(user, note._id, authService.getAccessToken())
            if (summaryResponse.summary) {
              allSummaries.value.set(note._id, summaryResponse.summary)
            }
          } catch (error) {
            // It's okay if there's no summary
            console.log(`No summary for note ${note._id}`)
          }
        })

        await Promise.all(summaryPromises)
        console.log('🔍 [SearchBar] Loaded summaries:', allSummaries.value.size)
      } catch (error) {
        console.error('Error loading search data:', error)
      }
    }

    // Perform search through notes and summaries
    const performSearch = () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = []
        showResults.value = false
        selectedResultIndex.value = -1
        return
      }

      const query = searchQuery.value.toLowerCase().trim()
      const results = []

      allNotes.value.forEach(note => {
        // Search in note title
        if (note.title && note.title.toLowerCase().includes(query)) {
          results.push({
            note,
            type: 'Title',
            content: note.title,
            matchType: 'title'
          })
        }

        // Search in note content
        if (note.content && note.content.toLowerCase().includes(query)) {
          const contentPreview = note.content.length > 200 
            ? note.content.substring(0, 200) + '...'
            : note.content

          results.push({
            note,
            type: 'Content',
            content: contentPreview,
            matchType: 'content'
          })
        }

        // Search in summary
        const summary = allSummaries.value.get(note._id)
        if (summary && summary.toLowerCase().includes(query)) {
          const summaryPreview = summary.length > 200 
            ? summary.substring(0, 200) + '...'
            : summary

          results.push({
            note,
            type: 'Summary',
            content: summaryPreview,
            matchType: 'summary'
          })
        }
      })

      // Remove duplicates (same note appearing multiple times)
      const uniqueResults = []
      const seenNotes = new Set()
      
      results.forEach(result => {
        if (!seenNotes.has(result.note._id)) {
          seenNotes.add(result.note._id)
          uniqueResults.push(result)
        }
      })

      searchResults.value = uniqueResults
      showResults.value = true
      selectedResultIndex.value = -1

      console.log('🔍 [SearchBar] Search results:', uniqueResults.length)
    }

    // Highlight matching text
    const highlightText = (text, query) => {
      if (!query || !text) return text
      
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }

    // Select a search result
    const selectResult = (result) => {
      emit('note-selected', result.note)
      clearSearch()
    }

    // Select first result (Enter key)
    const selectFirstResult = () => {
      if (searchResults.value.length > 0) {
        selectResult(searchResults.value[0])
      }
    }

    // Navigate results with arrow keys
    const navigateResults = (direction) => {
      if (searchResults.value.length === 0) return

      selectedResultIndex.value += direction
      
      if (selectedResultIndex.value < 0) {
        selectedResultIndex.value = searchResults.value.length - 1
      } else if (selectedResultIndex.value >= searchResults.value.length) {
        selectedResultIndex.value = 0
      }
    }

    // Clear search
    const clearSearch = () => {
      searchQuery.value = ''
      searchResults.value = []
      showResults.value = false
      selectedResultIndex.value = -1
      if (searchInput.value) {
        searchInput.value.blur()
      }
    }

    // Helper function to get folder name
    const getFolderName = (folderId) => {
      // This would need to be passed from parent or loaded separately
      // For now, return a placeholder
      return folderId ? 'Folder' : 'Root'
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

    // Load search data when component mounts
    loadSearchData()

    return {
      searchQuery,
      searchResults,
      showResults,
      selectedResultIndex,
      searchInput,
      performSearch,
      highlightText,
      selectResult,
      selectFirstResult,
      navigateResults,
      clearSearch,
      getFolderName,
      formatRelativeTime,
      loadSearchData
    }
  }
}
</script>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: var(--border-accent);
  box-shadow: var(--shadow-md);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--text-secondary);
  width: 1.1rem;
  height: 1.1rem;
  pointer-events: none;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.results-count {
  font-weight: 500;
}

.clear-search {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.clear-search:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.search-results-list {
  padding: 0.5rem 0;
}

.search-result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 1px solid var(--border-secondary);
}

.search-result-item:hover,
.search-result-item.selected {
  background: var(--bg-hover);
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.result-type {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.result-note-title {
  font-weight: 600;
  color: var(--text-primary);
}

.result-content {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.result-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.result-folder {
  font-weight: 500;
}

.result-date {
  font-style: italic;
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.no-results-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: var(--text-secondary);
  text-align: center;
  justify-content: center;
}

.no-results-icon {
  font-size: 1.5rem;
  opacity: 0.5;
}

.no-results-text {
  font-size: 0.875rem;
}

/* Highlight styling */
:deep(mark) {
  background: var(--bg-accent);
  color: var(--text-primary);
  border-radius: 3px;
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 768px) {
  .search-container {
    max-width: 100%;
  }
  
  .search-input {
    font-size: 0.9rem;
    padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  }
  
  .search-icon {
    left: 0.625rem;
    font-size: 1rem;
  }
}
</style>
