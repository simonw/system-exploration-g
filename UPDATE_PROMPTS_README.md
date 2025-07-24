# Update Prompts Script

This script automatically updates the `src/prompts-content.ts` file with the latest content from the markdown files.

## Usage

```bash
bash update-prompts.sh
```

## What it does

1. **Reads** `src/system_prompt.md` and `src/tools.md`
2. **Escapes** the content properly for JavaScript string literals using `jq`
3. **Generates** `src/prompts-content.ts` with the content as exported constants
4. **Reports** file sizes for verification

## Files involved

- **Input files:**
  - `src/system_prompt.md` - The complete Spark system prompt
  - `src/tools.md` - Available tools documentation
  
- **Output file:**
  - `src/prompts-content.ts` - Generated TypeScript constants file

## Example output

```typescript
// This file is auto-generated. Do not edit manually.
// Generated from system_prompt.md and tools.md

export const SYSTEM_PROMPT_CONTENT = "# Spark: Beautiful & Functional Applications Guide...";

export const TOOLS_CONTENT = "## Tools Available...";
```

## Requirements

- `jq` command (for JSON escaping)
- `bash` shell
- Source files must exist in `src/` directory

## Notes

- The script uses `jq` to properly escape special characters, quotes, and newlines
- The generated file is marked as auto-generated and should not be edited manually
- Run this script whenever you update the markdown source files