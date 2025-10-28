<template>
  <div class="note-editor">
    <div class="editor-header-fullscreen">
      <div class="editor-title">
        <input 
          v-model="noteTitle" 
          type="text" 
          class="title-input"
          placeholder="Note title"
          @blur="updateTitle"
          @keyup.enter="updateTitle"
        />
      </div>
      
      <div class="editor-actions">
        <button v-if="!isEditing" @click="startEditing" class="btn btn-primary btn-sm">
          Edit
        </button>
        <button v-if="isEditing" @click="stopEditing" class="btn btn-secondary btn-sm">
          Preview
        </button>
        <button v-if="isEditing" @click="saveNote" class="btn btn-primary btn-sm" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button @click="exitEditor" class="btn btn-secondary btn-sm">
          Back
        </button>
        <button @click="deleteNote" class="btn btn-danger btn-sm">
          Delete
        </button>
      </div>
    </div>

    <div class="editor-content" :class="{ 'has-panel': showTags || showSummary }">
      <!-- Preview Mode: Beautiful read-only markdown -->
      <div v-if="!isEditing" class="markdown-preview-only">
        <div class="preview-content" v-html="renderedMarkdown"></div>
      </div>

      <!-- Edit Mode: Simple markdown editor -->
      <div v-else class="markdown-editor-simple">
        <div class="editor-header-simple">
          <span>Editing in Markdown</span>
          <button @click="showMarkdownHelp = !showMarkdownHelp" class="help-btn" title="Markdown Help">
            ?
          </button>
        </div>
        <div v-if="showMarkdownHelp" class="markdown-help">
          <div class="help-content">
            <h4>Markdown Quick Reference:</h4>
            <ul>
              <li><code># Header 1</code> → <strong>Header 1</strong></li>
              <li><code>## Header 2</code> → <strong>Header 2</strong></li>
              <li><code>**bold**</code> → <strong>bold</strong></li>
              <li><code>*italic*</code> → <em>italic</em></li>
              <li><code>`code`</code> → <code>code</code></li>
              <li><code>- List item</code> → • List item</li>
              <li><code>> Quote</code> → Blockquote</li>
            </ul>
          </div>
        </div>
        <textarea 
          v-model="noteContent" 
          class="markdown-textarea-simple"
          placeholder="Write your markdown here..."
          @input="onContentChange"
          @blur="updateContent"
        ></textarea>
      </div>
    </div>

    <div class="editor-footer">
      <div class="note-metadata">
        <span v-if="note.date_created" class="meta-item">
          Created: {{ formatDate(note.date_created) }}
        </span>
        <span v-if="note.last_modified" class="meta-item">
          Modified: {{ formatDate(note.last_modified) }}
        </span>
      </div>
      
      <div class="editor-tools">
        <button @click="toggleTags" class="btn btn-secondary btn-sm">
          Tags
        </button>
        <button @click="toggleSummary" class="btn btn-secondary btn-sm">
          Summary
        </button>
      </div>
    </div>

    <!-- Tags Panel -->
    <div v-if="showTags" class="tags-panel">
      <TagsPanel 
        :note="note"
        @tags-updated="refreshTags"
      />
    </div>

    <!-- Summary Panel -->
    <div v-if="showSummary" class="summary-panel">
      <SummaryPanel 
        ref="summaryPanelRef"
        :note="note"
        @summary-updated="refreshSummary"
      />
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, computed } from 'vue'
import { notesAPI } from '../services/apiServices.js'
import { authService } from '../services/authService.js'
import TagsPanel from './TagsPanel.vue'
import SummaryPanel from './SummaryPanel.vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export default {
  name: 'NoteEditor',
  components: {
    TagsPanel,
    SummaryPanel
  },
  props: {
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['note-updated', 'note-deleted', 'exit-editor'],
  setup(props, { emit }) {
    const noteTitle = ref('')
    const noteContent = ref('')
    const saving = ref(false)
    const showTags = ref(false)
    const showSummary = ref(false)
    const saveTimeout = ref(null)
    const summaryPanelRef = ref(null)
    const initialContentLength = ref(0)
    const isEditing = ref(false) // Start in preview mode by default
    const showMarkdownHelp = ref(false)

    // Initialize form data when note changes
    watch(() => props.note, (newNote) => {
      if (newNote) {
        noteTitle.value = newNote.title || ''
        noteContent.value = newNote.content || ''
        initialContentLength.value = newNote.content?.length || 0
      }
    }, { immediate: true })

    const updateTitle = async () => {
      if (!props.note || noteTitle.value === props.note.title) return

      const user = authService.getUser()
      if (!user) return

      try {
        await notesAPI.setTitle(props.note._id, user, noteTitle.value)
        emit('note-updated')
      } catch (error) {
        console.error('Error updating title:', error)
        alert('Error updating title: ' + (error.error || 'Unknown error'))
      }
    }

    const updateContent = async () => {
      if (!props.note || noteContent.value === props.note.content) return

      const user = authService.getUser()
      if (!user) return

      saving.value = true
      try {
        await notesAPI.updateContent(props.note._id, noteContent.value)
        emit('note-updated')
      } catch (error) {
        console.error('Error updating content:', error)
        alert('Error updating content: ' + (error.error || 'Unknown error'))
      } finally {
        saving.value = false
      }
    }

    const onContentChange = () => {
      // Debounce content updates
      if (saveTimeout.value) {
        clearTimeout(saveTimeout.value)
      }
      
      saveTimeout.value = setTimeout(() => {
        updateContent()
      }, 1000) // Save after 1 second of inactivity
    }

    const saveNote = async () => {
      await Promise.all([
        updateTitle(),
        updateContent()
      ])
    }

    const deleteNote = async () => {
      if (!confirm(`Are you sure you want to delete "${props.note.title}"?`)) {
        return
      }

      const user = authService.getUser()
      if (!user) return

      try {
        await notesAPI.deleteNote(props.note._id)
        emit('note-deleted')
      } catch (error) {
        console.error('Error deleting note:', error)
        alert('Error deleting note: ' + (error.error || 'Unknown error'))
      }
    }

    const exitEditor = async () => {
      // Save the note before exiting
      await saveNote()
      
      // Auto-generate summary if needed
      if (summaryPanelRef.value && summaryPanelRef.value.autoGenerateSummaryIfNeeded) {
        await summaryPanelRef.value.autoGenerateSummaryIfNeeded()
      }
      
      emit('exit-editor')
    }

    const toggleTags = () => {
      showTags.value = !showTags.value
      if (showTags.value) {
        showSummary.value = false
      }
    }

    const toggleSummary = () => {
      console.log('🔍 [NoteEditor] toggleSummary called, current showSummary:', showSummary.value)
      showSummary.value = !showSummary.value
      console.log('🔍 [NoteEditor] showSummary after toggle:', showSummary.value)
      if (showSummary.value) {
        showTags.value = false
      }
    }

    const refreshTags = () => {
      // Tags will be refreshed by parent component
    }

    const refreshSummary = () => {
      // Summary will be refreshed by parent component
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    // Configure marked for syntax highlighting
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch (err) {
            console.error('Error highlighting code:', err)
          }
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true
    })

    // Computed property for rendered markdown
    const renderedMarkdown = computed(() => {
      if (!noteContent.value) return ''
      try {
        return marked(noteContent.value)
      } catch (error) {
        console.error('Error rendering markdown:', error)
        return '<p>Error rendering markdown</p>'
      }
    })

    // Start editing
    const startEditing = () => {
      isEditing.value = true
    }

    // Stop editing and return to preview
    const stopEditing = () => {
      isEditing.value = false
    }

    return {
      noteTitle,
      noteContent,
      saving,
      showTags,
      showSummary,
      summaryPanelRef,
      isEditing,
      showMarkdownHelp,
      renderedMarkdown,
      updateTitle,
      updateContent,
      onContentChange,
      saveNote,
      deleteNote,
      exitEditor,
      startEditing,
      stopEditing,
      toggleTags,
      toggleSummary,
      refreshTags,
      refreshSummary,
      formatDate
    }
  }
}
</script>

