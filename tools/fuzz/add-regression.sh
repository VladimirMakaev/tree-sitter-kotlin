#!/usr/bin/env bash
#
# Add a fuzzer crash file as a regression test to the corpus.
#
# Usage: ./tools/fuzz/add-regression.sh <crash-file.kt> <description>
#
# Parses the crash file with tree-sitter to get the expected tree,
# then appends it to test/corpus/fuzz-regressions.txt.

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <crash-file.kt> <description>"
  echo "Example: $0 tools/fuzz/crashes/nested-comments.kt \"Deeply nested comments\""
  exit 1
fi

CRASH_FILE="$1"
DESCRIPTION="$2"
CORPUS_FILE="test/corpus/fuzz-regressions.txt"
SEPARATOR="================================================================================"
DIVIDER="--------------------------------------------------------------------------------"

if [ ! -f "$CRASH_FILE" ]; then
  echo "Error: Crash file not found: $CRASH_FILE"
  exit 1
fi

# Parse the crash file to get the S-expression tree
TREE_OUTPUT=$(npx tree-sitter parse "$CRASH_FILE" 2>/dev/null) || {
  echo "Warning: tree-sitter parse returned non-zero exit code (may contain errors)"
  TREE_OUTPUT=$(npx tree-sitter parse "$CRASH_FILE" 2>&1) || true
}

if [ -z "$TREE_OUTPUT" ]; then
  echo "Error: tree-sitter parse produced no output"
  exit 1
fi

# Strip position markers like " [0, 0] - [1, 0]" from tree-sitter parse output
# to match the corpus test format
TREE_OUTPUT=$(echo "$TREE_OUTPUT" | sed 's/ \[[0-9]*, [0-9]*\] - \[[0-9]*, [0-9]*\]//g')

INPUT_CONTENT=$(cat "$CRASH_FILE")

# Append the test case (corpus format: separator, title, separator, input, divider, tree)
{
  # Add blank line separator if file already has content
  if [ -f "$CORPUS_FILE" ] && [ -s "$CORPUS_FILE" ]; then
    echo ""
  fi
  echo "$SEPARATOR"
  echo "$DESCRIPTION"
  echo "$SEPARATOR"
  echo ""
  echo "$INPUT_CONTENT"
  echo ""
  echo "$DIVIDER"
  echo ""
  echo "$TREE_OUTPUT"
} >> "$CORPUS_FILE"

echo "Added regression test: $DESCRIPTION"
echo "  Source: $CRASH_FILE"
echo "  Corpus: $CORPUS_FILE"
