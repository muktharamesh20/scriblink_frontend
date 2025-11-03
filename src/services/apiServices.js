import api from './api.js'

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
  getRootFolder: async () => {
    return requestAPI._getRootFolderId(localStorage.getItem('user'))
  },

  getFolderStructure: async (user, folderId = undefined) => {
    return requestAPI.getFolderStructure(user, folderId)
  },

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

  moveFolder: async (folder, newParent) => {
    return requestAPI.moveFolder(folder, newParent)
  },

  deleteFolder: async (folderId, user) => {
    return requestAPI.deleteFolder(folderId, user || localStorage.getItem('user'))
  },

  moveNote: async (noteId, folderId, user) => {
    return requestAPI.moveNote(noteId, folderId, user)
  },

  // These internal methods should not be used directly - use requestAPI methods instead
  addItem: async (folderId, itemId) => {
    console.warn('⚠️ folderAPI.addItem is deprecated - folder operations are handled internally')
    throw new Error('Method deprecated - use requestAPI.moveNote or other high-level operations')
  },

  removeItem: async (folderId, itemId) => {
    console.warn('⚠️ folderAPI.removeItem is deprecated - folder operations are handled internally')
    throw new Error('Method deprecated - use requestAPI.moveNote or other high-level operations')
  },

  insertItem: async (folderId, itemId) => {
    console.warn('⚠️ folderAPI.insertItem is deprecated - folder operations are handled internally')
    throw new Error('Method deprecated - use requestAPI.moveNote or other high-level operations')
  },

  deleteItem: async (item) => {
    console.warn('⚠️ folderAPI.deleteItem is deprecated - use requestAPI.deleteNote instead')
    throw new Error('Method deprecated - use requestAPI.deleteNote instead')
  },

  // Internal methods - should not be called directly from frontend
  getFolderChildren: async (folderId) => {
    console.warn('⚠️ folderAPI.getFolderChildren is deprecated - use requestAPI.getFolderStructure instead')
    throw new Error('Method deprecated - use requestAPI.getFolderStructure instead')
  },

  getFolderItems: async (folderId) => {
    console.warn('⚠️ folderAPI.getFolderItems is deprecated - use requestAPI.getUserNotes instead')
    throw new Error('Method deprecated - use requestAPI.getUserNotes instead')
  },

  getFolderDetails: async (folderId) => {
    console.warn('⚠️ folderAPI.getFolderDetails is deprecated - use requestAPI.getFolderStructure instead')
    throw new Error('Method deprecated - use requestAPI.getFolderStructure instead')
  }
}

// Tags API calls (DEPRECATED - use requestAPI instead)
export const tagsAPI = {
  // All these methods now route through requestAPI
  addTag: async (user, itemId, tagLabel) => {
    return requestAPI.tagItem(user, itemId, tagLabel)
  },

  removeTag: async (user, itemId, tagLabel) => {
    return requestAPI.untagItem(user, itemId, tagLabel)
  },

  getItemTags: async (user, itemId) => {
    return requestAPI.getItemTags(user, itemId)
  },

  getUserTags: async (user) => {
    return requestAPI.getUserTags(user)
  }
}

// Summaries API calls (DEPRECATED - use requestAPI instead)
export const summariesAPI = {
  // All these methods now route through requestAPI
  setSummary: async (user, itemId, summary) => {
    return requestAPI.setSummary(user, itemId, summary)
  },

  getSummary: async (user, itemId) => {
    return requestAPI.getSummary(user, itemId)
  },

  deleteSummary: async (user, itemId) => {
    return requestAPI.deleteSummary(user, itemId)
  },

  getUserSummaries: async (user) => {
    return requestAPI.getUserSummaries(user)
  },

  generateSummary: async (user, noteId) => {
    return requestAPI.generateSummary(user, noteId)
  }
}


