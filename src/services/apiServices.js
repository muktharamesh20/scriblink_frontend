import api from './api.js'
import { authHandler } from './authHandler.js'

// Authentication API calls (DEPRECATED - use requestAPI instead)
export const authAPI = {
  // All authentication should go through requestAPI
  register: async (username, password) => {
    console.warn('⚠️ authAPI.register is deprecated - use requestAPI.registerUser instead')
    return requestAPI.registerUser(username, password)
  },

  authenticate: async (username, password) => {
    console.warn('⚠️ authAPI.authenticate is deprecated - use requestAPI.loginUser instead')
    return requestAPI.loginUser(username, password)
  }
}

// Notes API calls (DEPRECATED - use requestAPI instead)
export const notesAPI = {
  // All these methods now route through requestAPI
  createNote: async (user, content, folder, title) => {
    return requestAPI.createNote(user, content, folder, title)
  },

  getUserNotes: async (user, folderId = undefined, tagLabel = null) => {
    return requestAPI.getUserNotes(user, folderId, tagLabel)
  },

  updateContent: async (noteId, content) => {
    return requestAPI.updateContent(noteId, content, localStorage.getItem('user'))
  },

  setTitle: async (noteId, user, title) => {
    return requestAPI.setTitle(noteId, title, user)
  },

  deleteNote: async (noteId) => {
    return requestAPI.deleteNote(noteId, localStorage.getItem('user'))
  }
}

// Folder API calls (DEPRECATED - use requestAPI instead)
export const folderAPI = {
  getRootFolder: async (authToken) => {
    return requestAPI.getRootFolderId(localStorage.getItem('user'))
  },

  getAllFolders: async (user) => {
    return requestAPI.getAllFolders(user)
  },

  createFolder: async (user, title, parent) => {
    return requestAPI.createFolder(user, title, parent)
  },

  moveFolder: async (folder, newParent) => {
    return requestAPI.moveFolder(folder, newParent)
  },

  deleteFolder: async (folderId, user) => {
    return requestAPI.deleteFolder(folderId, user || localStorage.getItem('user'))
  },

  moveNote: async (noteId, folderId, user) => {
    return requestAPI.moveNote(noteId, folderId, user)
  },
}

export const tagsAPI = {
  getAllUserTagsFull: async (user) => {
    return requestAPI._getAllUserTagsFull(user)
  },

  addTag: async (user, itemId, tagLabel) => {
    return requestAPI.tagItem(user, itemId, tagLabel)
  },

  removeTag: async (user, itemId, tagLabel) => {
    return requestAPI.untagItem(user, itemId, tagLabel)
  },

  getItemTags: async (user, itemId) => {
    return requestAPI.getItemTags(user, itemId)
  }
}

export const summariesAPI = {
  setSummary: async (user, itemId, summary) => {
    return requestAPI.setSummary(user, itemId, summary)
  },

  getSummary: async (user, itemId) => {
    return requestAPI.getSummary(user, itemId)
  },

  getUserSummaries: async (user) => {
    return requestAPI.getUserSummaries(user)
  },

  generateSummary: async (user, noteId) => {
    return requestAPI.generateSummary(user, noteId)
  }
}


