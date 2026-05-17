"""Bob Skill: Full repo onboarding. Usage: @onboard [path]"""
import subprocess
import sys
from pathlib import Path


async def onboard(repo_path: str = ".", context=None) -> str:
    root = Path(__file__).resolve().parents[2]
    runner = root / "scripts" / "onboard_runner.py"
    proc = subprocess.run(
        [sys.executable, str(runner), "--repo-path", repo_path, "--output-dir", "docs"],
        cwd=str(root),
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return (
            "## Onboarding failed\n\n"
            f"```\n{proc.stderr[-2000:]}\n```\n\n"
            "Check: MCP builds (`cd src/mcp-servers && npm run build`), `.env` watsonx keys."
        )
    onboarding = root / "docs" / "ONBOARDING.md"
    body = onboarding.read_text(encoding="utf-8") if onboarding.exists() else ""
    preview = body[:6000]
    return (
        "## Onboarding complete\n\n"
        "Generated:\n"
        "- `docs/ONBOARDING.md`\n"
        "- `docs/ARCHITECTURE.md`\n"
        "- `docs/WORKFLOWS.md`\n"
        "- `docs/diagrams/*.mmd`\n\n"
        "Export this Bob session to `bob_sessions/02_onboarding/` for judges.\n\n"
        "---\n\n"
        f"{preview}"
    )
