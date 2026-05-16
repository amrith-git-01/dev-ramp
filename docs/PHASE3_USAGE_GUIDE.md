# Phase 3: Agent Implementation - Usage Guide

This guide explains how to use the AI agents implemented in Phase 3 of the DevRamp project.

## Overview

Phase 3 implements a multi-agent system that analyzes legacy codebases and generates comprehensive onboarding documentation using IBM watsonx.ai and MCP servers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Coordinator                         │
│                  (Orchestrates Execution)                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Architecture │    │   Workflow   │    │   Hotspot    │
│   Analyzer   │    │  Extractor   │    │   Detector   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Documentation   │
                  │    Generator     │
                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Generated Docs  │
                  │  (Markdown/JSON) │
                  └──────────────────┘
```

## Agents

### 1. Architecture Analyzer
**File:** `src/agents/architecture_analyzer.py`

**Purpose:** Analyzes codebase structure and generates architecture documentation

**Capabilities:**
- Analyzes directory structure and file organization
- Identifies architectural patterns (MVC, microservices, etc.)
- Maps dependencies between modules
- Generates dependency graphs
- Identifies entry points

**Outputs:**
- `architecture_report.md` - Comprehensive architecture analysis
- `dependency_graph.json` - Structured dependency data

**MCP Tools Used:**
- `analyze_structure` - Get codebase structure
- `find_entry_points` - Identify entry points
- `analyze_dependencies` - Analyze dependencies
- `get_complexity_metrics` - Get complexity metrics

### 2. Workflow Extractor
**File:** `src/agents/workflow_extractor.py`

**Purpose:** Extracts development workflows and generates setup instructions

**Capabilities:**
- Discovers workflow files (package.json, Makefile, CI/CD configs)
- Analyzes build processes
- Documents testing procedures
- Generates setup instructions

**Outputs:**
- `workflow_guide.md` - Development workflow documentation
- `setup_instructions.md` - Step-by-step setup guide

**Supported Files:**
- Package managers: npm, pip, Maven, Gradle, Cargo, Go
- Build tools: Makefile, CMake
- CI/CD: GitHub Actions, GitLab CI, Jenkins, Travis
- Containers: Dockerfile, docker-compose

### 3. Hotspot Detector
**File:** `src/agents/hotspot_detector.py`

**Purpose:** Identifies code hotspots and generates refactoring recommendations

**Capabilities:**
- Analyzes git history for frequently changed files
- Combines change frequency with complexity metrics
- Calculates risk scores (0-100)
- Generates refactoring priorities

**Outputs:**
- `hotspot_report.md` - Code quality analysis
- `refactoring_priorities.json` - Prioritized recommendations

**Risk Levels:**
- CRITICAL: Risk score ≥ 75
- HIGH: Risk score ≥ 50
- MEDIUM: Risk score ≥ 25
- LOW: Risk score < 25

**MCP Tools Used:**
- `get_hotspot_files` - Get frequently changed files
- `get_contributors` - Get contributor statistics
- `get_complexity_metrics` - Get complexity data

### 4. Documentation Generator
**File:** `src/agents/documentation_generator.py`

**Purpose:** Aggregates results and generates comprehensive documentation

**Capabilities:**
- Creates onboarding guides
- Generates API documentation
- Creates FAQ sections
- Produces troubleshooting guides

**Outputs:**
- `ONBOARDING_GUIDE.md` - Main onboarding guide
- `API_REFERENCE.md` - API documentation
- `FAQ.md` - Frequently asked questions

## Usage

### Basic Usage

```bash
# Analyze current directory
python run_analysis.py

# Analyze specific repository
python run_analysis.py --repo-path /path/to/repo

# Specify output directory
python run_analysis.py --output-dir custom/output/path
```

### Advanced Usage

```bash
# Run specific agents only
python run_analysis.py --agents architecture workflow

# Use parallel execution (faster)
python run_analysis.py --parallel

# Verbose output for debugging
python run_analysis.py --verbose

# Custom MCP configuration
python run_analysis.py --mcp-config config/mcp-servers.json
```

### Programmatic Usage

```python
import asyncio
from src.agents.coordinator import run_analysis

async def main():
    results = await run_analysis(
        repo_path='./my-project',
        output_dir='docs/onboarding',
        agents=['architecture', 'workflow', 'hotspot', 'documentation'],
        parallel=True,
        verbose=False
    )
    
    print(f"Status: {results['status']}")
    print(f"Generated files: {results['output_files']}")

asyncio.run(main())
```

### Using Individual Agents

```python
import asyncio
from src.agents.mcp_client import MCPClient
from src.agents.architecture_analyzer import ArchitectureAnalyzer

async def analyze_architecture():
    # Setup MCP client
    client = MCPClient(
        'code-analyzer',
        'node',
        ['src/mcp-servers/code-analyzer/build/server.js'],
        {'REPO_PATH': './my-project'}
    )
    
    async with client:
        # Create and run agent
        analyzer = ArchitectureAnalyzer(client)
        result = await analyzer.run({
            'repo_path': './my-project',
            'output_dir': 'docs/onboarding'
        })
        
        print(f"Architecture report: {result['result']['architecture_report']}")

