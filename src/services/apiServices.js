import api from './api.js'
import { authHandler } from './authHandler.js'

// Authentication API calls
export const authAPI = {
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

  authenticate: async (username, password) => {
    try {
      const requestPayload = {
        username,
        password
      }
      const response = await api.post('/PasswordAuth/authenticate', requestPayload)
      return response.data
    } catch (error) {
      console.error('❌ [authAPI.authenticate] Login failed:', error)
      throw error.response?.data || error
    }
  }
}

// Notes API calls
export const notesAPI = {
  createNote: async (user, content, folder, title) => {
    return authHandler.wrap(async () => {
      return await api.post('/Notes/createNote', {
        user,
        content,
        folder,
        title,
      })
    })
  },

  getUserNotes: async (user, folderId = undefined, tagLabel = null) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Notes/getUserNotes', {
        user: user,
        folderId: folderId,
        tagLabel: tagLabel
      })
    })
    
    // Backend sync responds with { notes, accessToken }
    // Notes already have folderId augmented and are filtered
    return { notes: response.notes || [] }
  },

  updateContent: async (noteId, content) => {
    return authHandler.wrap(async () => {
      const response = await api.post('/Notes/updateContent', {
        noteId,
        newContent: content,
        user: localStorage.getItem('user')
      })
      return response.data
    })
  },

  setTitle: async (noteId, user, title) => {
    return authHandler.wrap(async () => {
      const response = await api.post('/Notes/setTitle', {
        noteId,
        newTitle: title,
        user
      })
      return response.data
    })
  },

  deleteNote: async (noteId) => {
    return authHandler.wrap(async () => {
      return await api.post('/Notes/deleteNote', {
        noteId,
        user: localStorage.getItem('user')
      })
    })
  },

  getNoteDetails: async (user, noteId) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Notes/getNoteDetails', {
        user: user,
        noteId: noteId
      })
    })
    console.log('🔍 [getNoteDetails] Full response:', response)
    console.log('🔍 [getNoteDetails] Response keys:', Object.keys(response || {}))
    console.log('🔍 [getNoteDetails] Has note?:', !!response?.note)
    return response
  }
}

// Folder API calls
export const folderAPI = {
  getRootFolder: async (authToken) => {
    const user = localStorage.getItem('user')
    const response = await authHandler.wrap(async () => {
      return await api.post('/Folder/getRootFolderId', { user })
    })
    // Backend sync responds with { rootFolder, accessToken }
    return response.rootFolder
  },

  getAllFolders: async (user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/getAllFolders', { user })
    })
  },

  createFolder: async (user, title, parent) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/createFolder', {
        user,
        title,
        parent: parent
      })
    })
  },

  moveFolder: async (folder, newParent) => {
    return authHandler.wrap(async () => {
      // Ensure they are strings (not objects)
      const folderIdStr = String(folder).trim();
      const newParentIdStr = String(newParent).trim();
      
      if (!folderIdStr || !newParentIdStr) {
        throw { error: 'folderId and newParentId must be non-empty strings' }
      }
      
      // Note: backend moveFolder doesn't use 'user' parameter - it validates ownership by checking folder owners match
      // The interceptor will add user and authToken automatically
      return await api.post('/Folder/moveFolder', {
        folderId: folderIdStr,
        newParentId: newParentIdStr
      })
    })
  },

  deleteFolder: async (folderId, user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/deleteFolder', {
        folderId,
        user: user || localStorage.getItem('user')
      })
    })
  },

  moveNote: async (noteId, folderId, user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/insertItem', {
        item: noteId,
        folder: folderId,
        user
      })
    })
  }
}

// Tags API calls
export const tagsAPI = {
  getAllUserTagsFull: async (user) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Tags/getAllUserTags', { user })
    })
    // Backend sync responds with { tags: [...], accessToken }
    return response.tags || []
  },

  addTag: async (user, itemId, tagLabel) => {
    return authHandler.wrap(async () => {
      return await api.post('/Tags/addTagToItem', {
        user,
        item: itemId,
        label: tagLabel
      })
    })
  },

  removeTag: async (user, itemId, tagLabel) => {
    return authHandler.wrap(async () => { 
      return await api.post('/Tags/removeTagFromItem', {
        user,
        item: itemId,
        tag: tagLabel
      })
    })
  },

  getItemTags: async (user, itemId) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Tags/getTagsForItem', {
        user: user,
        item: itemId
      })
    })
    // Backend sync responds with { tags: [...], accessToken }
    return response.tags || []
  }
}

// Summaries API calls
export const summariesAPI = {
  setSummary: async (user, itemId, summary) => {
    return authHandler.wrap(async () =>  {
      const response = await api.post('/Summaries/setSummary', {
        item: itemId,
        summary
      })
      return response.data
    })
  },

  getSummary: async (user, itemId) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Summaries/getSummary', {
        user: user,
        item: itemId
      })
    })
    // Backend sync responds with { summary, accessToken }
    return response.summary
  },

  getUserSummaries: async (user) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Notes/getNotesByUser', {
        user: user,  // For authenticated request, send 'user'
        ownerId: user  // Backend concept expects 'ownerId'
      })
    })
    // Backend sync responds with { notes: [...], accessToken }
    return response.notes || []
  },

  generateSummary: async (user, noteId) => {
    // Ensure noteId is a string
    const noteIdString = typeof noteId === 'string' ? noteId : noteId?._id || noteId?.toString()
    
    if (!noteIdString) {
      throw new Error('Invalid noteId provided')
    }

    const response = await authHandler.wrap(async () => {
      return await api.post('/Summaries/generateSummary', {
        user: user,
        noteId: noteIdString
      })
    })
    
    // Backend sync responds with { summary, accessToken }
    return response.summary
  }
}
