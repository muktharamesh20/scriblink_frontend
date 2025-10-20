import api from './api.js'

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: async (username, password) => {
    try {
      const response = await api.post('/PasswordAuth/register', {
        username,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Authenticate user
  authenticate: async (username, password) => {
    try {
      const response = await api.post('/PasswordAuth/authenticate', {
        username,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Folder API calls
export const folderAPI = {
  // Initialize root folder for user
  initializeFolder: async (user) => {
    try {
      const response = await api.post('/Folder/initializeFolder', { user })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Create a new folder
  createFolder: async (user, title, parent) => {
    try {
      const response = await api.post('/Folder/createFolder', {
        user,
        title,
        parent
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Move folder to new parent
  moveFolder: async (folder, newParent) => {
    try {
      const response = await api.post('/Folder/moveFolder', {
        folder,
        newParent
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete folder
  deleteFolder: async (folderId) => {
    try {
      const response = await api.post('/Folder/deleteFolder', {
        f: folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Insert item into folder
  insertItem: async (item, folder) => {
    try {
      const response = await api.post('/Folder/insertItem', {
        item,
        folder
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete item from folder
  deleteItem: async (item) => {
    try {
      const response = await api.post('/Folder/deleteItem', {
        item
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get folder children
  getFolderChildren: async (folderId) => {
    try {
      const response = await api.post('/Folder/_getFolderChildren', {
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get folder items
  getFolderItems: async (folderId) => {
    try {
      const response = await api.post('/Folder/_getFolderItems', {
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get folder details
  getFolderDetails: async (folderId) => {
    try {
      const response = await api.post('/Folder/_getFolderDetails', {
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Notes API calls
export const notesAPI = {
  // Create a new note
  createNote: async (user, title = null) => {
    try {
      const response = await api.post('/Notes/createNote', {
        user,
        title
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete a note
  deleteNote: async (noteId, user) => {
    try {
      const response = await api.post('/Notes/deleteNote', {
        noteId,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Set note title
  setTitle: async (noteId, user, newTitle) => {
    try {
      const response = await api.post('/Notes/setTitle', {
        noteId,
        user,
        newTitle
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update note content
  updateContent: async (noteId, user, newContent) => {
    try {
      const response = await api.post('/Notes/updateContent', {
        noteId,
        user,
        newContent
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get note details
  getNoteDetails: async (noteId, user) => {
    try {
      const response = await api.post('/Notes/getNoteDetails', {
        noteId,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all notes by user
  getNotesByUser: async (ownerId) => {
    try {
      const response = await api.post('/Notes/getNotesByUser', {
        ownerId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Summaries API calls
export const summariesAPI = {
  // Set summary manually
  setSummary: async (item, summary) => {
    try {
      const response = await api.post('/Summaries/setSummary', {
        item,
        summary
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Set summary with AI
  setSummaryWithAI: async (item, text) => {
    try {
      const response = await api.post('/Summaries/setSummaryWithAI', {
        item,
        text
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete summary
  deleteSummary: async (item) => {
    try {
      const response = await api.post('/Summaries/deleteSummary', {
        item
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Tags API calls
export const tagsAPI = {
  // Add tag to item
  addTag: async (user, label, item) => {
    try {
      const response = await api.post('/Tags/addTag', {
        user,
        label,
        item
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Remove tag from item
  removeTagFromItem: async (tagId, itemId) => {
    try {
      const response = await api.post('/Tags/removeTagFromItem', {
        t: tagId,
        i: itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get items by tag
  getItemsByTag: async (tagId) => {
    try {
      const response = await api.post('/Tags/_getItemsByTag', {
        tagId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get tags for item
  getTagsForItem: async (user, item) => {
    try {
      const response = await api.post('/Tags/_getTagsForItem', {
        user,
        item
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get tag details
  getTagDetails: async (tagId) => {
    try {
      const response = await api.post('/Tags/_getTagDetails', {
        tagId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all user tags
  getAllUserTags: async (user) => {
    try {
      const response = await api.post('/Tags/_getAllUserTags', {
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}
