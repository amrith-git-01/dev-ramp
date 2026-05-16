# Documentation Generator MCP Server - Setup & Usage Guide

## Overview

The **documentation-generator** MCP server is the third MCP server in the DevRamp system. It orchestrates the other two MCP servers (code-analyzer and git-analyzer) and uses watsonx.ai to generate comprehensive documentation files.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Documentation Generator MCP Server              │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │              5 MCP Tools                        │   │
│  │  • generate_onboarding_guide                    │   │
│  │  • generate_api_reference                       │   │
│  │  • generate_faq                                 │   │
│  │  • regenerate_section                           │   │
│  │  • validate_documentation                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ MCP Client   │  │ WatsonX.ai   │  │  Formatters │  │
│  │ (Orchestrate)│  │  Integration │  │  & Templates│  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                    │
           ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐
  │  code-analyzer  │  │  git-analyzer   │
  │   MCP Server    │  │   MCP Server    │
  └─────────────────┘  └─────────────────┘
```

## Installation

### 1. Build the Server

```bash
cd src/mcp-servers
npm run build:documentation-generator
```

This compiles TypeScript to JavaScript in `documentation-generator/build/`

### 2. Configure Environment Variables

Create or update `.env` file in project root:

```env
# WatsonX.ai Credentials (Required)
WATSONX_API_KEY=your_api_key_here
WATSONX_PROJECT_ID=your_project_id_here

# Repository Configuration
REPO_PATH=./test_repo
OUTPUT_DIR=./docs/onboarding

# MCP Server Endpoints (Optional - defaults shown)
CODE_ANALYZER_PATH=./src/mcp-servers/code-analyzer/build/server.js
GIT_ANALYZER_PATH=./src/mcp-servers/git-analyzer/build/server.js
```

### 3. Register with Bob IDE

Add to Bob's MCP configuration (usually in Bob settings):

```json
{
  "mcpServers": {
    "documentation-generator": {
      "command": "node",
      "args": [
        "c:/Users/vishn/Desktop/Programs/dev-ramp/src/mcp-servers/documentation-generator/build/server.js"
      ],
      "env": {
        "REPO_PATH": "c:/Users/vishn/Desktop/Programs/dev-ramp/test_repo",
        "WATSONX_API_KEY": "${env:WATSONX_API_KEY}",
        "WATSONX_PROJECT_ID": "${env:WATSONX_PROJECT_ID}"
      }
    }
  }
}
```

## MCP Tools

### 1. generate_onboarding_guide

Generates a comprehensive onboarding guide for new developers.

**Input Schema:**
```json
{
  "targetPath": "string (required)",
  "includeArchitecture": "boolean (default: true)",
  "includeSetup": "boolean (default: true)",
  "includeWorkflows": "boolean (default: true)"
}
```

**Example:**
```json
{
  "targetPath": "test_repo",
  "includeArchitecture": true,
  "includeSetup": true,
  "includeWorkflows": true
}
```

**Output:** `ONBOARDING_GUIDE.md` with sections:
- Welcome & Project Overview
- Architecture Overview
- Getting Started
- Key Components
- Development Workflow
- Code Quality Standards
- Areas to Watch
- Getting Help

### 2. generate_api_reference

Generates API reference documentation.

**Input Schema:**
```json
{
  "targetPath": "string (required)",
  "includeExamples": "boolean (default: true)",
  "includeTypes": "boolean (default: true)",
  "format": "markdown | html (default: markdown)"
}
```

**Example:**
```json
{
  "targetPath": "test_repo",
  "includeExamples": true,
  "includeTypes": true,
  "format": "markdown"
}
```

**Output:** `API_REFERENCE.md` with:
- API Overview
- Entry Points
- Core Modules
- Public APIs
- Configuration Options
- Error Handling
- Usage Examples

### 3. generate_faq

Generates FAQ documentation based on code patterns and git history.

**Input Schema:**
```json
{
  "targetPath": "string (required)",
  "gitHistoryDepth": "number (default: 100)",
  "includeDeployment": "boolean (default: true)",
  "includeTroubleshooting": "boolean (default: true)"
}
```

**Example:**
```json
{
  "targetPath": "test_repo",
  "gitHistoryDepth": 100,
  "includeDeployment": true,
  "includeTroubleshooting": true
}
```

**Output:** `FAQ.md` with categories:
- Getting Started
- Development
- Architecture
- Common Issues
- Contributing
- Technical Debt

### 4. regenerate_section

Updates a specific section in existing documentation.

**Input Schema:**
```json
{
  "documentType": "onboarding | api | faq (required)",
  "sectionName": "string (required)",
  "targetPath": "string (required)"
}
```

**Example:**
```json
{
  "documentType": "onboarding",
  "sectionName": "Getting Started",
  "targetPath": "test_repo"
}
```

**Output:** Updated section content

### 5. validate_documentation

Validates generated documentation for quality and correctness.

**Input Schema:**
```json
{
  "documentPath": "string (required)",
  "checkLinks": "boolean (default: true)",
  "checkCodeBlocks": "boolean (default: true)"
}
```

**Example:**
```json
{
  "documentPath": "docs/onboarding/ONBOARDING_GUIDE.md",
  "checkLinks": true,
  "checkCodeBlocks": true
}
```

**Output:** Validation report with:
- Errors (broken links, invalid syntax)
- Warnings (missing sections, inconsistent formatting)
- Suggestions (improvements, best practices)

## Usage Examples

### Via Bob IDE

Once registered, you can use the tools directly in Bob:

```
Use the documentation-generator MCP server to generate an onboarding guide for test_repo
```

Bob will automatically call the appropriate tool with the right parameters.

### Via MCP Client (Programmatic)

```typescript
import { MCPClient } from './mcp-client';

