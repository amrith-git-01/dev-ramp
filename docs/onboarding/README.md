# Onboarding Documentation

This directory contains auto-generated onboarding documentation for the analyzed codebase.

## Generated Files

When you run the DevRamp analysis pipeline, the following files will be generated here:

### Architecture Documentation
- **`architecture_report.md`** - Comprehensive architecture analysis including:
  - System architecture overview
  - Technology stack
  - Component relationships
  - Entry points
  - Complexity analysis
  - Architecture recommendations

- **`dependency_graph.json`** - Structured dependency information in JSON format for visualization

### Workflow Documentation
- **`workflow_guide.md`** - Development workflow documentation including:
  - Build process
  - Testing procedures
  - CI/CD pipeline
  - Code quality checks
  - Common development tasks

- **`setup_instructions.md`** - Step-by-step setup guide including:
  - Prerequisites
  - Installation steps
  - Configuration
  - Verification procedures
  - IDE setup recommendations

### Code Quality Analysis
- **`hotspot_report.md`** - Code hotspot analysis including:
  - Frequently changed files
  - High complexity areas
  - Technical debt assessment
  - Refactoring recommendations
  - Risk analysis

- **`refactoring_priorities.json`** - Prioritized refactoring recommendations in JSON format

### Comprehensive Guides
- **`ONBOARDING_GUIDE.md`** - Main onboarding guide for new developers including:
  - Welcome and project overview
  - Getting started
  - Key components
  - Development workflow
  - Code quality standards
  - Areas to watch
  - Getting help

- **`API_REFERENCE.md`** - API documentation including:
  - Entry points
  - Core modules
  - Public APIs
  - Configuration options
  - Usage examples

- **`FAQ.md`** - Frequently asked questions covering:
  - Setup issues
  - Development workflow
  - Architecture questions
  - Common problems
  - Contributing guidelines

## How to Generate Documentation

Run the analysis pipeline using:

```bash
# Analyze current directory
python run_analysis.py

# Analyze specific repository
python run_analysis.py --repo-path /path/to/repo

# Run with verbose output
python run_analysis.py --verbose

# Use parallel execution for faster results
python run_analysis.py --parallel
```

## Documentation Quality

All documentation is generated using:
- **IBM watsonx.ai** (Granite models) for intelligent analysis
- **MCP Servers** for code and git analysis
- **Multi-agent orchestration** for comprehensive coverage

The generated documentation is:
- ✅ Comprehensive and detailed
- ✅ Tailored to your specific codebase
- ✅ Beginner-friendly
- ✅ Actionable and practical
- ✅ Up-to-date with latest analysis

## Customization

You can customize the documentation generation by:
1. Modifying agent prompts in `src/agents/`
2. Adjusting model parameters in `orchestrate/agents.yaml`
3. Creating custom templates
4. Adding additional analysis steps

## Support

For issues or questions:
1. Check the main [README.md](../../README.md)
2. Review [MCP_SETUP.md](../MCP_SETUP.md)
3. Consult the [phase3-completion-report.md](../../phase3-completion-report.md)

---

**Note:** This directory will be populated after running the analysis pipeline. The files listed above are examples of what will be generated based on your codebase.