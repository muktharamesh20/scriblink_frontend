import api from './api.js'

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: async (username, password) => {
    console.log('🔐 authAPI.register called with:', { username, password })
    try {
      console.log('📡 About to make POST request to /PasswordAuth/register')
      const response = await api.post('/PasswordAuth/register', {
        username,
        password
      })
      console.log('📡 Response received:', response.data)
      return response.data
    } catch (error) {
      console.error('📡 Error in authAPI.register:', error)
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

// Notes API calls
export const notesAPI = {
  // Create a new note
  createNote: async (user, content, folderId, title) => {
    try {
      const response = await api.post('/Notes/createNote', {
        user,
        content,
        folderId,
        title
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get user notes
  getUserNotes: async (user, folderId) => {
    try {
      const response = await api.post('/Notes/getUserNotes', {
        user,
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update note
  updateNote: async (noteId, content, title) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        content,
        title,
        user: localStorage.getItem('user')
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update note content
  updateContent: async (noteId, content) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        content,
        user: localStorage.getItem('user')
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Set note title
  setTitle: async (noteId, user, title) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        title,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete note
  deleteNote: async (noteId) => {
    try {
      const response = await api.post('/Notes/deleteNote', {
        noteId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Folder API calls
export const folderAPI = {
  // Create a new folder
  createFolder: async (user, title, parentFolderId) => {
    try {
      const response = await api.post('/Folder/createFolder', {
        user,
        title,
        parentFolderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get folder structure
  getFolderStructure: async (user, folderId) => {
    try {
      const response = await api.post('/Folder/getFolderStructure', {
        user,
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Move folder to new parent
  moveFolder: async (folder, newParent) => {
    try {
      const response = await api.post('/Request/moveFolder', {
        folderId: folder,
        newParentId: newParent,
        user: localStorage.getItem('user')
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
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Add item to folder
  addItem: async (folderId, itemId) => {
    try {
      const response = await api.post('/Folder/addItem', {
        folderId,
        itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Remove item from folder
  removeItem: async (folderId, itemId) => {
    try {
      const response = await api.post('/Folder/removeItem', {
        folderId,
        itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Insert item into folder
  insertItem: async (folderId, itemId) => {
    try {
      const response = await api.post('/Folder/insertItem', {
        folderId,
        itemId
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

// Tags API calls
export const tagsAPI = {
  // Add tag to item
  addTag: async (user, itemId, tagLabel) => {
    try {
      const response = await api.post('/Tags/addTag', {
        user,
        itemId,
        tagLabel
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Remove tag from item
  removeTag: async (user, itemId, tagLabel) => {
    try {
      const response = await api.post('/Tags/removeTag', {
        user,
        itemId,
        tagLabel
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get tags for item
  getItemTags: async (user, itemId) => {
    try {
      const response = await api.post('/Tags/getItemTags', {
        user,
        itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all tags for user
  getUserTags: async (user) => {
    try {
      const response = await api.post('/Tags/getUserTags', {
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

// Summaries API calls
export const summariesAPI = {
  // Set summary for item
  setSummary: async (user, itemId, summary) => {
    try {
      const response = await api.post('/Summaries/setSummary', {
        user,
        itemId,
        summary
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get summary for item
  getSummary: async (user, itemId) => {
    try {
      const response = await api.post('/Summaries/getSummary', {
        user,
        itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete summary for item
  deleteSummary: async (user, itemId) => {
    try {
      const response = await api.post('/Summaries/deleteSummary', {
        user,
        itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get all summaries for user
  getUserSummaries: async (user) => {
    try {
      const response = await api.post('/Summaries/getUserSummaries', {
        user,
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}


// Export requestAPI
export const requestAPI = {
  // User management
  registerUser: async (username, password) => {
    try {
      const response = await api.post('/Request/registerUser', {
        username,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  loginUser: async (username, password) => {
    try {
      const response = await api.post('/Request/loginUser', {
        username,
        password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Folder management
  getFolderStructure: async (user, folderId = undefined) => {
    try {
      const response = await api.post('/Request/getFolderStructure', {
        user,
        folderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  createFolder: async (user, title, parentFolderId) => {
    try {
      const response = await api.post('/Request/createFolder', {
        user,
        title,
        parentFolderId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteFolder: async (folderId, user) => {
    try {
      const response = await api.post('/Request/deleteFolder', {
        folderId,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  moveFolder: async (folder, newParent) => {
    try {
      const response = await api.post('/Request/moveFolder', {
        folderId: folder,
        newParentId: newParent,
        user: localStorage.getItem('user')
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Note management
  createNote: async (user, content, folderId, title, tags = null) => {
    try {
      const response = await api.post('/Request/createNote', {
        user,
        content,
        folderId,
        title,
        tags
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getUserNotes: async (user, folderId = undefined, tagLabel = null) => {
    try {
      const response = await api.post('/Request/getUserNotes', {
        user,
        folderId,
        tagLabel
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateNote: async (noteId, title, content, user) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        title,
        content,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  updateContent: async (noteId, content, user) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        content,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  setTitle: async (noteId, title, user) => {
    try {
      const response = await api.post('/Request/updateNote', {
        noteId,
        title,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

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

  // Create root folder
  createRootFolder: async (user) => {
    try {
      const response = await api.post('/Folder/initializeFolder', {
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}