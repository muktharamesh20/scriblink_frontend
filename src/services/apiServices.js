import api from './api.js'
import { authService } from './authService.js'

/**
 * Authentication utility for API calls
 * Handles token updates and authentication error handling
 */
const authHandler = {
  /**
   * Processes API response to update tokens if present
   * @param {Object} response - Axios response object
   */
  handleResponse: (response) => {
    // Check both response.data and response directly (in case response IS the data)
    const responseData = response?.data || response
    
    // If response contains a new accessToken, update it
    if (responseData?.accessToken) {
      const newToken = responseData.accessToken
      const oldToken = localStorage.getItem('accessToken')
      const isNewToken = newToken !== oldToken
      
      console.log('🔄 Updating access token from API response:', {
        hasNewToken: !!newToken,
        tokenLength: newToken?.length,
        isNewToken,
        oldToken: oldToken?.substring(0, 20) + '...',
        newToken: newToken?.substring(0, 20) + '...'
      })
      
      if (isNewToken) {
        authService.setAccessToken(newToken)
        console.log('✅ Token updated in localStorage')
        // Verify it was stored
        const stored = localStorage.getItem('accessToken')
        console.log('🔍 Verification - stored token:', stored?.substring(0, 20) + '...', stored === newToken ? '✅ Match' : '❌ Mismatch')
      } else {
        console.log('⚠️ Token is the same as current token, skipping update')
      }
    } else {
      console.log('⚠️ No accessToken in response:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: responseData ? Object.keys(responseData) : [],
        fullResponse: JSON.stringify(responseData, null, 2).substring(0, 200)
      })
    }
    
    return responseData
  },

  /**
   * Checks if an error is an authentication error
   * @param {Object} error - Error object
   * @returns {boolean} - True if error is authentication-related
   */
  isAuthError: (error) => {
    const errorData = error?.response?.data || error
    const errorMessage = String(errorData?.error || errorData?.message || '').toLowerCase()
    const status = error?.response?.status

    // Check for 401 status
    if (status === 401) {
      return true
    }

    // Check for authentication-related error messages
    // Common patterns: "Invalid", "expired", "token", "authentication", "unauthorized", "access token"
    const authErrorPatterns = [
      'invalid',
      'expired',
      'token',
      'access token',
      'authentication',
      'unauthorized',
      'authenticated user'
    ]

    // Check if error message contains any auth-related keywords
    const hasAuthPattern = authErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    )

    // Also check for specific error message patterns
    const specificPatterns = [
      errorMessage.includes('invalid') && errorMessage.includes('token'),
      errorMessage.includes('expired') && errorMessage.includes('token'),
      errorMessage.includes('invalid') && errorMessage.includes('access'),
      errorMessage.includes('authentication'),
      errorMessage.includes('authenticated user')
    ]

    return hasAuthPattern || specificPatterns.some(pattern => pattern === true)
  },

  /**
   * Handles authentication errors by clearing user data and redirecting to login
   * @param {Object} error - Error object
   * @throws {Object} - Re-throws the error data
   */
  handleAuthError: (error) => {
    console.log('❌ Authentication error detected - redirecting to login')
    authService.removeUser()
    window.location.href = '/login'
    const errorData = error?.response?.data || error
    throw errorData
  },

  /**
   * Wraps an API call with authentication handling
   * @param {Function} apiCall - Async function that returns an axios promise
   * @returns {Promise} - Promise that resolves with response data or rejects with error
   */
  wrap: async (apiCall) => {
    try {
      const response = await apiCall()
      console.log('🔍 authHandler.wrap - response received:', {
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        hasAccessToken: !!response?.data?.accessToken,
        status: response?.status
      })
      
      // Check if response contains an error field (backend may return 200 with { error: ... })
      const responseData = response?.data || response
      if (responseData?.error) {
        // Create an error-like object to check if it's an auth error
        const errorObject = {
          response: {
            data: responseData,
            status: response?.status || 200
          }
        }
        
        if (authHandler.isAuthError(errorObject)) {
          authHandler.handleAuthError(errorObject)
        }
        
        // Throw the error even if not auth-related
        throw responseData
      }
      
      const result = authHandler.handleResponse(response)
      console.log('🔍 authHandler.wrap - after handleResponse:', {
        resultKeys: result ? Object.keys(result) : []
      })
      return result
    } catch (error) {
      if (authHandler.isAuthError(error)) {
        authHandler.handleAuthError(error)
      }
      // Re-throw other errors
      const errorData = error?.response?.data || error
      throw errorData
    }
  }
}

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
  createNote: async (user, content, folder, title, authToken) => {
    return requestAPI.createNote(user, content, folder, title, authToken)
  },

  getUserNotes: async (user, folderId = undefined, tagLabel = null, authToken) => {
    return requestAPI.getUserNotes(user, folderId, tagLabel, authToken)
  },

  updateContent: async (noteId, content, authToken) => {
    return requestAPI.updateContent(noteId, content, localStorage.getItem('user'), authToken)
  },

  setTitle: async (noteId, user, title, authToken) => {
    return requestAPI.setTitle(noteId, title, user, authToken)
  },

  deleteNote: async (noteId, authToken) => {
    return requestAPI.deleteNote(noteId, localStorage.getItem('user'), authToken)
  }
}

