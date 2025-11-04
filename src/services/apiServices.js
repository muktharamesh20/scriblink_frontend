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

  getFolderStructure: async (user, folderId = undefined) => {
    return requestAPI.getFolderStructure(user, folderId)
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

  // Folder management
  getFolderStructure: async (user, folderId = undefined) => {
    // console.log('🚀 [requestAPI.getFolderStructure] Starting getFolderStructure API call');
    // console.log('🔍 [requestAPI.getFolderStructure] Parameters:', { user, folderId });
    
    try {
      const requestPayload = { user, folderId };
      // console.log('🔍 [requestAPI.getFolderStructure] Request payload:', requestPayload);
      
      const response = await api.post('/Folder/getFolderStructure', requestPayload);
      // console.log('✅ [requestAPI.getFolderStructure] API response received:', response.data);
      return response.data
    } catch (error) {
      console.error('❌ [requestAPI.getFolderStructure] API error:', error);
      console.error('❌ [requestAPI.getFolderStructure] Error response:', error.response?.data);
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
    try {
      // Ensure folderId is a string - handle various input formats
      // console.log('🔍 [deleteFolder] Input folderId:', folderId, 'type:', typeof folderId)
      
      let folderIdStr
      if (typeof folderId === 'string') {
        folderIdStr = folderId
      } else if (folderId && typeof folderId === 'object') {
        // If it's an object, try to extract _id or id
        folderIdStr = folderId._id || folderId.id
        if (folderIdStr && typeof folderIdStr !== 'string') {
          // If _id/id is still not a string, convert it
          folderIdStr = String(folderIdStr)
        }
      } else {
        folderIdStr = String(folderId)
      }
      
      if (!folderIdStr || folderIdStr === 'undefined' || folderIdStr === 'null' || folderIdStr === '[object Object]') {
        console.error('❌ [deleteFolder] Invalid folderId:', folderId, 'converted to:', folderIdStr)
        throw new Error(`Invalid folderId: ${folderId}`)
      }
      
      // console.log('🚀 [deleteFolder] Starting deleteFolder for folder:', folderIdStr, 'type:', typeof folderIdStr)
      
      // Step 1: Collect all descendant folder IDs recursively
      const collectDescendantFolders = async (folderIdToProcess, folderIdsSet = new Set()) => {
        try {
          const folderDetails = await api.post('/Folder/_getFolderDetails', { folderId: folderIdToProcess })
          if (folderDetails.data?.error) {
            console.warn('⚠️ [deleteFolder] Could not get folder details:', folderIdToProcess, folderDetails.data.error)
            return folderIdsSet
          }
          
          const folder = folderDetails.data
          folderIdsSet.add(folderIdToProcess)
          
          // Recursively collect child folders
          if (folder.folders && Array.isArray(folder.folders)) {
            for (const childFolderId of folder.folders) {
              await collectDescendantFolders(childFolderId, folderIdsSet)
            }
          }
          
          return folderIdsSet
        } catch (error) {
          console.warn('⚠️ [deleteFolder] Error collecting descendants for folder:', folderIdToProcess, error)
          return folderIdsSet
        }
      }
      
      // Collect all folders that will be deleted (including the root folder)
      const allFolderIds = await collectDescendantFolders(folderIdStr)
      
      // Step 2: Get all notes from all folders
      const allNotes = []
      for (const folderIdToCheck of allFolderIds) {
        try {
          const folderDetails = await api.post('/Folder/_getFolderDetails', { folderId: folderIdToCheck })
          
          const folder = folderDetails.data
          if (folder.elements && Array.isArray(folder.elements)) {
            allNotes.push(...folder.elements)
          }
        } catch (error) {
          console.warn('⚠️ [deleteFolder] Error getting notes from folder:', folderIdToCheck, error)
        }
      }

      
      // Step 3: Delete summaries for all notes
      for (const noteId of allNotes) {
        try {
          await api.post('/Summaries/deleteSummary', { item: noteId })
        } catch (summaryError) {
          console.warn('⚠️ [deleteFolder] Could not delete summary for note:', noteId, summaryError)
        }
      }
      
      // Step 4: Delete all notes
      for (const noteId of allNotes) {
        try {
          await api.post('/Notes/deleteNote', {
            noteId,
            user
          })
        } catch (noteError) {
          console.warn('⚠️ [deleteFolder] Could not delete note:', noteId, noteError)
        }
      }
      
      // Step 5: Delete the folder (this will delete the folder and all its subfolders)
      // Backend expects { f: Folder } where f is the folder ID string
      const deleteFolderPayload = {
        f: folderIdStr
      }
      
      const response = await api.post('/Folder/deleteFolder', deleteFolderPayload)

      
      if (response.data?.error) {
        console.error('❌ [deleteFolder] Backend returned error:', response.data.error)
        throw new Error(response.data.error)
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
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

  // Note management
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
      // 1. Get all notes for the user
      const notesResult = await api.post('/Notes/getNotesByUser', {
        ownerId: user
      });
      
      if (notesResult.data?.error) {
        throw new Error(notesResult.data.error);
      }
      
      // Backend returns array directly, but validate it's an array
      let notes = Array.isArray(notesResult.data) ? notesResult.data : [];

      // 2. Get all folders for this user to determine folderId mapping
      // Try getAllFolders first, fallback to getFolderStructure if it fails
      let allFolders = [];
      try {
        const allFoldersResult = await api.post('/Folder/getAllFolders', { user });
        
        if (allFoldersResult.data?.error) {
          throw new Error(allFoldersResult.data.error);
        }
        
        allFolders = Array.isArray(allFoldersResult.data) ? allFoldersResult.data : [];
      } catch (error) {
        console.warn('⚠️ [getUserNotes] getAllFolders failed, trying getFolderStructure:', error.message);
        // Fallback: use getFolderStructure to get all folders
        try {
          const folderStructureResult = await api.post('/Request/getFolderStructure', { user });
          if (folderStructureResult.data?.error) {
            console.warn('⚠️ [getUserNotes] getFolderStructure also failed:', folderStructureResult.data.error);
            allFolders = [];
          } else {
            // getFolderStructure returns { folders: [], items: [] }
            allFolders = Array.isArray(folderStructureResult.data?.folders) 
              ? folderStructureResult.data.folders 
              : [];
          }
        } catch (fallbackError) {
          console.warn('⚠️ [getUserNotes] Both folder endpoints failed, continuing with empty folders:', fallbackError.message);
          allFolders = [];
        }
      }

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
        const tagResult = await api.post('/Tags/_getAllUserTags', { user });
        if (tagResult.data?.error) {
          throw new Error(`Failed to get tags: ${tagResult.data.error}`);
        }
        const tagWithLabel = (tagResult.data || []).find((tag) => tag.label === tagLabel);

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
        // console.log('✅ [deleteNote] Summary deleted for note:', noteId)
      } catch (summaryError) {
        // Don't fail the note deletion if summary deletion fails
        // console.log('⚠️ [deleteNote] Could not delete summary for note:', noteId, summaryError)
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Move note to folder
  moveNote: async (noteId, folderId, user) => {
    try {
      const response = await api.post('/Folder/insertItem', {
        item: noteId,
        folder:folderId,
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
      const response = await api.post('/Tags/_getAllUserTags', {
        user
      })
      return { tags: response.data.map((tag) => tag.label) }
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
      // console.log('🔍 [generateSummary] Generating summary for note:', noteId)
      
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

      // console.log('🔍 [generateSummary] Note details:', noteDetails)

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