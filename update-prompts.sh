#!/bin/bash

# Script to update prompts-content.ts with content from system_prompt.md and tools.md
# This ensures the content is properly escaped for JavaScript string literals
#
# Usage: bash update-prompts.sh
# 
# This script:
# 1. Reads system_prompt.md and tools.md from src/
# 2. Properly escapes the content for JavaScript strings
# 3. Generates src/prompts-content.ts with the escaped content as constants
# 4. Shows file sizes for verification

set -e

PROJECT_DIR="/workspaces/spark-template"
SOURCE_DIR="$PROJECT_DIR/src"
OUTPUT_FILE="$SOURCE_DIR/prompts-content.ts"
SYSTEM_PROMPT_FILE="$SOURCE_DIR/system_prompt.md"
TOOLS_FILE="$SOURCE_DIR/tools.md"

echo "🔄 Updating prompts-content.ts..."

# Check if source files exist
if [ ! -f "$SYSTEM_PROMPT_FILE" ]; then
    echo "❌ Error: $SYSTEM_PROMPT_FILE not found"
    exit 1
fi

if [ ! -f "$TOOLS_FILE" ]; then
    echo "❌ Error: $TOOLS_FILE not found"
    exit 1
fi

# Function to escape content for JavaScript string literal
escape_for_js() {
    # Use jq to properly escape the content as a JSON string, then remove the surrounding quotes
    cat "$1" | jq -Rs . | sed 's/^"//' | sed 's/"$//'
}

echo "📖 Reading and escaping system_prompt.md..."
SYSTEM_PROMPT_CONTENT=$(escape_for_js "$SYSTEM_PROMPT_FILE")

echo "🔧 Reading and escaping tools.md..."
TOOLS_CONTENT=$(escape_for_js "$TOOLS_FILE")

echo "⚡ Generating prompts-content.ts..."

# Create the output file
cat > "$OUTPUT_FILE" << EOF
// This file is auto-generated. Do not edit manually.
// Generated from system_prompt.md and tools.md

export const SYSTEM_PROMPT_CONTENT = "$SYSTEM_PROMPT_CONTENT";

export const TOOLS_CONTENT = "$TOOLS_CONTENT";
EOF

echo "✅ Successfully updated $OUTPUT_FILE"
echo "📊 System prompt size: $(echo "$SYSTEM_PROMPT_CONTENT" | wc -c) characters"
echo "📊 Tools content size: $(echo "$TOOLS_CONTENT" | wc -c) characters"
echo ""
echo "💡 The prompts-content.ts file now contains the latest content from:"
echo "   - system_prompt.md"
echo "   - tools.md"
echo ""
echo "🚀 You can now use the updated constants in your React app!"