<style scoped>
.note-editor {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  position: relative;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.editor-header-fullscreen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  width: 100vw;
  box-sizing: border-box;
}

.editor-title {
  flex: 1;
  margin-right: 1rem;
  padding-left: 2rem;
}

.title-input {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  border: none;
  background: none;
  padding: 0.5rem 0;
  outline: none;
  transition: border-color var(--transition-fast);
}

.title-input:focus {
  border-bottom: 2px solid var(--accent-blue);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
  padding-right: 2rem;
}

.editor-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  margin-top: 60px; /* Account for fixed header */
  margin-bottom: 60px; /* Account for fixed footer */
  transition: margin-top 0.2s ease, margin-bottom 0.2s ease;
}

/* When panels are open, add extra margin to content */
.editor-content.has-panel {
  margin-bottom: 200px; /* Extra space when panel is open at bottom */
}

.content-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  font-size: 1rem;
  line-height: 1.6;
  font-family: inherit;
  resize: none;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-primary);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100vw;
  box-sizing: border-box;
  z-index: 100;
}

.note-metadata {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-primary); /* Improved visibility from text-muted */
  font-weight: 500; /* Added weight for better readability */
  padding-left: 2rem;
}

.meta-item {
  white-space: nowrap;
}

.editor-tools {
  display: flex;
  gap: 0.5rem;
  padding-right: 2rem;
}

