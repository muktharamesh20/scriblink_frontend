# API Migration Notes

This document summarizes the changes made to migrate from the Request API concept to direct concept APIs, and identifies gaps that need backend implementation.

## Changes Made

### 1. API Services (`src/services/apiServices.js`)
- **Removed**: All `/Request/*` endpoint calls
- **Added**: Direct concept API calls:
  - `/api/PasswordAuth/register` and `/api/PasswordAuth/authenticate`
  - `/api/Notes/*` endpoints
  - `/api/Folder/*` endpoints  
  - `/api/Tags/*` endpoints
  - `/api/Summaries/*` endpoints

### 2. API Request Interceptor (`src/services/api.js`)
- **Updated**: Only adds `user` to request body when:
  - It's a POST request
  - User is not already in the request data (explicitly provided)
  - Endpoint is not PasswordAuth (which uses username/password)

### 3. Component Updates
- Updated `FolderView.vue` to use `requestAPI` consistently
- All other components already use `requestAPI`, so no changes needed

## API Mapping

### Authentication
- `requestAPI.registerUser()` → `/api/PasswordAuth/register` + `/api/Folder/initializeFolder`
- `requestAPI.loginUser()` → `/api/PasswordAuth/authenticate` + attempt to get/initialize root folder

### Notes
- `requestAPI.createNote()` → `/api/Notes/createNote` + `/api/Notes/updateContent` + `/api/Folder/insertItem`
- `requestAPI.getUserNotes()` → `/api/Notes/getNotesByUser` OR `/api/Folder/_getFolderItems` + `/api/Notes/getNoteDetails`
- `requestAPI.updateNote()` → `/api/Notes/setTitle` and/or `/api/Notes/updateContent`
- `requestAPI.deleteNote()` → `/api/Folder/deleteItem` + `/api/Summaries/deleteSummary` + `/api/Notes/deleteNote`

### Folders
- `requestAPI.createFolder()` → `/api/Folder/createFolder`
- `requestAPI.getFolderStructure()` → `/api/Folder/_getFolderDetails` (recursively)
- `requestAPI.deleteFolder()` → `/api/Folder/deleteFolder`
- `requestAPI.moveFolder()` → `/api/Folder/moveFolder`
- `requestAPI.moveNote()` → `/api/Folder/insertItem`

### Tags
- `requestAPI.tagItem()` → `/api/Tags/addTag`
- `requestAPI.untagItem()` → `/api/Tags/_getTagsForItem` + `/api/Tags/removeTagFromItem`
- `requestAPI.getItemTags()` → `/api/Tags/_getTagsForItem`
- `requestAPI.getUserTags()` → `/api/Tags/_getAllUserTags`

### Summaries
- `requestAPI.setSummary()` → `/api/Summaries/setSummary`
- `requestAPI.generateSummary()` → `/api/Notes/getNoteDetails` + `/api/Summaries/setSummaryWithAI`
- `requestAPI.deleteSummary()` → `/api/Summaries/deleteSummary`

## Backend Requirements (Gaps in API Spec)

### 1. Summary Retrieval
**Issue**: The API spec does not provide a way to retrieve existing summaries.

**Missing Endpoints**:
- `POST /api/Summaries/getSummary` - Returns summary for a given item
  - Request: `{ "item": "string" }`
  - Response: `{ "item": "string", "summary": "string" }` or error if not found
- `POST /api/Summaries/getUserSummaries` - Returns all summaries for a user's items
  - Request: `{ "user": "string" }`
  - Response: `[{ "item": "string", "summary": "string" }]`

**Current Workaround**: Frontend returns empty summary `{ summary: '' }` and components show "No summary yet" message gracefully.

### 2. Root Folder Retrieval
**Issue**: After login/registration, there's no straightforward way to get the root folder ID if it already exists.

**Potential Solutions**:
- Option A: `/api/Folder/initializeFolder` could return existing root folder ID if user already has one
- Option B: Add `POST /api/Folder/getRootFolder` endpoint
  - Request: `{ "user": "string" }`
  - Response: `{ "folder": "string" }`

**Current Workaround**: Frontend tries to initialize folder on login, which fails if folder exists. We rely on localStorage to store root folder ID after successful initialization.

### 3. Note-Folder Relationship
**Issue**: The API doesn't provide a direct way to get which folder a note belongs to.

**Potential Solutions**:
- Include `folderId` in note details response from `/api/Notes/getNoteDetails`
- Add a query endpoint to find which folder contains an item

**Current Workaround**: Frontend stores `folderId` in note objects when fetching notes by folder, but this is client-side only.

## Request/Response Format Changes

### Notes
- `createNote`: Request now uses `title` (optional) and `user` only. Content is set separately via `updateContent`.
- `getNoteDetails`: Returns full note object with `_id`, `title`, `content`, `owner`, `date_created`, `last_modified`

### Folders
- `deleteFolder`: Request uses `{ "f": "folderId" }` instead of `{ "folderId": "...", "user": "..." }`
- `moveFolder`: Request uses `{ "folder": "...", "newParent": "..." }` (no user field)
- `insertItem`: Request uses `{ "item": "...", "folder": "..." }` (no user field)

### Tags
- `addTag`: Response returns `{ "t": "tagId" }` instead of `{ "tag": "tagId" }`
- `removeTagFromItem`: Request uses `{ "t": "tagId", "i": "itemId" }` instead of labels

### Summaries
- `setSummary`: Request uses `{ "item": "...", "summary": "..." }` (no user field)
- `setSummaryWithAI`: Request uses `{ "item": "...", "text": "..." }` (no user field)
- `deleteSummary`: Request uses `{ "item": "..." }` (no user field)

## Testing Checklist

- [ ] User registration creates root folder
- [ ] User login retrieves/initializes root folder
- [ ] Create note in folder works
- [ ] Update note title and content works
- [ ] Delete note removes from folder and deletes summary
- [ ] Create folder works
- [ ] Delete folder cascades to notes
- [ ] Move folder works
- [ ] Move note between folders works
- [ ] Get folder structure shows all folders hierarchically
- [ ] Get notes by folder works
- [ ] Get all user notes works
- [ ] Add tag to note works
- [ ] Remove tag from note works
- [ ] Get tags for note works
- [ ] Get all user tags works
- [ ] Set summary manually works
- [ ] Generate summary with AI works
- [ ] Delete summary works
- [ ] Summary retrieval (if backend implements getSummary endpoint)

## Notes

- The frontend gracefully handles missing summary endpoints by showing "No summary yet" state
- Root folder ID is stored in localStorage after successful initialization
- All direct concept API calls are exposed via `requestAPI` for backward compatibility
- The deprecated wrapper APIs (authAPI, notesAPI, etc.) now directly call concept APIs but maintain the same interface for compatibility