// Folder API calls (DEPRECATED - use requestAPI instead)
export const folderAPI = {
  getRootFolder: async (authToken) => {
    return requestAPI.getRootFolderId(localStorage.getItem('user'), authToken)
  },

  getFolderStructure: async (user, folderId = undefined, authToken) => {
    return requestAPI.getFolderStructure(user, folderId, authToken)
  },

  createFolder: async (user, title, parent, authToken) => {
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

  moveFolder: async (folder, newParent, authToken) => {
    return requestAPI.moveFolder(folder, newParent, authToken)
  },

  deleteFolder: async (folderId, user, authToken) => {
    return requestAPI.deleteFolder(folderId, user || localStorage.getItem('user'), authToken)
  },

  moveNote: async (noteId, folderId, user, authToken) => {
    return requestAPI.moveNote(noteId, folderId, user, authToken)
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
  addTag: async (user, itemId, tagLabel, authToken) => {
    return requestAPI.tagItem(user, itemId, tagLabel, authToken)
  },

  removeTag: async (user, itemId, tagLabel, authToken) => {
    return requestAPI.untagItem(user, itemId, tagLabel, authToken)
  },

  getItemTags: async (user, itemId, authToken) => {
    return requestAPI.getItemTags(user, itemId, authToken)
  },

  getUserTags: async (user, authToken) => {
    return requestAPI.getUserTags(user, authToken)
  }
}

// Summaries API calls (DEPRECATED - use requestAPI instead)
export const summariesAPI = {
  // All these methods now route through requestAPI
  setSummary: async (user, itemId, summary, authToken) => {
    return requestAPI.setSummary(user, itemId, summary, authToken)
  },

  getSummary: async (user, itemId, authToken) => {
    return requestAPI.getSummary(user, itemId, authToken)
  },

  deleteSummary: async (user, itemId, authToken) => {
    return requestAPI.deleteSummary(user, itemId, authToken)
  },

  getUserSummaries: async (user, authToken) => {
    return requestAPI.getUserSummaries(user, authToken)
  },

  generateSummary: async (user, noteId, authToken) => {
    return requestAPI.generateSummary(user, noteId, authToken)
  }
}


// Export requestAPI
export const requestAPI = {
  // User management
  registerUser: async (username, password, authToken) => {
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

  loginUser: async (username, password, authToken) => {
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


  getRootFolderId: async (user, authToken) => {
    try {
      const response = await api.post('/Folder/_getRootFolderId', { user })
      return response.data.rootFolder
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Folder management
  getFolderStructure: async (user, folderId = undefined, authToken) => {
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

  createFolder: async (user, title, parentFolderId, authToken) => {
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

  deleteFolder: async (folderId, user, authToken) => {
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

  moveFolder: async (folderId, newParentId, authToken) => {
    // console.log('🚀 [requestAPI.moveFolder] Starting moveFolder API call');
    
    // Extract ID if parameter is an object
    const resolvedFolderId = folderId && typeof folderId === 'object' ? folderId._id || folderId.id : folderId;
    const resolvedNewParentId = newParentId && typeof newParentId === 'object' ? newParentId._id || newParentId.id : newParentId;

    
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
      // console.log('🔍 [requestAPI.moveFolder] Request payload:', JSON.stringify(requestPayload, null, 2));
      // console.log('🔍 [requestAPI.moveFolder] Request payload keys:', Object.keys(requestPayload));
      // console.log('🔍 [requestAPI.moveFolder] Request payload values:', Object.values(requestPayload));
      
      const response = await api.post('/Folder/moveFolder', requestPayload);
      // console.log('🔍 [requestAPI.moveFolder] After API call - checking what was sent');
      // console.log('✅ [requestAPI.moveFolder] Full response:', response);
      // console.log('✅ [requestAPI.moveFolder] Response data:', response.data);
      // console.log('✅ [requestAPI.moveFolder] Response status:', response.status);
      
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
  createNote: async (user, content, folder, title, authToken) => {
    return authHandler.wrap(async () => {
      return await api.post('/Notes/createNote', {
        user,
        content,
        folder,
        title,
        authToken
      })
    })
  },

  getUserNotes: async (user, folderId = undefined, tagLabel = null, authToken) => {
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

  updateContent: async (noteId, content, user, authToken) => {
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

  setTitle: async (noteId, title, user, authToken) => {
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

  deleteNote: async (noteId, user, authToken) => {
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
  moveNote: async (noteId, folderId, user, authToken) => {
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
  tagItem: async (user, itemId, tagLabel, authToken) => {
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

  untagItem: async (user, itemId, tagIdentifier, authToken) => {
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

  getItemTags: async (user, itemId, authToken) => {
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

  getItemTagsWithIds: async (user, itemId, authToken) => {
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

  getUserTags: async (user, authToken) => {
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
  setSummary: async (user, itemId, summary, authToken) => {
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

  getSummary: async (user, itemId, authToken) => {
    try {
      const response = await api.post('/Summaries/getSummary', {
        item:itemId
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  deleteSummary: async (user, itemId, authToken) => {
    try {
      const response = await api.post('/Summaries/deleteSummary', {item:itemId})
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getUserSummaries: async (user, authToken) => {
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
  generateSummary: async (user, noteId, authToken) => {
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