.editor-tools .btn {
  border-bottom: none;
}

.editor-tools .btn:focus,
.editor-tools .btn:active {
  border-bottom: none;
  outline: none;
}

.note-editor .tags-panel,
.note-editor .summary-panel {
  position: fixed;
  bottom: 60px; /* Position above the fixed footer */
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  padding: 1rem 2rem;
  z-index: 99;
  max-height: calc(100vh - 120px); /* Account for header and footer */
  overflow-y: auto;
}

/* Override SummaryPanel internal styles to ensure full width */
.note-editor .summary-panel {
  padding: 1rem 2rem !important;
  background: var(--bg-primary) !important;
  border-radius: 0 !important;
  border: none !important;
  width: 100vw !important;
  left: 0 !important;
  right: 0 !important;
  box-sizing: border-box !important;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.btn-sm span {
  margin-right: 0.25rem;
}

/* Markdown Styles */
.markdown-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-primary);
}

.mode-indicator {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Preview-only mode */
.markdown-preview-only {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-card);
}

.markdown-preview-only .preview-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  font-family: var(--font-secondary);
  line-height: 1.6;
  color: var(--text-primary);
}

/* Split view mode */
.markdown-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 500px;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.markdown-editor,
.markdown-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header-simple,
.preview-header-small {
  background-color: var(--bg-secondary);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-primary);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color var(--transition-fast);
  color: var(--text-secondary);
}

.help-btn:hover {
  background-color: var(--bg-hover);
}

.markdown-help {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
}

.help-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.help-content ul {
  margin: 0;
  padding-left: 1rem;
}

.help-content li {
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.help-content code {
  background-color: var(--bg-tertiary);
  color: var(--accent-orange);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
}

.markdown-textarea-simple {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 1rem;
  resize: none;
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.preview-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: var(--bg-card);
  font-family: var(--font-secondary);
  line-height: 1.6;
  color: var(--text-primary);
}

/* Markdown content styling */
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-content h1 { 
  font-size: 1.8rem; 
  border-bottom: 2px solid var(--border-primary); 
  padding-bottom: 0.3rem; 
  color: var(--accent-red);
}
.preview-content h2 { 
  font-size: 1.5rem; 
  border-bottom: 1px solid var(--border-primary); 
  padding-bottom: 0.2rem; 
  color: var(--accent-orange);
}
.preview-content h3 { 
  font-size: 1.3rem; 
  color: var(--accent-yellow);
}
.preview-content h4 { 
  font-size: 1.1rem; 
  color: var(--accent-green);
}
.preview-content h5 { 
  font-size: 1rem; 
  color: var(--accent-blue);
}
.preview-content h6 { 
  font-size: 0.9rem; 
  color: var(--accent-purple); 
}

.preview-content p {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.preview-content ul,
.preview-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.preview-content li {
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.preview-content blockquote {
  border-left: 4px solid var(--accent-blue);
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background-color: var(--bg-secondary);
  border-radius: 0 4px 4px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.preview-content code {
  background-color: var(--bg-tertiary);
  color: var(--accent-orange);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.preview-content pre {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.preview-content pre code {
  background: none;
  padding: 0;
  color: var(--text-primary);
  border-radius: 0;
}

.preview-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  background-color: var(--bg-card);
  border-radius: 6px;
  overflow: hidden;
}

.preview-content th,
.preview-content td {
  border: 1px solid var(--border-primary);
  padding: 0.5rem;
  text-align: left;
}

.preview-content th {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}

.preview-content a {
  color: var(--accent-orange);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.preview-content a:hover {
  color: var(--accent-coral);
  text-decoration: underline;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: var(--shadow-sm);
}

.preview-content hr {
  border: none;
  border-top: 2px solid var(--border-primary);
  margin: 2rem 0;
}

/* Simple markdown editor */
.markdown-editor-simple {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-card);
}

.editor-header-simple {
  background-color: var(--bg-secondary);
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--border-primary);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.markdown-textarea-simple {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 1rem;
  resize: none;
  background-color: var(--bg-card);
  color: var(--text-primary);
}

/* Responsive design */
@media (max-width: 768px) {
  .markdown-split {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .markdown-editor,
  .markdown-preview {
    min-height: 300px;
  }
}
</style>
