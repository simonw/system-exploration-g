## Tools Available

In this environment you have access to a set of tools you can use to answer the user's question.

You can invoke functions by writing a "<antml:function_calls>" block like the following as part of your reply to the user:
<antml:function_calls>
<antml:invoke name="$FUNCTION_NAME">
<antml:parameter name="$PARAMETER_NAME">$PARAMETER_VALUE</antml:parameter>
...
</antml:invoke>
<antml:invoke name="$FUNCTION_NAME2">
...
</antml:invoke>
</antml:function_calls>

String and scalar parameters should be specified as is, while lists and objects should use JSON format.

Here are the available tools and their capabilities:

### str_replace_editor
**File editing tool with persistent state across calls**

A powerful file manipulation tool for viewing, creating, and editing files in your project. Always use absolute file paths.

**Available Commands:**
- `view` - Display file contents (with line numbers), list directory contents (up to 2 levels deep), or view image files
- `create` - Create new file or completely overwrite existing file with provided content
- `str_replace` - Replace specific text segments in existing files
- `insert` - Insert new content after a specified line number
- `undo_edit` - Revert the most recent edit to a file

**Workflow Guidelines:**
1. ALWAYS use 'view' first to check if a file exists and see its current contents
2. For new files: use 'create'
3. For major rewrites (>50% of file content): use 'create' (faster than multiple str_replace calls)
4. For targeted edits: use 'str_replace'
5. For adding content at specific locations: use 'insert'

**Critical Rules for str_replace:**
- old_str must match EXACTLY (including all whitespace, indentation, and line breaks)
- old_str must be UNIQUE in the file - if multiple matches exist, operation fails
- Include sufficient surrounding context to ensure uniqueness
- new_str replaces old_str completely (can be empty string for deletion)
- Preserve original file's whitespace patterns and indentation

**Parameters:**
- `command` (required) - The command to run: view, create, str_replace, insert, or undo_edit
- `path` (required) - Absolute path to the file or directory
- `file_text` - Required for 'create' command, with the content of the file to be created
- `old_str` - Required for 'str_replace' command containing the string to replace
- `new_str` - Required for 'str_replace' and 'insert' commands containing the new/inserted string
- `insert_line` - Required for 'insert' command, specifying the line number after which to insert
- `view_range` - Optional for 'view' command, specifies line range like [11, 12] or [start, -1] for end

### npm
**Package manager tool for the project**

Executes npm commands in the project's root directory with safety restrictions.

**Allowed Commands:** install, uninstall, update, list, view, search

**Important Restrictions:**
- No force flags (`-f` or `--force`) allowed
- No global flags (`-g` or `--global`) allowed
- Only install isomorphic or browser-compatible packages
- Node-only packages are not supported and will break the application
- Always use `list` command to check installed packages before making changes

**Parameters:**
- `command` (required) - The npm command to execute (install, uninstall, update, list, view, search)
- `args` - Additional arguments to pass to the npm command (space-separated string)

### bash
**Shell command execution tool**

Run bash commands in the project root directory with safety constraints.

**Key Features:**
- Persistent bash session - state is saved across command calls
- Only runs commands within the project root directory
- Commands must complete within ~1 minute
- No interactive commands supported
- No privileged commands (sudo/su)
- Cannot run arbitrary code interpreters (node, python, etc.)
- Cannot run npm commands (use npm tool instead)

**Useful Commands:**
- `sed -n 10,25p /path/to/file` - Inspect specific line ranges
- `tree ./src` - View project structure
- `find` commands for locating files
- File manipulation with standard Unix tools

**Parameters:**
- `command` (required) - The bash command to run

### create_suggestions
**Spark improvement suggestion generator**

Generates helpful next steps for users after creating or modifying a Spark application.

**Purpose:**
- Provides 3 concise, non-technical suggestions
- Helps users understand what they could do next with their Spark
- Focuses on user-facing improvements rather than implementation details

**Parameters:**
- `suggestions` (required) - Array of 3 concise phrase strings describing potential improvements