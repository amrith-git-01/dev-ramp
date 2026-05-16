# MCP Servers Test Report

**Date:** 2026-05-16  
**Tested By:** Bob (Plan Mode)  
**Repository:** c:/Users/vishn/Desktop/Programs/dev-ramp

---

## Executive Summary

Both MCP servers (code-analyzer and git-analyzer) are operational and connected. However, **one critical bug was discovered** in the code-analyzer server that prevents the `get_complexity_metrics` tool from functioning.

---

## Test Results

### 1. Code Analyzer MCP Server

**Status:** ⚠️ Partially Working (3/4 tools functional)

#### ✅ Working Tools:

1. **`analyze_structure`** - PASSED
   - Successfully analyzed codebase structure
   - Returned file counts, extensions, directory structure, and largest files
   - Sample output: 4 Python files across 2 directories

2. **`find_entry_points`** - PASSED
   - Correctly identified [`src/main.py`](test_repo/src/main.py) as Python entry point
   - Confidence level: high
   - Reason: "Standard Python entry point filename"

3. **`analyze_dependencies`** - PASSED
   - Successfully extracted dependencies from imports and package files
   - Identified both code imports (typing, os, sys, unittest) and package dependencies (requests, pytest, pyyaml, etc.)
   - Properly counted usage across files

#### ❌ Failing Tool:

4. **`get_complexity_metrics`** - FAILED
   - **Error:** `Invalid regular expression: /\b?\b/g: Nothing to repeat`
   - **Root Cause:** Line 327 in [`server.ts`](src/mcp-servers/code-analyzer/server.ts:327)
   - **Issue:** Special regex characters (`?`, `&&`, `||`) used in word boundary pattern without escaping

---

### 2. Git Analyzer MCP Server

**Status:** ✅ Fully Working (3/3 tools functional)

#### ✅ All Tools Working:

1. **`get_hotspot_files`** - PASSED
   - Successfully identified files with most changes
   - Returned commit counts, author counts, last modified dates, and change frequency
   - Tested with limit parameter (10 files)
   - Sample: 7 files identified with 1 commit each

2. **`get_contributors`** - PASSED
   - Successfully retrieved contributor statistics
   - Returned name, email, commit count, lines added/deleted, date range, and files touched
   - Sample: 1 contributor (Vishnu) with 351 lines added across 7 files

3. **`get_file_history`** - PASSED
   - Successfully retrieved commit history for specific file
   - Returned commit hash, author, date, message, and change statistics
   - Tested with [`src/main.py`](test_repo/src/main.py) - returned 1 commit with 35 additions

---

## Bug Details

### Critical Bug in Code Analyzer

**Location:** [`src/mcp-servers/code-analyzer/server.ts:321-332`](src/mcp-servers/code-analyzer/server.ts:321-332)

**Problem:**
```typescript
const complexityKeywords = [
  'if', 'else', 'elif', 'for', 'while', 'case', 'catch',
  '&&', '||', '?', 'and', 'or',  // ← These need escaping
];
let complexity = 1;
for (const keyword of complexityKeywords) {
  const regex = new RegExp(`\\b${keyword}\\b`, 'g');  // ← Fails for special chars
  const matches = content.match(regex);
  if (matches) {
    complexity += matches.length;
  }
}
```

**Why it fails:**
- The `?` character is a regex quantifier meaning "zero or one"
- When used in `\b?\b`, it creates an invalid pattern (nothing before `?` to repeat)
- Similarly, `&&` and `||` have special meanings in regex

**Recommended Fix:**
```typescript
const complexityKeywords = [
  'if', 'else', 'elif', 'for', 'while', 'case', 'catch',
  '&&', '||', '?', 'and', 'or',
];
let complexity = 1;
for (const keyword of complexityKeywords) {
  // Escape special regex characters
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Use word boundaries only for alphanumeric keywords
  const pattern = /^[a-zA-Z]+$/.test(keyword) 
    ? `\\b${escapedKeyword}\\b` 
    : escapedKeyword;
    
  const regex = new RegExp(pattern, 'g');
  const matches = content.match(regex);
  if (matches) {
    complexity += matches.length;
  }
}
```

---

## Recommendations

### Immediate Actions:

1. **Fix the regex bug** in [`code-analyzer/server.ts`](src/mcp-servers/code-analyzer/server.ts:327)
   - Escape special characters before creating regex patterns
   - Use word boundaries only for alphanumeric keywords
   - Test with files containing `?`, `&&`, `||` operators

2. **Add error handling tests** for edge cases:
   - Empty repositories
   - Binary files
   - Very large files
   - Non-UTF8 encoded files

3. **Rebuild the MCP servers** after fixing the bug:
   ```bash
   cd src/mcp-servers
   npm run build
   ```

### Future Enhancements:

1. **Add unit tests** for both MCP servers
2. **Improve complexity calculation** - current implementation is simplified
3. **Add caching** for expensive operations (git log parsing)
4. **Add progress indicators** for long-running operations
5. **Support more file types** in code analyzer

---

## Conclusion

**Git Analyzer:** ✅ Production Ready  
**Code Analyzer:** ⚠️ Needs Bug Fix (1 critical issue)

The git-analyzer MCP server is fully functional and ready for production use. The code-analyzer server works well for 3 out of 4 tools, but requires a bug fix for the complexity metrics feature before it can be considered production-ready.

**Overall Assessment:** Both servers demonstrate good architecture and functionality. The bug is minor and easily fixable. Once resolved, both servers will be fully operational.