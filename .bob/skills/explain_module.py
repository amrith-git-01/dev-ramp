"""
Explain Module Skill for Bob's Onboarding Assistant

This skill generates comprehensive explanations of code modules for newcomers,
leveraging Bob's full repository context and MCP server integrations.
"""

from typing import Any, Dict, Optional


async def explain_module(file_path: str, context: Any) -> str:
    """
    Generate comprehensive explanations of code modules for newcomers.
    
    This skill analyzes a code file and provides a detailed explanation suitable
    for developers who are new to the codebase. It combines static code analysis,
    git history, complexity metrics, and AI-powered insights.
    
    Args:
        file_path: Path to the file to explain (relative to repository root)
        context: BobContext object providing access to repo, MCP servers, and AI
        
    Returns:
        A comprehensive explanation of the module formatted for readability
        
    Usage:
        @explain_module path/to/file.py
        @explain_module src/agents/coordinator.py
        
    Example Output:
        ## Module: src/agents/coordinator.py
        
        ### Purpose
        This module orchestrates the multi-agent analysis workflow...
        
        ### System Integration
        Acts as the central hub connecting...
        
        ### Key Components
        - CoordinatorAgent class: Main orchestration logic
        - analyze() method: Entry point for analysis
        
        ### Patterns Used
        - Agent pattern for modular analysis
        - Async/await for concurrent operations
        
        ### Important Notes
        - Watch for MCP connection timeouts
        - Error handling is critical here
    """
    try:
        # Read the file content using Bob's context
        file_content = context.read_file(file_path)
        
        if not file_content:
            return f"Error: Could not read file '{file_path}'. Please verify the path is correct."
        
        # Get git history from MCP server
        git_history: Optional[Dict[str, Any]] = None
        try:
            git_history = await context.mcp.call_tool(
                "git-analyzer",
                "get_file_history",
                {"file_path": file_path}
            )
        except Exception as e:
            # Continue without git history if MCP call fails
            print(f"Warning: Could not fetch git history: {e}")
            git_history = {"history": [], "error": str(e)}
        
        # Get complexity metrics from MCP server
        complexity: Optional[Dict[str, Any]] = None
        try:
            complexity = await context.mcp.call_tool(
                "code-analyzer",
                "get_complexity_metrics",
                {"file_path": file_path}
            )
        except Exception as e:
            # Continue without complexity metrics if MCP call fails
            print(f"Warning: Could not fetch complexity metrics: {e}")
            complexity = {"error": str(e)}
        
        # Build context information for the AI prompt
        history_info = "Not available"
        if git_history and "history" in git_history:
            commit_count = len(git_history["history"])
            history_info = f"{commit_count} commits in history"
            if commit_count > 0:
                recent = git_history["history"][0]
                history_info += f"\nMost recent: {recent.get('message', 'N/A')}"
        
        complexity_info = "Not available"
        if complexity and "error" not in complexity:
            complexity_info = f"Cyclomatic complexity: {complexity.get('cyclomatic', 'N/A')}"
            if "functions" in complexity:
                complexity_info += f"\nFunctions: {len(complexity['functions'])}"
        
        # Generate comprehensive explanation using AI
        prompt = f"""
Explain this module to a new developer joining the team:

File: {file_path}
Complexity Metrics: {complexity_info}
Git History: {history_info}

Code:
```
{file_content}
```

Provide a comprehensive explanation with the following sections:

1. **What this module does**: High-level purpose and responsibilities
2. **How it fits in the system**: Dependencies, integrations, and role in the architecture
3. **Key functions/classes**: Main components and their purposes
4. **Important patterns used**: Design patterns, architectural decisions, coding conventions
5. **Things to watch out for**: Common pitfalls, edge cases, maintenance considerations

Format the response in clear markdown with headers and bullet points for readability.
Focus on helping a newcomer understand not just WHAT the code does, but WHY it's structured this way.
"""
        
        # Generate the explanation using Bob's AI capabilities
        explanation = await context.ai.generate(prompt)
        
        return explanation
        
    except FileNotFoundError:
        return f"Error: File '{file_path}' not found in the repository."
    except Exception as e:
        return f"Error explaining module: {str(e)}\n\nPlease check the file path and try again."


# Metadata for Bob's skill registry
__skill_metadata__ = {
    "name": "explain_module",
    "description": "Generate comprehensive explanations of code modules for newcomers",
    "usage": "@explain_module path/to/file.py",
    "category": "onboarding",
    "requires_mcp": ["git-analyzer", "code-analyzer"],
    "version": "1.0.0"
}

# Made with Bob
