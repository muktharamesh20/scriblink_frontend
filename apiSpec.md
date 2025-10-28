
# API Specification: Folder Concept

**Purpose:** Organize items hierarchically

---

## API Endpoints

### POST /api/Folder/initializeFolder

**Description:** Creates the initial root folder for a user.

**Requirements:**
- The user `u` has created no other folders.

**Effects:**
- Creates a root folder to nest elements and folders inside of that the user owns.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{
  "folder": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/createFolder

**Description:** Creates a new folder as a child of an existing parent folder.

**Requirements:**
- `parent` exists and has owner `u`.

**Effects:**
- Creates a folder with title `title` that is a child of the folder `parent`.

**Request Body:**
```json
{
  "user": "string",
  "title": "string",
  "parent": "string"
}
```

**Success Response Body (Action):**
```json
{
  "folder": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/moveFolder

**Description:** Moves a folder (`f1`) into another folder (`f2`).

**Requirements:**
- `f2` is not hierarchically a descendant of `f1`.
- Both folders must have the same owner.

**Effects:**
- If `f1` is already in a folder, remove it from that folder and move it into `f2`.
- If `f1` is a new folder, just add it to `f2`.

**Request Body:**
```json
{
  "folder": "string",
  "newParent": "string"
}
```

**Success Response Body (Action):**
```json
{
  "folder": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/deleteFolder

**Description:** Deletes a folder and everything contained inside of it from the folder hierarchy.

**Requirements:**
- true (The folder `f` is expected to exist for deletion to proceed successfully).

**Effects:**
- Deletes `f` and everything contained inside of `f` from the folder hierarchy.

**Request Body:**
```json
{
  "f": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/insertItem

**Description:** Inserts an item into a folder.

**Requirements:**
- true

**Effects:**
- If `i` is already in a folder, remove it from that folder and insert it into `f`.
- Otherwise, simply insert it into `f`.

**Request Body:**
```json
{
  "item": "string",
  "folder": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/deleteItem

**Description:** Removes the item from whichever folder it is currently located in.

**Requirements:**
- The item exists.

**Effects:**
- Removes the item from whichever folder it is currently located in.

**Request Body:**
```json
{
  "item": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/_getFolderChildren

**Description:** Retrieves all child folders of a given folder.

**Requirements:**
- The folder `folderId` must exist.

**Effects:**
- Returns an array of Folder IDs directly contained within the specified folder.

**Request Body:**
```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/_getFolderItems

**Description:** Retrieves all items contained directly within a given folder.

**Requirements:**
- The folder `folderId` must exist.

**Effects:**
- Returns an array of Item IDs directly contained within the specified folder.

**Request Body:**
```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Folder/_getFolderDetails

**Description:** Retrieves all stored details for a given folder.

**Requirements:**
- The folder `folderId` must exist.

**Effects:**
- Returns a detailed FolderStructure object for the specified folder.

**Request Body:**
```json
{
  "folderId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "title": "string",
    "owner": "string",
    "folders": [
      "string"
    ],
    "elements": [
      "string"
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

# API Specification: Notes Concept

**Purpose:** records written information

---

## API Endpoints

### POST /api/Notes/createNote

**Description:** Creates a new note for a user, with an optional title.

**Requirements:**
- true

**Effects:**
- Creates a new note. If `t` is specified, the title is `t`. Otherwise, the title is "Untitled". `date_created` and `last_modified` is set to the current time. The owner is `u`.

**Request Body:**
```json
{
  "title": "string (optional)",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{
  "note": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Notes/deleteNote

**Description:** Deletes a specified note if the requesting user is its owner.

**Requirements:**
- note exists (and the requesting user must be its owner, inferred from code implementation for a valid deletion)

**Effects:**
- deletes the notes

**Request Body:**
```json
{
  "noteId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Notes/setTitle

**Description:** Renames the title of a specified note if the requesting user is its owner.

**Requirements:**
- true (and the note must exist, and the requesting user must be its owner, inferred from code implementation)

**Effects:**
- Renames the title of note `n` with as `t`

**Request Body:**
```json
{
  "newTitle": "string",
  "noteId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Notes/updateContent

**Description:** Replaces the content of a specified note and updates its last modified timestamp, if the requesting user is its owner.

**Requirements:**
- true (and the note must exist, and the requesting user must be its owner, inferred from code implementation)

**Effects:**
- Replaces the content associated with `n` with `t`. Also updates `last_modified` to the current time.

**Request Body:**
```json
{
  "newContent": "string",
  "noteId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Notes/getNoteDetails

**Description:** Retrieves all stored details for a given note ID, verifying user ownership.

**Requirements:**
- Note with the given ID (`noteId`) must exist.
- The `user` provided must be the owner of the note.

**Effects:**
- Returns the full details of the requested note if the requirements are met.

**Request Body:**
```json
{
  "noteId": "string",
  "user": "string"
}
```

**Success Response Body (Action):**
```json
{
  "_id": "string",
  "title": "string",
  "content": "string",
  "owner": "string",
  "date_created": "string (ISO 8601)",
  "last_modified": "string (ISO 8601)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Notes/getNotesByUser

**Description:** Retrieves all notes owned by a specific user.

**Requirements:**
- true

**Effects:**
- Returns an array of `NoteStructure` objects owned by the specified `ownerId`.

**Request Body:**
```json
{
  "ownerId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "title": "string",
    "content": "string",
    "owner": "string",
    "date_created": "string (ISO 8601)",
    "last_modified": "string (ISO 8601)"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: PasswordAuth Concept

**Purpose:** Limit access to known users

---

## API Endpoints

### POST /api/PasswordAuth/register

**Description:** Registers a new user, creating a user identifier with the provided username and password.

**Requirements:**
- The username does not exist.
- Password is not whitespace or empty.

**Effects:**
- Create a new user with this username and password and returns the user.

**Request Body:**
```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**
```json
{
  "user": "String"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PasswordAuth/authenticate

**Description:** Authenticates a user by verifying the provided username and password against registered credentials.

**Requirements:**
- The username and password (when hashed) combination exists in the set of users.

**Effects:**
- Returns the user.

**Request Body:**
```json
{
  "username": "String",
  "password": "String"
}
```

**Success Response Body (Action):**
```json
{
  "user": "String"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---


# API Specification: Summaries Concept

**Purpose:** highlights the most important part of Item

---

## API Endpoints

### POST /api/Summaries/setSummary

**Description:** Sets or updates a summary for a given item manually.

**Requirements:**
- (Implicit: always allowed as no explicit `requires` in specification)

**Effects:**
- If `item` already exists, change the summary associated with `item` to `summary`.
- If `item` does not exist in Summaries, create a new summary for `item` with a summary `summary`.

**Request Body:**
```json
{
  "summary": "string",
  "item": "string"
}
```

**Success Response Body (Action):**
```json
{
  "item": "string",
  "summary": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Summaries/setSummaryWithAI

**Description:** Generates a summary for an item using an LLM and associates it with the item.

**Requirements:**
- text is nonempty

**Effects:**
- creates a summary of `text` with an LLM and associates it with the item

**Request Body:**
```json
{
  "text": "string",
  "item": "string"
}
```

**Success Response Body (Action):**
```json
{
  "item": "string",
  "summary": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Summaries/deleteSummary

**Description:** Deletes the summary associated with a specific item.

**Requirements:**
- item has a summary associated with it

**Effects:**
- deletes the summary associated with the item

**Request Body:**
```json
{
  "item": "string"
}
```

**Success Response Body (Action):**
```json
{
  "item": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: Tags Concept

**Purpose:** Flags items for later

---

## API Endpoints

### POST /api/Tags/addTag

**Description:** Creates a new tag and associates an item with it for a given user.

**Requirements:**
- There does not already exist a tag associated with that label and item.
- The label must not be empty or only whitespace.

**Effects:**
- Creates a tag with that label and item.

**Request Body:**
```json
{
  "user": "string",
  "label": "string",
  "item": "string"
}
```

**Success Response Body (Action):**
```json
{
  "t": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Tags/removeTagFromItem

**Description:** Removes a specific item's association from a tag.

**Requirements:**
- The tag `t` must be associated with item `i`.

**Effects:**
- Removes the tag from the item.

**Request Body:**
```json
{
  "t": "string",
  "i": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Tags/_getItemsByTag

**Description:** Retrieves all items associated with a given tag ID.

**Requirements:**
- The tag specified by `tagId` must exist.

**Effects:**
- Returns an array of `Item` IDs associated with the tag.

**Request Body:**
```json
{
  "tagId": "string"
}
```

**Success Response Body (Query):**
```json
[
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Tags/_getTagsForItem

**Description:** Retrieves all tags for a specific user that are associated with a given item ID.

**Requirements:**
- `user` and `item` must be valid IDs.

**Effects:**
- Returns an array of objects containing tag ID and label for the `item` belonging to the `user`.

**Request Body:**
```json
{
  "user": "string",
  "item": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "tagId": "string",
    "label": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Tags/_getTagDetails

**Description:** Retrieves all stored details for a given tag ID.

**Requirements:**
- The tag specified by `tagId` must exist.

**Effects:**
- Returns the `TagStructure` object for the specified tag.

**Request Body:**
```json
{
  "tagId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "owner": "string",
    "label": "string",
    "items": [
      "string"
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Tags/_getAllUserTags

**Description:** Retrieves all tags owned by a specific user.

**Requirements:**
- `user` must be a valid ID.

**Effects:**
- Returns an array of all `TagStructure` objects owned by the `user`.

**Request Body:**
```json
{
  "user": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "_id": "string",
    "owner": "string",
    "label": "string",
    "items": [
      "string"
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

# API Specification: Request Concept

**Purpose:** To orchestrate complex operations across multiple concepts

**Principle:** Provides high-level operations that coordinate between authentication, folder management, note creation, tagging, and summarization concepts.

---

## API Endpoints

### POST /api/Request/registerUser

**Description:** Registers a new user and automatically creates their root folder.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a new user account and initializes their folder structure

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string",
  "rootFolder": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/loginUser

**Description:** Authenticates a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Authenticates a user and returns their ID.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/createNote

**Description:** Creates a new note with optional folder placement, tagging, and summarization.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a note, places it in the specified folder, applies tags, and optionally generates a summary

**Request Body:**
```json
{
  "user": "string",
  "title": "string (optional)",
  "content": "string",
  "folderId": "string",
  "tags": "string[] (optional)",
  "generateSummary": "boolean (optional)"
}
```

**Success Response Body (Action):**
```json
{
  "note": "string",
  "folder": "string",
  "tags": "string[] (optional)",
  "summary": "string (optional)"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/updateNote

**Description:** Updates an existing note with new content, folder placement, tags, and summary.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Updates note content, moves to new folder if specified, updates tags, and optionally regenerates summary

**Request Body:**
```json
{
  "user": "string",
  "noteId": "string",
  "title": "string (optional)",
  "content": "string (optional)",
  "folderId": "string (optional)",
  "tags": "string[] (optional)",
  "generateSummary": "boolean (optional)"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/createFolder

**Description:** Creates a new folder for a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates a new folder as a child of the specified parent folder

**Request Body:**
```json
{
  "user": "string",
  "title": "string",
  "parentFolderId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "folder": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/tagItem

**Description:** Tags an item with a specific label.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Associates the item with the specified tag

**Request Body:**
```json
{
  "user": "string",
  "itemId": "string",
  "tagLabel": "string"
}
```

**Success Response Body (Action):**
```json
{
  "tag": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/untagItem

**Description:** Removes a tag from an item.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Removes the association between the item and tag

**Request Body:**
```json
{
  "_user": "string",
  "itemId": "string",
  "tagId": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/generateSummary

**Description:** Generates a summary for a note.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Creates or updates a summary for the note using AI

**Request Body:**
```json
{
  "user": "string",
  "noteId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "summary": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
### POST /api/Request/getItemTags

**Description:** Gets all tags for a specific item.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Returns an array of tag objects containing tagId and label for the specified item belonging to the user
- Uses the same format as `tags._getTagsForItem`

**Request Body:**
```json
{
  "user": "string",
  "itemId": "string"
}
```

**Success Response Body (Action):**
```json
[
  {
    "tagId": "string",
    "label": "string"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```


---

### POST /api/Request/getUserNotes

**Description:** Gets all notes for a user with optional filtering.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Returns an array of notes with their details, optionally filtered.

**Request Body:**
```json
{
  "user": "string",
  "folderId": "string (optional)",
  "tagLabel": "string (optional)"
}
```

**Success Response Body (Action):**
```json
{
  "notes": [
    {
      "_id": "string",
      "owner": "string",
      "title": "string",
      "content": "string"
      /* Note: Additional aggregated fields like 'folderId', 'tags', 'summary'
         might be included depending on the internal aggregation logic. */
    }
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Request/getFolderStructure

**Description:** Gets the folder structure for a user.

**Requirements:**
- Not explicitly specified in the concept specification for this action.

**Effects:**
- Returns the folder structure and associated items for the user.

**Request Body:**
```json
{
  "user": "string",
  "folderId": "string (optional)"
}
```

**Success Response Body (Action):**
```json
{
  "folders": [
    {
      "_id": "string",
      "title": "string",
      "owner": "string",
      "parent": "string | null",
      "elements": "string[]" /* IDs of items (e.g., notes or sub-folders) directly within this folder */
    }
  ],
  "items": [
    "string" /* A simplified representation of items, usually their IDs */
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---