// Export requestAPI
export const requestAPI = {
  // User management
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

  loginUser: async (username, password) => {
    console.log('🔐 [requestAPI.loginUser] Attempting login with:', { username, passwordLength: password?.length })
    try {
      const requestPayload = {
        username,
        password
      }
      console.log('📡 [requestAPI.loginUser] Sending request to /Request/loginUser')
      const response = await api.post('/PasswordAuth/authenticate', requestPayload)
      console.log('✅ [requestAPI.loginUser] Response received:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ [requestAPI.loginUser] Login failed:', error)
      console.error('❌ [requestAPI.loginUser] Error response:', error.response?.data)
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

  // Folder management
  getFolderStructure: async (user, folderId = undefined) => {
    console.log('🚀 [requestAPI.getFolderStructure] Starting getFolderStructure API call');
    console.log('🔍 [requestAPI.getFolderStructure] Parameters:', { user, folderId });
    
    try {
      const requestPayload = { user, folderId };
      console.log('🔍 [requestAPI.getFolderStructure] Request payload:', requestPayload);
      
      const response = await api.post('/Folder/getFolderStructure', requestPayload);
      console.log('✅ [requestAPI.getFolderStructure] API response received:', response.data);
      return response.data
    } catch (error) {
      console.error('❌ [requestAPI.getFolderStructure] API error:', error);
      console.error('❌ [requestAPI.getFolderStructure] Error response:', error.response?.data);
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
      // First, get all notes in this folder and its subfolders to delete their summaries
      const getAllNotesInFolder = async (folderId) => {
        const notes = []
        
        // Get notes directly in this folder
        try {
          const folderNotes = await requestAPI.getUserNotes(user, folderId)
          if (folderNotes.notes) {
            notes.push(...folderNotes.notes)
          }
        } catch (error) {
          console.log('⚠️ [deleteFolder] Could not get notes for folder:', folderId, error)
        }
        
        // Get folder structure to find subfolders
        try {
          const folderStructure = await requestAPI.getFolderStructure(user, folderId)
          if (folderStructure.folders) {
            // Recursively get notes from all subfolders
            for (const subfolder of folderStructure.folders) {
              const subfolderNotes = await getAllNotesInFolder(subfolder._id)
              notes.push(...subfolderNotes)
            }
          }
        } catch (error) {
          console.log('⚠️ [deleteFolder] Could not get subfolders for folder:', folderId, error)
        }
        
        return notes
      }
      
      // Get all notes that will be deleted
      const notesToDelete = await getAllNotesInFolder(folderId)
      console.log('🔍 [deleteFolder] Found', notesToDelete.length, 'notes to delete summaries for')
      
      // Delete summaries for all notes
      for (const note of notesToDelete) {
        try {
          await api.post('/Request/deleteSummary', {
            user,
            itemId: note._id
          })
          console.log('✅ [deleteFolder] Summary deleted for note:', note._id)
        } catch (summaryError) {
          console.log('⚠️ [deleteFolder] Could not delete summary for note:', note._id, summaryError)
        }
      }
      
      // Now delete the folder (which will delete all notes and subfolders)
      const response = await api.post('/Request/deleteFolder', {
        folderId,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  moveFolder: async (folderId, newParentId) => {
    console.log('🚀 [requestAPI.moveFolder] Starting moveFolder API call');
    console.log('🔍 [requestAPI.moveFolder] Raw parameters:', { 
      folderId: folderId, 
      newParentId: newParentId, 
      folderIdType: typeof folderId,
      newParentIdType: typeof newParentId,
      user: localStorage.getItem('user') 
    });
    
    // Extract ID if parameter is an object
    const resolvedFolderId = folderId && typeof folderId === 'object' ? folderId._id || folderId.id : folderId;
    const resolvedNewParentId = newParentId && typeof newParentId === 'object' ? newParentId._id || newParentId.id : newParentId;
    
    console.log('🔍 [requestAPI.moveFolder] Resolved IDs:', { 
      resolvedFolderId, 
      resolvedNewParentId,
      originalFolderId: folderId,
      originalNewParentId: newParentId
    });
    
    // Validate parameters - strict checks
    if (resolvedFolderId === undefined || resolvedFolderId === null || resolvedFolderId === '') {
      console.error('❌ [requestAPI.moveFolder] folderId is invalid:', resolvedFolderId, typeof resolvedFolderId);
      throw new Error(`folderId is required (received: ${resolvedFolderId}, type: ${typeof resolvedFolderId})`)
    }
    if (resolvedNewParentId === undefined || resolvedNewParentId === null || resolvedNewParentId === '') {
      console.error('❌ [requestAPI.moveFolder] newParentId is invalid:', resolvedNewParentId, typeof resolvedNewParentId);
      throw new Error(`newParentId is required (received: ${resolvedNewParentId}, type: ${typeof resolvedNewParentId})`)
    }
    
    // Ensure they are strings (not objects)
    const folderIdStr = String(resolvedFolderId).trim();
    const newParentIdStr = String(resolvedNewParentId).trim();
    
    if (!folderIdStr || !newParentIdStr) {
      throw new Error('folderId and newParentId must be non-empty strings')
    }
    
    try {
      // Note: backend moveFolder doesn't use 'user' parameter - it validates ownership by checking folder owners match
      // Use the string versions to ensure we're not sending undefined
      const requestPayload = {
        folderId: folderIdStr,
        newParentId: newParentIdStr
      };
      console.log('🔍 [requestAPI.moveFolder] Request payload:', JSON.stringify(requestPayload, null, 2));
      console.log('🔍 [requestAPI.moveFolder] Request payload keys:', Object.keys(requestPayload));
      console.log('🔍 [requestAPI.moveFolder] Request payload values:', Object.values(requestPayload));
      
      const response = await api.post('/Folder/moveFolder', requestPayload);
      console.log('🔍 [requestAPI.moveFolder] After API call - checking what was sent');
      console.log('✅ [requestAPI.moveFolder] Full response:', response);
      console.log('✅ [requestAPI.moveFolder] Response data:', response.data);
      console.log('✅ [requestAPI.moveFolder] Response status:', response.status);
      
      if (response.data?.error) {
        throw new Error(response.data.error)
      }
      
      return response.data
    } catch (error) {
      console.error('❌ [requestAPI.moveFolder] API error:', error);
      console.error('❌ [requestAPI.moveFolder] Error response:', error.response?.data);
      throw error.response?.data || error
    }
  },

  // Note management
  createNote: async (user, content, folder, title) => {
    try {
      const response = await api.post('/Notes/createNote', {
        user,
        content,
        folder,
        title,
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

  updateContent: async (noteId, content, user) => {
    try {
      const response = await api.post('/Notes/updateContent', {
        noteId,
        newContent: content,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  setTitle: async (noteId, title, user) => {
    try {
      const response = await api.post('/Notes/setTitle', {
        noteId,
        newTitle: title,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteNote: async (noteId, user) => {
    try {
      // Delete the note
      const response = await api.post('/Notes/deleteNote', {
        noteId,
        user
      })
      
      // Also delete any associated summary
      try {
        await api.post('/Summaries/deleteSummary', {
          user,
          itemId: noteId
        })
        console.log('✅ [deleteNote] Summary deleted for note:', noteId)
      } catch (summaryError) {
        // Don't fail the note deletion if summary deletion fails
        console.log('⚠️ [deleteNote] Could not delete summary for note:', noteId, summaryError)
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Move note to folder
  moveNote: async (noteId, folderId, user) => {
    try {
      const response = await api.post('/Request/moveNote', {
        noteId,
        folderId,
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Tag management
  tagItem: async (user, itemId, tagLabel) => {
    try {
      const response = await api.post('/Tags/addTag', {
        user,
        item: itemId,
        label: tagLabel
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  untagItem: async (user, itemId, tagIdentifier) => {
    try {
      const response = await api.post('/Tags/removeTagFromItem', {
        user,
        item: itemId,
        tag: tagIdentifier  // This can be either a tag ID or tag label
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getItemTags: async (user, itemId) => {
    try {
      const response = await api.post('/Tags/_getTagsForItem', {
        user,
        item: itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getItemTagsWithIds: async (user, itemId) => {
    try {
      const response = await api.post('/Tags/_getTagsForItem', {
        user,
        item: itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getUserTags: async (user) => {
    try {
      const response = await api.post('/Request/getUserTags', {
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Summary management
  setSummary: async (user, itemId, summary) => {
    try {
      const response = await api.post('/Summaries/setSummary', {
        item: itemId,
        summary
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getSummary: async (user, itemId) => {
    try {
      const response = await api.post('/Summaries/getSummary', {
        item:itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteSummary: async (user, itemId) => {
    try {
      const response = await api.post('/Summaries/deleteSummary', {item:itemId})
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getUserSummaries: async (user) => {
    try {
      const response = await api.post('/Notes/getNotesByUser', {
        user
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Generate summary with AI
  generateSummary: async (user, noteId) => {
    try {
      console.log('🔍 [generateSummary] Generating summary for note:', noteId)
      
      // Ensure noteId is a string
      const noteIdString = typeof noteId === 'string' ? noteId : noteId?._id || noteId?.toString()
      
      if (!noteIdString) {
        throw new Error('Invalid noteId provided')
      }
      
      const noteDetailsResponse = await api.post('/Notes/getNoteDetails', {
        user: user,
        noteId: noteIdString
      })
      
      const noteDetails = noteDetailsResponse.data
      
      if (noteDetails.error) {
        throw new Error(noteDetails.error)
      }

      console.log('🔍 [generateSummary] Note details:', noteDetails)

      // Extract content from note details - response should be NoteStructure with content directly
      const noteContent = noteDetails.content
      
      if (!noteContent) {
        throw new Error('Note content not found in response')
      }

      const summaryResult = await api.post('/Summaries/setSummaryWithAI', {
        text: noteContent,
        item: noteIdString
      })
      return summaryResult.data
    } catch (error) {
      console.error('❌ [generateSummary] Error:', error)
      throw error.response?.data || error
    }
  }
}