export const requestAPI = {
  registerUser: async (username, password) => {
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

  getAllFolders: async (user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/getAllFolders', { user })
    })
  },

  loginUser: async (username, password) => {
    try {
      const requestPayload = {
        username,
        password
      }
      const response = await api.post('/PasswordAuth/authenticate', requestPayload)
      return response.data
    } catch (error) {
      console.error('❌ [requestAPI.loginUser] Login failed:', error)
      throw error.response?.data || error
    }
  },


  getRootFolderId: async (user) => {
    try {
      const response = await api.post('/Folder/_getRootFolderId', { user })
      return response.data.rootFolder
    } catch (error) {
      throw error.response?.data || error
    }
  },

  createFolder: async (user, title, parentFolderId) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/createFolder', {
        user,
        title,
        parent: parentFolderId
      })
    })
  },

  deleteFolder: async (folderId, user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/deleteFolder', {
        folderId,
        user
      })
    })
  },

  moveFolder: async (folderId, newParentId) => {
    return authHandler.wrap(async () => {
      // Ensure they are strings (not objects)
      const folderIdStr = String(folderId).trim();
      const newParentIdStr = String(newParentId).trim();
      
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
    try {
      // 1. Get all notes for the user (using getUserSummaries)
      const notesData = await requestAPI.getUserSummaries(user);
      let notes = Array.isArray(notesData) ? notesData : [];

      // 2. Get all folders for this user to determine folderId mapping
      let allFolders = [];
      const allFoldersResult = await requestAPI.getAllFolders(user);
      console.log('🔍 [getUserNotes] getAllFolders result:', allFoldersResult);
      
      if (allFoldersResult?.error) {
        throw new Error(allFoldersResult.error);
      }
      
      // getAllFolders uses authHandler.wrap, returns { folders: [...], accessToken }
      allFolders = Array.isArray(allFoldersResult.folders) ? allFoldersResult.folders : [];
      console.log('🔍 [getUserNotes] Extracted folders:', allFolders.length, 'folders');

      // Build a mapping of noteId -> folderId
      const noteToFolderMap = new Map();
      for (const folder of allFolders) {
        if (Array.isArray(folder.elements)) {
          for (const noteId of folder.elements) {
            noteToFolderMap.set(noteId, folder._id);
          }
        }
      }

      // Augment notes with virtual 'folderId'
      let notesWithFolder = notes.map((note) => ({
        ...note,
        folderId: noteToFolderMap.get(note._id) || null,
      }));

      // Folder filter
      if (folderId !== undefined) {
        notesWithFolder = notesWithFolder.filter((note) => note.folderId === folderId);
      }

      // Tag filter (optional)
      if (tagLabel !== undefined && tagLabel !== null) {
        // Get all user tags (full objects with items, not just labels)
        const allTagsResult = await requestAPI._getAllUserTagsFull(user);
        const tagWithLabel = allTagsResult.find((tag) => tag.label === tagLabel);

        if (tagWithLabel) {
          notesWithFolder = notesWithFolder.filter(note =>
            Array.isArray(tagWithLabel.items) && tagWithLabel.items.includes(note._id)
          );
        } else {
          notesWithFolder = []; // No notes for this tag
        }
      }

      return { notes: notesWithFolder };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateContent: async (noteId, content, user) => {
    return authHandler.wrap(async () => {
      const response = await api.post('/Notes/updateContent', {
        noteId,
        newContent: content,
        user
      })
      return response.data
    })
  },

  setTitle: async (noteId, title, user) => {
    return authHandler.wrap(async () => {
      const response = await api.post('/Notes/setTitle', {
        noteId,
        newTitle: title,
        user
      })
      return response.data
    })
  },

  deleteNote: async (noteId, user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Notes/deleteNote', {
        noteId,
        user
      })
    })
  },

  // Move note to folder
  moveNote: async (noteId, folderId, user) => {
    return authHandler.wrap(async () => {
      return await api.post('/Folder/insertItem', {
        item: noteId,
        folder:folderId,
        user
      })
    })
  },

  // Tag management
  tagItem: async (user, itemId, tagLabel) => {
    return authHandler.wrap(async () => {
      return await api.post('/Tags/addTagToItem', {
        user,
        item: itemId,
        label: tagLabel
      })
    })
  },

  untagItem: async (user, itemId, tagIdentifier) => {
    return authHandler.wrap(async () => { 
      return await api.post('/Tags/removeTagFromItem', {
        user,
        item: itemId,
        tag: tagIdentifier
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
  },

  // Get full user tags (with items array) for filtering
  _getAllUserTagsFull: async (user) => {
    const response = await authHandler.wrap(async () => {
      return await api.post('/Tags/getAllUserTags', { user })
    })
    // Backend sync responds with { tags: [...], accessToken }
    return response.tags || []
  },

  // Summary management
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
    return authHandler.wrap(async () => {
      const response = await api.post('/Summaries/getSummary', {
        user: user,
        item: itemId
      })
      console.log('🔍 [getSummary] Summary result:', response)
      return response.data
    })
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
  },

  // Generate summary with AI
  generateSummary: async (user, noteId) => {
    try {
      // console.log('🔍 [generateSummary] Generating summary for note:', noteId)
      
      // Ensure noteId is a string
      const noteIdString = typeof noteId === 'string' ? noteId : noteId?._id || noteId?.toString()
      
      if (!noteIdString) {
        throw new Error('Invalid noteId provided')
      }
      
      const noteDetailsResponse = await requestAPI.getNoteDetails(user, noteId)
      console.log('🔍 [generateSummary] Note details response:', noteDetailsResponse)

      // Extract content from note details - response has { content, accessToken } structure
      const noteContent = noteDetailsResponse.content
      
      if (!noteContent) {
        console.error('❌ [generateSummary] Note content not found. Response:', noteDetailsResponse)
        throw new Error('Note content not found in response')
      }

      const summaryResult = await api.post('/Summaries/setSummaryWithAI', {
          user: user,
          text: noteContent,
          item: noteIdString
        })

        if ("error" in summaryResult.data) {
          throw new Error(summaryResult.data.error)
        }

        console.log('🔍 [generateSummary] Summary result:', summaryResult.data)

      const newSummary = await api.post('/Summaries/getSummary', {
        user: user,
        item: noteIdString
      })

      return newSummary.data
    } catch (error) {
      console.error('❌ [generateSummary] Error:', error)
      console.log('❌ [generateSummary] Error:', error.response?.data)
      throw error.response?.data || error
    }
  }
}