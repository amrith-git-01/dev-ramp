"""
Find Similar Code Skill for Bob's Onboarding Assistant

This skill locates and explains similar code patterns across the codebase,
helping newcomers understand where specific functionality is implemented
and how it varies across different parts of the system.
"""

from typing import Any, List, Dict, Optional


async def find_similar(pattern: str, context: Any) -> str:
    """
    Locate and explain similar code patterns across the codebase.
    
    This skill searches for code patterns, functions, or concepts across the
    entire repository and provides an AI-powered analysis of where and how
    these patterns are implemented, including variations and best practices.
    
    Args:
        pattern: Description of the code pattern to find (e.g., "authentication logic",
                "database connection", "error handling")
        context: BobContext object providing access to code search and AI capabilities
        
    Returns:
        A comprehensive analysis of where the pattern exists and how it's used
        
    Usage:
        @find_similar "authentication logic"
        @find_similar "database connection pooling"
        @find_similar "async error handling"
        
    Example Output:
        ## Pattern: "authentication logic"
        
        ### Locations Found
        1. src/auth/authenticator.py - Primary implementation
        2. src/api/middleware.py - API authentication
        3. tests/test_auth.py - Test examples
        
        ### Canonical Example
        The main implementation is in src/auth/authenticator.py...
        
        ### Variations
        - API layer uses JWT tokens (src/api/middleware.py)
        - Admin interface uses session-based auth (src/admin/auth.py)
        - Tests use mock authentication (tests/test_auth.py)
        
        ### Recommendations
        For new authentication needs, follow the pattern in...
    """
    try:
        if not pattern or not pattern.strip():
            return "Error: Please provide a pattern to search for.\n\nUsage: @find_similar \"pattern description\""
        
        # Use Bob's code search capability to find relevant files
        search_results: List[Dict[str, Any]] = []
        try:
            search_results = await context.search_code(pattern)
        except Exception as e:
            print(f"Warning: Code search failed: {e}")
            # Try alternative search if primary fails
            try:
                search_results = await context.search_files(pattern)
            except Exception as e2:
                return f"Error: Could not search codebase: {str(e2)}\n\nPlease try a different search pattern."
        
        if not search_results or len(search_results) == 0:
            return f"""
No matches found for pattern: "{pattern}"

Suggestions:
- Try broader search terms (e.g., "auth" instead of "authentication middleware")
- Check spelling and terminology
- Use technical terms that appear in code (e.g., "async def" instead of "asynchronous function")
- Try searching for class names, function names, or import statements
"""
        
        # Format search results for the AI prompt
        results_summary = []
        file_contents = {}
        
        for idx, result in enumerate(search_results[:10], 1):  # Limit to top 10 results
            file_path = result.get("file_path", result.get("path", "unknown"))
            line_num = result.get("line_number", result.get("line", "?"))
            snippet = result.get("snippet", result.get("content", ""))
            
            results_summary.append(f"{idx}. {file_path}:{line_num}")
            
            # Try to get full file content for better context (limit to first 5 files)
            if idx <= 5:
                try:
                    content = context.read_file(file_path)
                    if content:
                        file_contents[file_path] = content[:2000]  # Limit content size
                except Exception as e:
                    print(f"Could not read {file_path}: {e}")
        
        results_text = "\n".join(results_summary)
        
        # Build context from file contents
        context_text = ""
        if file_contents:
            context_text = "\n\nFile Contents (excerpts):\n"
            for path, content in file_contents.items():
                context_text += f"\n--- {path} ---\n{content}\n"
        
        # Generate comprehensive analysis using AI
        prompt = f"""
A developer is looking for code patterns related to: "{pattern}"

Search Results ({len(search_results)} matches found):
{results_text}
{context_text}

Provide a comprehensive analysis with the following sections:

1. **Locations Found**: List the main files where this pattern appears, with brief descriptions
2. **Canonical Example**: Identify which file/implementation is the primary or best example to follow
3. **Variations**: Explain how the pattern differs across different parts of the codebase
4. **Common Patterns**: Identify shared approaches, design patterns, or conventions
5. **Recommendations**: Advise which implementation to use as a reference for new code

Format the response in clear markdown with headers and bullet points.
Focus on helping the developer understand:
- WHERE the pattern is used
- WHY different implementations exist
- WHICH one to follow for new code
- HOW the implementations differ

If the pattern appears in tests, documentation, or configuration files, mention those separately.
"""
        
        # Generate the analysis using Bob's AI capabilities
        analysis = await context.ai.generate(prompt)
        
        return analysis
        
    except Exception as e:
        return f"Error finding similar code: {str(e)}\n\nPlease try again with a different search pattern."


# Helper function to format search results (can be used by other skills)
def format_search_result(result: Dict[str, Any]) -> str:
    """
    Format a single search result for display.
    
    Args:
        result: Dictionary containing search result data
        
    Returns:
        Formatted string representation of the result
    """
    file_path = result.get("file_path", result.get("path", "unknown"))
    line_num = result.get("line_number", result.get("line", "?"))
    snippet = result.get("snippet", result.get("content", ""))
    
    formatted = f"📄 {file_path}:{line_num}\n"
    if snippet:
        # Clean and indent snippet
        snippet_lines = snippet.strip().split("\n")
        for line in snippet_lines[:3]:  # Show max 3 lines
            formatted += f"   {line}\n"
    
    return formatted


# Metadata for Bob's skill registry
__skill_metadata__ = {
    "name": "find_similar",
    "description": "Locate and explain similar code patterns across the codebase",
    "usage": "@find_similar \"pattern description\"",
    "category": "onboarding",
    "requires_mcp": [],  # Uses Bob's built-in search, no MCP required
    "version": "1.0.0",
    "examples": [
        "@find_similar \"authentication logic\"",
        "@find_similar \"database connection\"",
        "@find_similar \"error handling patterns\"",
        "@find_similar \"async/await usage\""
    ]
}

# Made with Bob
