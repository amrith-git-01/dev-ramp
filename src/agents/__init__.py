"""
RepoRadar AI Agents Package

This package contains AI agents for analyzing legacy codebases and generating
onboarding documentation using IBM watsonx.ai and MCP servers.
"""

from src.agents.architecture_analyzer import ArchitectureAnalyzer
from src.agents.base_agent import BaseAgent
from src.agents.coordinator import AgentCoordinator, run_analysis
from src.agents.documentation_generator import DocumentationGenerator
from src.agents.hotspot_detector import HotspotDetector
from src.agents.mcp_client import MCPClient, MCPClientManager
from src.agents.workflow_extractor import WorkflowExtractor

__all__ = [
    "BaseAgent",
    "MCPClient",
    "MCPClientManager",
    "ArchitectureAnalyzer",
    "WorkflowExtractor",
    "HotspotDetector",
    "DocumentationGenerator",
    "AgentCoordinator",
    "run_analysis",
]

__version__ = "1.0.0"

# Made with Bob