asyncio.run(analyze_architecture())
```

## Execution Modes

### Sequential Mode (Default)
Runs agents one after another:
1. Architecture Analyzer
2. Workflow Extractor
3. Hotspot Detector
4. Documentation Generator

**Pros:** Simpler, easier to debug  
**Cons:** Slower execution

### Parallel Mode
Runs independent agents in parallel:
- **Phase 1:** Architecture Analyzer (alone)
- **Phase 2:** Workflow Extractor + Hotspot Detector (parallel)
- **Phase 3:** Documentation Generator (depends on all previous)

**Pros:** Faster execution (30-50% time savings)  
**Cons:** More complex error handling

## Configuration

### Agent Configuration
Edit `orchestrate/agents.yaml` to customize:
- Model parameters (temperature, max_tokens)
- Execution order
- Parallel groups
- Error handling

### MCP Server Configuration
Create `config/mcp-servers.json`:

```json
{
  "code-analyzer": {
    "command": "node",
    "args": ["src/mcp-servers/code-analyzer/build/server.js"],
    "env": {
      "REPO_PATH": "/path/to/repo"
    }
  },
  "git-analyzer": {
    "command": "node",
    "args": ["src/mcp-servers/git-analyzer/build/server.js"],
    "env": {
      "REPO_PATH": "/path/to/repo"
    }
  }
}
```

## Output Files

All generated files are saved to `docs/onboarding/` (or custom output directory):

| File | Description | Format |
|------|-------------|--------|
| `architecture_report.md` | Architecture analysis | Markdown |
| `dependency_graph.json` | Dependency data | JSON |
| `workflow_guide.md` | Development workflows | Markdown |
| `setup_instructions.md` | Setup guide | Markdown |
| `hotspot_report.md` | Code quality analysis | Markdown |
| `refactoring_priorities.json` | Refactoring priorities | JSON |
| `ONBOARDING_GUIDE.md` | Main onboarding guide | Markdown |
| `API_REFERENCE.md` | API documentation | Markdown |
| `FAQ.md` | FAQ | Markdown |

## Error Handling

### Common Issues

**1. MCP Server Connection Failed**
```
Error: Failed to start MCP server
```
**Solution:** Ensure MCP servers are built:
```bash
cd src/mcp-servers
npm install
npm run build
```

**2. watsonx.ai Authentication Failed**
```
Error: Invalid API key or project ID
```
**Solution:** Check `.env` file has correct credentials:
```
WATSONX_API_KEY=your_api_key
WATSONX_PROJECT_ID=your_project_id
```

**3. Agent Execution Failed**
```
Error: Agent 'architecture' failed
```
**Solution:** Run with `--verbose` flag to see detailed error:
```bash
python run_analysis.py --verbose
```

### Retry Logic

The coordinator automatically retries failed operations:
- Retry attempts: 3
- Retry delay: 5 seconds
- Continue on error: Configurable

## Performance

### Typical Execution Times

| Repository Size | Sequential | Parallel | Speedup |
|----------------|-----------|----------|---------|
| Small (<100 files) | 30-60s | 20-40s | 33% |
| Medium (100-500 files) | 2-4 min | 1-2 min | 50% |
| Large (500+ files) | 5-10 min | 3-6 min | 40% |

### Optimization Tips

1. **Use parallel mode** for faster execution
2. **Limit agent scope** - run only needed agents
3. **Cache results** - reuse previous analysis when possible
4. **Optimize prompts** - reduce token usage
5. **Use faster models** - trade accuracy for speed if needed

## Testing

### Test on Sample Repository

```bash
# Test with included sample repository
python run_analysis.py --repo-path test_repo --verbose
```

### Verify Outputs

```bash
# Check generated files
ls -la docs/onboarding/

# Validate markdown
markdownlint docs/onboarding/*.md

# Validate JSON
python -m json.tool docs/onboarding/dependency_graph.json
```

## Integration with Bob IDE

Phase 3 agents are designed to integrate with Bob IDE in Phase 4:
- Custom Bob modes for agent interaction
- Bob skills for running specific agents
- Session recording for documentation

See `docs/MCP_SETUP.md` for Bob integration details.

## Troubleshooting

### Enable Debug Logging

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check MCP Server Status

```bash
# Test code-analyzer
node src/mcp-servers/code-analyzer/build/server.js

# Test git-analyzer
node src/mcp-servers/git-analyzer/build/server.js
```

### Validate Environment

```bash
# Check Python dependencies
pip list | grep -E "ibm-watsonx-ai|asyncio"

# Check Node.js version
node --version  # Should be >= 18.0.0

# Check watsonx.ai connection
python test_watsonx.py
```

## Best Practices

1. **Always run on a git repository** - Hotspot detector requires git history
2. **Use meaningful output directories** - Organize by project/date
3. **Review generated documentation** - AI-generated content may need refinement
4. **Customize prompts** - Tailor to your organization's standards
5. **Monitor token usage** - watsonx.ai has usage limits
6. **Version control outputs** - Track documentation changes over time

## Next Steps

After Phase 3:
1. Review generated documentation
2. Customize agent prompts if needed
3. Proceed to Phase 4: Bob IDE Integration
4. Create custom Bob modes and skills
5. Record Bob sessions for demonstration

## Support

- **Documentation:** See `README.md` and `docs/`
- **Issues:** Check `phase3-completion-report.md`
- **MCP Setup:** See `docs/MCP_SETUP.md`
- **Testing:** See `mcp-test-report.md`

---

**Phase 3 Status:** ✅ Complete  
**Last Updated:** 2026-05-16  
**Version:** 1.0.0