# Quick Start Guide - Phase 3

Get started with DevRamp AI agents in 5 minutes!

## Prerequisites

✅ Python 3.9+  
✅ Node.js 18+  
✅ IBM watsonx.ai credentials  
✅ Git repository to analyze

## Step 1: Setup Environment

```bash
# Clone or navigate to project
cd dev-ramp

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies for MCP servers
cd src/mcp-servers
npm install
npm run build
cd ../..

# Configure watsonx.ai credentials
cp .env.example .env
# Edit .env and add your credentials
```

## Step 2: Verify Setup

```bash
# Test watsonx.ai connection
python test_watsonx.py

# Test MCP servers
python -c "from src.agents.mcp_client import MCPClient; print('MCP client ready')"
```

## Step 3: Run Analysis

```bash
# Analyze the test repository
python run_analysis.py --repo-path test_repo --verbose
```

Expected output:
```
╔═══════════════════════════════════════════════════════════════╗
║                         DEVRAMP                               ║
║   AI-Powered Legacy Codebase Onboarding Accelerator          ║
╚═══════════════════════════════════════════════════════════════╝

Repository: test_repo
Output Directory: docs/onboarding
Agents: all
Execution Mode: sequential

🚀 Starting onboarding analysis...
✓ Architecture Analyzer completed in 15.2s
✓ Workflow Extractor completed in 8.5s
✓ Hotspot Detector completed in 12.3s
✓ Documentation Generator completed in 10.1s

═══════════════════════════════════════════════════════════════
ANALYSIS SUMMARY
═══════════════════════════════════════════════════════════════

✓ Status: SUCCESS
⏱  Total Time: 46.1s
🤖 Agents Run: 4
✓  Successful: 4

📄 Generated Files (9):
   - docs/onboarding/architecture_report.md
   - docs/onboarding/dependency_graph.json
   - docs/onboarding/workflow_guide.md
   - docs/onboarding/setup_instructions.md
   - docs/onboarding/hotspot_report.md
   - docs/onboarding/refactoring_priorities.json
   - docs/onboarding/ONBOARDING_GUIDE.md
   - docs/onboarding/API_REFERENCE.md
   - docs/onboarding/FAQ.md

📁 Output Directory: docs/onboarding
```

## Step 4: Review Generated Documentation

```bash
# View main onboarding guide
cat docs/onboarding/ONBOARDING_GUIDE.md

# View architecture report
cat docs/onboarding/architecture_report.md

# View hotspot analysis
cat docs/onboarding/hotspot_report.md
```

## Step 5: Analyze Your Own Repository

```bash
# Analyze your repository
python run_analysis.py --repo-path /path/to/your/repo --parallel

# Or use current directory
python run_analysis.py --parallel
```

## Common Commands

```bash
# Run specific agents only
python run_analysis.py --agents architecture workflow

# Use parallel execution (faster)
python run_analysis.py --parallel

# Custom output directory
python run_analysis.py --output-dir custom/path

# Verbose output for debugging
python run_analysis.py --verbose

# Get help
python run_analysis.py --help
```

## What Gets Generated?

### 📊 Architecture Analysis
- **architecture_report.md** - Complete architecture overview
- **dependency_graph.json** - Dependency visualization data

### 🔄 Workflow Documentation
- **workflow_guide.md** - Development workflows
- **setup_instructions.md** - Setup guide

### 🔥 Code Quality
- **hotspot_report.md** - Code hotspots and technical debt
- **refactoring_priorities.json** - Prioritized improvements

### 📚 Onboarding Guides
- **ONBOARDING_GUIDE.md** - Main guide for new developers
- **API_REFERENCE.md** - API documentation
- **FAQ.md** - Frequently asked questions

## Troubleshooting

### MCP Server Issues

```bash
# Rebuild MCP servers
cd src/mcp-servers
npm run clean
npm install
npm run build
```

### watsonx.ai Connection Issues

```bash
# Verify credentials
python test_watsonx.py

# Check .env file
cat .env | grep WATSONX
```

### Agent Execution Issues

```bash
# Run with verbose output
python run_analysis.py --verbose

# Test individual components
python -c "from src.agents import ArchitectureAnalyzer; print('OK')"
```

## Next Steps

1. ✅ Review generated documentation
2. ✅ Customize agent prompts in `src/agents/`
3. ✅ Adjust model parameters in `orchestrate/agents.yaml`
4. ✅ Proceed to Phase 4: Bob IDE Integration

## Learn More

- **Full Usage Guide:** [docs/PHASE3_USAGE_GUIDE.md](PHASE3_USAGE_GUIDE.md)
- **Phase 3 Report:** [phase3-completion-report.md](../phase3-completion-report.md)
- **MCP Setup:** [docs/MCP_SETUP.md](MCP_SETUP.md)
- **Testing Report:** [mcp-test-report.md](../mcp-test-report.md)

## Support

Having issues? Check:
1. Python version: `python --version` (need 3.9+)
2. Node.js version: `node --version` (need 18+)
3. Dependencies: `pip list` and `npm list`
4. Credentials: `.env` file configured correctly

---

**Ready to analyze your codebase?** Run `python run_analysis.py` now! 🚀