const client = new MCPClient(
  'documentation-generator',
  'node',
  ['src/mcp-servers/documentation-generator/build/server.js'],
  {
    REPO_PATH: './test_repo',
    WATSONX_API_KEY: process.env.WATSONX_API_KEY,
    WATSONX_PROJECT_ID: process.env.WATSONX_PROJECT_ID
  }
);

await client.connect();

// Generate onboarding guide
const result = await client.callTool('generate_onboarding_guide', {
  targetPath: 'test_repo',
  includeArchitecture: true,
  includeSetup: true,
  includeWorkflows: true
});

console.log(result);
```

### Via Command Line (Testing)

```bash
# Start the server
cd src/mcp-servers
npm run start:documentation-generator

# In another terminal, send JSON-RPC request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_onboarding_guide","arguments":{"targetPath":"test_repo","includeArchitecture":true}}}' | node documentation-generator/build/server.js
```

## Data Flow

1. **Tool Call Received** → MCP server receives tool call request
2. **Data Collection** → Spawns MCP clients to code-analyzer and git-analyzer
3. **Parallel Queries** → Executes multiple tool calls in parallel:
   - code-analyzer: analyze_structure, find_entry_points, analyze_dependencies
   - git-analyzer: get_hotspot_files, get_contributors, get_file_history
4. **Data Aggregation** → Combines and normalizes data from both servers
5. **AI Generation** → Passes structured data to watsonx.ai with prompt templates
6. **Post-Processing** → Formats AI output, applies markdown styling
7. **File Writing** → Saves generated documentation to output directory
8. **Response** → Returns success status and file paths

## Configuration

### WatsonX.ai Parameters

Edit `src/mcp-servers/documentation-generator/src/ai/watsonx-client.ts`:

```typescript
const DEFAULT_PARAMS = {
  model_id: 'ibm/granite-3.0-8b-instruct',
  parameters: {
    temperature: 0.3,      // Lower = more focused
    max_new_tokens: 2000,  // Maximum response length
    top_p: 0.9,
    top_k: 50
  }
};
```

### Prompt Templates

Customize prompts in `src/mcp-servers/documentation-generator/src/ai/prompts.ts`:

```typescript
export const ONBOARDING_PROMPT = `
You are creating an onboarding guide for new developers...
[Customize this template]
`;
```

### Output Templates

Modify templates in `src/mcp-servers/documentation-generator/src/formatters/templates.ts`:

```typescript
export const ONBOARDING_TEMPLATE = `
# 🚀 Onboarding Guide

[Customize header and structure]
`;
```

## Troubleshooting

### Server Won't Start

**Error:** `Cannot find module '@modelcontextprotocol/sdk'`

**Solution:**
```bash
cd src/mcp-servers
npm install
npm run build:documentation-generator
```

### WatsonX.ai Authentication Failed

**Error:** `401 Unauthorized`

**Solution:**
1. Check `.env` file has correct credentials
2. Verify API key is active in IBM Cloud
3. Ensure project ID is correct

### MCP Client Connection Failed

**Error:** `Failed to connect to code-analyzer`

**Solution:**
1. Ensure code-analyzer and git-analyzer are built:
   ```bash
   cd src/mcp-servers
   npm run build
   ```
2. Check paths in environment variables
3. Verify other MCP servers start successfully

### Generated Documentation is Empty

**Error:** Tool returns success but files are empty

**Solution:**
1. Check watsonx.ai API limits (rate limiting)
2. Verify repository path is correct
3. Check output directory permissions
4. Review server logs for AI generation errors

## Testing

### Unit Tests

```bash
cd src/mcp-servers/documentation-generator
npm test
```

### Integration Test

```bash
# Test with sample repository
node build/server.js <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_onboarding_guide","arguments":{"targetPath":"../../test_repo"}}}
EOF
```

### End-to-End Test

```bash
# Run complete documentation generation
python run_analysis.py --repo-path test_repo --verbose
```

## Performance

### Benchmarks

| Repository Size | Generation Time | AI Calls | Output Size |
|----------------|-----------------|----------|-------------|
| Small (<100 files) | 30-60s | 3 | ~15KB |
| Medium (100-500 files) | 1-2 min | 3 | ~30KB |
| Large (500+ files) | 2-5 min | 3 | ~50KB |

### Optimization Tips

1. **Use Caching** - Cache MCP server responses
2. **Parallel Execution** - Run multiple tool calls concurrently
3. **Reduce Token Usage** - Optimize prompts for brevity
4. **Batch Processing** - Generate multiple docs in one session

## Maintenance

### Updating Dependencies

```bash
cd src/mcp-servers
npm update
npm run build:documentation-generator
```

### Adding New Tools

1. Create tool file in `src/tools/`
2. Implement tool logic
3. Register in `server.ts`
4. Update this documentation

### Modifying AI Behavior

1. Edit prompts in `src/ai/prompts.ts`
2. Adjust parameters in `src/ai/watsonx-client.ts`
3. Test with sample repository
4. Update templates if needed

## Support

- **Documentation:** See main [README.md](../README.md)
- **MCP Setup:** See [MCP_SETUP.md](MCP_SETUP.md)
- **Phase 3 Report:** See [phase3-completion-report.md](../phase3-completion-report.md)
- **Issues:** Check server logs in Bob IDE

---

**Server Status:** ✅ Built and Ready  
**Last Updated:** 2026-05-16  
**Version:** 1.0.0