# MCP Documentation Generation Plan

## Current Status

The documentation-generator MCP server has been created and initialization issues have been fixed, but it needs to be rebuilt and properly configured before it can generate documentation.

## Issue Analysis

### Problem
The MCP server returns "Onboarding generator not initialized" error when attempting to generate documentation.

### Root Cause
1. **Missing REPO_PATH**: The `.env` file has `TARGET_REPO_PATH` but the server expects `REPO_PATH`
2. **Server Not Rebuilt**: The TypeScript source was fixed but not recompiled to JavaScript
3. **Environment Variables**: While `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` are set, the server may not be reading them correctly

## Required Actions

### 1. Update Environment Configuration
Add `REPO_PATH` to `.env` file:
```env
REPO_PATH=./test_repo
```

### 2. Rebuild MCP Server
```bash
cd src/mcp-servers
npm run build:documentation-generator
```

### 3. Verify Build Output
Check that `src/mcp-servers/documentation-generator/build/` contains compiled JavaScript files.

### 4. Test MCP Server Tools
Once rebuilt, test each tool in sequence:

#### a. Generate Onboarding Guide
```json
{
  "output_path": "docs/onboarding/ONBOARDING_GUIDE.md",
  "project_name": "dev-ramp",
  "use_template": false
}
```

#### b. Generate API Reference
```json
{
  "output_path": "docs/onboarding/API_REFERENCE.md",
  "project_name": "dev-ramp",
  "use_template": false
}
```

#### c. Generate FAQ
```json
{
  "output_path": "docs/onboarding/FAQ.md",
  "project_name": "dev-ramp",
  "use_template": false
}
```

## Expected Outcomes

### Success Criteria
- ✅ All three documentation files generated successfully
- ✅ Files contain comprehensive, AI-generated content
- ✅ Content is specific to the dev-ramp codebase
- ✅ Markdown formatting is correct
- ✅ No initialization errors

### Generated Files
1. **`docs/onboarding/ONBOARDING_GUIDE.md`**
   - Project overview
   - Architecture explanation
   - Setup instructions
   - Key concepts
   - Development workflow

2. **`docs/onboarding/API_REFERENCE.md`**
   - Module documentation
   - Function signatures
   - Class definitions
   - Usage examples
   - Integration points

3. **`docs/onboarding/FAQ.md`**
   - Common questions
   - Troubleshooting tips
   - Best practices
   - Known issues
   - Solutions

## Next Steps

1. **Switch to Code Mode** - Plan mode cannot edit `.env` or rebuild the server
2. **Add REPO_PATH** - Update `.env` with correct repository path
3. **Rebuild Server** - Compile TypeScript to JavaScript
4. **Test Generation** - Run all three documentation generation tools
5. **Validate Output** - Verify generated documentation quality
6. **Create Report** - Document results and any issues

## Technical Details

### MCP Server Architecture
```
documentation-generator/
├── server.ts (main entry point)
├── src/
│   ├── ai/
│   │   ├── watsonx-client.ts (AI integration)
│   │   └── prompts.ts (generation prompts)
│   ├── orchestrator/
│   │   ├── mcp-client.ts (connects to other MCPs)
│   │   └── data-collector.ts (gathers codebase data)
│   ├── tools/
│   │   ├── onboarding.ts
│   │   ├── api-reference.ts
│   │   ├── faq.ts
│   │   ├── section-updater.ts
│   │   └── validator.ts
│   └── formatters/
│       ├── markdown.ts
│       └── templates.ts
└── build/ (compiled JavaScript)
```

### Dependencies
- **code-analyzer MCP**: Provides code structure analysis
- **git-analyzer MCP**: Provides git history and hotspot data
- **watsonx.ai**: Generates AI-powered content
- **MCP SDK**: Handles protocol communication

### Environment Variables Required
```env
WATSONX_API_KEY=<your-key>
WATSONX_PROJECT_ID=<your-project-id>
REPO_PATH=./test_repo
OUTPUT_DIR=docs/onboarding
```

## Fallback Options

If AI generation fails:
1. Use `use_template: true` for template-based generation
2. Generate documentation manually using Python agents
3. Use individual MCP tools (code-analyzer, git-analyzer) directly

## Success Metrics

- **Completeness**: All sections present and detailed
- **Accuracy**: Information matches actual codebase
- **Clarity**: Easy to understand for new developers
- **Usefulness**: Provides actionable guidance
- **Maintainability**: Can be regenerated as code evolves