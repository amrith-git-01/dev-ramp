# Bob Onboarding + Mermaid Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Bob-only "onboard me" flow that runs the existing agent pipeline, generates Mermaid diagrams, and writes `docs/ONBOARDING.md` plus supporting artifacts.

**Architecture:** `@onboard` Bob skill calls `scripts/onboard_runner.py`, which uses `AgentCoordinator` (parallel arch/workflow/hotspot, sequential docs). Agents return structured JSON with Mermaid; `diagram_utils.py` persists `.mmd` files and embeds fences in markdown.

**Tech Stack:** Python 3.9+, IBM watsonx.ai, Node MCP servers (TypeScript), Bob IDE skills/modes

**Spec:** `docs/superpowers/specs/2026-05-17-bob-onboarding-diagrams-design.md`

---

## File Map

| File                                    | Responsibility                                     |
| --------------------------------------- | -------------------------------------------------- |
| `src/agents/diagram_utils.py`           | Parse LLM JSON, write `.mmd`, embed fenced Mermaid |
| `src/agents/architecture_analyzer.py`   | Mermaid JSON contract + `docs/ARCHITECTURE.md`     |
| `src/agents/workflow_extractor.py`      | Sequence diagrams + `docs/WORKFLOWS.md`            |
| `src/agents/hotspot_detector.py`        | Hotspot diagrams + diagram files                   |
| `src/agents/documentation_generator.py` | `docs/ONBOARDING.md` assembly                      |
| `src/agents/coordinator.py`             | Default `output_dir` → `docs` root paths           |
| `scripts/onboard_runner.py`             | CLI entry for Bob skill (no user-facing demo CLI)  |
| `.bob/skills/onboard.py`                | Bob `@onboard` skill                               |
| `.bob/modes/onboarding-assistant.json`  | Enable `documentation-generator` MCP               |
| `.bob/mcp_servers.example.json`         | Template for global Bob registration               |
| `bob_sessions/README.md`                | Demo export instructions                           |
| `tests/test_diagram_utils.py`           | Unit tests                                         |
| `docs/MCP_SETUP.md`                     | Update for third MCP + onboard flow                |

---

### Task 1: Diagram utilities

**Files:**

- Create: `src/agents/diagram_utils.py`
- Create: `tests/test_diagram_utils.py`

- [ ] **Step 1: Write the failing test**

````python
# tests/test_diagram_utils.py
import json
from pathlib import Path

from src.agents.diagram_utils import (
    extract_json_from_llm_text,
    write_mermaid_file,
    embed_mermaid_in_markdown,
)


def test_extract_json_from_llm_text_strips_fences():
    text = '```json\n{"diagrams": {"a": "graph TB\\n  A-->B"}}\n```'
    data = extract_json_from_llm_text(text)
    assert data["diagrams"]["a"].startswith("graph TB")


def test_write_mermaid_file_creates_file(tmp_path: Path):
    path = write_mermaid_file(tmp_path, "arch", "graph TB\n  A-->B")
    assert path.exists()
    assert path.read_text(encoding="utf-8").startswith("graph TB")


def test_embed_mermaid_in_markdown():
    md = embed_mermaid_in_markdown("Title", "graph TB\n  A-->B", heading_level=2)
    assert "## Title" in md
    assert "```mermaid" in md
    assert "A-->B" in md
````

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_diagram_utils.py -v`  
Expected: FAIL — `ModuleNotFoundError: diagram_utils`

- [ ] **Step 3: Implement minimal module**

````python
# src/agents/diagram_utils.py
import json
import re
from pathlib import Path
from typing import Any, Dict, Optional


def extract_json_from_llm_text(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


def write_mermaid_file(output_dir: Path, name: str, mermaid_code: str) -> Path:
    diagrams_dir = output_dir / "diagrams"
    diagrams_dir.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "-", name).strip("-").lower() or "diagram"
    path = diagrams_dir / f"{safe}.mmd"
    path.write_text(mermaid_code.strip() + "\n", encoding="utf-8")
    return path


def embed_mermaid_in_markdown(
    title: str, mermaid_code: str, heading_level: int = 2
) -> str:
    hashes = "#" * heading_level
    return (
        f"{hashes} {title}\n\n"
        f"```mermaid\n{mermaid_code.strip()}\n```\n"
    )


def persist_diagrams(
    output_dir: Path,
    diagrams: Dict[str, str],
    prefix: str = "",
) -> Dict[str, Path]:
    written: Dict[str, Path] = {}
    for key, code in diagrams.items():
        if not code or not str(code).strip():
            continue
        name = f"{prefix}-{key}" if prefix else key
        written[key] = write_mermaid_file(output_dir, name, str(code))
    return written
````

- [ ] **Step 4: Run tests**

Run: `python -m pytest tests/test_diagram_utils.py -v`  
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/agents/diagram_utils.py tests/test_diagram_utils.py
git commit -m "feat: add diagram utils for Mermaid persistence"
```

---

### Task 2: Architecture analyzer — Mermaid JSON

**Files:**

- Modify: `src/agents/architecture_analyzer.py`
- Test: `tests/test_diagram_utils.py` (no new file; manual verify)

- [ ] **Step 1: Update prompt in `_generate_architecture_report`**

Replace the prompt tail with explicit JSON-only instructions:

```python
        prompt = self.format_prompt(
            """You are a senior software architect. Return ONLY valid JSON (no prose).

## Data
Structure: {structure}
Entry points: {entry_points}
Dependencies: {dependencies}
Complexity: {complexity}

## Required JSON shape
{{
  "pattern": "e.g. MVC, microservices, layered",
  "components": [{{"id": "api", "name": "API Layer"}}],
  "tech_stack": ["language", "framework"],
  "summary_markdown": "2-3 paragraphs",
  "diagrams": {{
    "c4_context": "graph TB\\n  User[User] --> System[System]",
    "request_flow": "flowchart LR\\n  Client --> API --> DB[(Database)]",
    "dependency_graph": "graph LR\\n  ..."
  }}
}}

Use valid Mermaid syntax. Escape newlines as \\n in JSON strings."""
        )
```

- [ ] **Step 2: Parse JSON and write architecture docs**

After `architecture_report = await self._generate_architecture_report(...)`:

```python
        from src.agents.diagram_utils import (
            extract_json_from_llm_text,
            persist_diagrams,
            embed_mermaid_in_markdown,
        )

        docs_root = output_dir.parent if output_dir.name == "onboarding" else output_dir
        arch_data = extract_json_from_llm_text(architecture_report)
        diagrams = arch_data.get("diagrams", {})
        persist_diagrams(docs_root, diagrams, prefix="architecture")

        arch_md_parts = [
            "# Architecture\n\n",
            arch_data.get("summary_markdown", ""),
            "\n\n",
        ]
        for title, key in [
            ("System Context", "c4_context"),
            ("Request Flow", "request_flow"),
            ("Dependencies", "dependency_graph"),
        ]:
            if diagrams.get(key):
                arch_md_parts.append(
                    embed_mermaid_in_markdown(title, diagrams[key])
                )
        arch_path = docs_root / "ARCHITECTURE.md"
        arch_path.write_text("".join(arch_md_parts), encoding="utf-8")
```

Return `arch_data` in the result dict under key `parsed`.

- [ ] **Step 3: Run against test_repo (requires .env)**

Run: `python -c "import asyncio; from src.agents.coordinator import run_analysis; asyncio.run(run_analysis('test_repo', agents=['architecture']))"`  
Expected: `docs/ARCHITECTURE.md` exists with ` ```mermaid ` blocks

- [ ] **Step 4: Commit**

```bash
git add src/agents/architecture_analyzer.py
git commit -m "feat: architecture agent emits Mermaid JSON and ARCHITECTURE.md"
```

---

### Task 3: Workflow extractor — sequence diagrams

**Files:**

- Modify: `src/agents/workflow_extractor.py`

- [ ] **Step 1: Update watsonx prompt to require JSON**

Append to workflow generation prompt:

```python
Return ONLY JSON:
{
  "workflows": [
    {
      "name": "Workflow name",
      "steps": ["step 1", "step 2"],
      "diagrams": { "sequence": "sequenceDiagram\\n  Client->>API: request" }
    }
  ]
}
```

- [ ] **Step 2: Write `docs/WORKFLOWS.md`**

```python
        from src.agents.diagram_utils import (
            extract_json_from_llm_text,
            embed_mermaid_in_markdown,
            write_mermaid_file,
        )

        docs_root = output_dir.parent if output_dir.name == "onboarding" else output_dir
        data = extract_json_from_llm_text(workflow_report)
        lines = ["# Workflows\n\n"]
        for i, wf in enumerate(data.get("workflows", [])):
            lines.append(f"## {wf.get('name', 'Workflow')}\n\n")
            for step in wf.get("steps", []):
                lines.append(f"- {step}\n")
            seq = wf.get("diagrams", {}).get("sequence")
            if seq:
                slug = re.sub(r"[^a-z0-9]+", "-", wf["name"].lower()).strip("-")
                write_mermaid_file(docs_root, f"workflow-{slug}", seq)
                lines.append("\n")
                lines.append(embed_mermaid_in_markdown("Sequence", seq, heading_level=3))
            lines.append("\n")
        (docs_root / "WORKFLOWS.md").write_text("".join(lines), encoding="utf-8")
```

- [ ] **Step 3: Verify**

Run architecture + workflow agents on `test_repo`; confirm `docs/WORKFLOWS.md`.

- [ ] **Step 4: Commit**

```bash
git add src/agents/workflow_extractor.py
git commit -m "feat: workflow agent writes sequence Mermaid to WORKFLOWS.md"
```

---

### Task 4: Hotspot detector — git diagrams

**Files:**

- Modify: `src/agents/hotspot_detector.py`

- [ ] **Step 1: Extend LLM prompt for JSON with `diagrams.heatmap` and `diagrams.timeline`**

- [ ] **Step 2: Persist `docs/diagrams/hotspot-map.mmd` via `persist_diagrams`**

- [ ] **Step 3: Include parsed hotspot JSON in agent return for doc generator context**

- [ ] **Step 4: Commit**

```bash
git add src/agents/hotspot_detector.py
git commit -m "feat: hotspot agent emits Mermaid heatmap and timeline"
```

---

### Task 5: Documentation generator — `docs/ONBOARDING.md`

**Files:**

- Modify: `src/agents/documentation_generator.py`

- [ ] **Step 1: Change default output to repo `docs/` root**

Use `docs_root = Path(context.get('output_dir', 'docs'))` and write `docs_root / "ONBOARDING.md"`.

- [ ] **Step 2: Update `_generate_onboarding_guide` prompt**

Pass embedded diagram strings from `architecture_result`, `workflow_result`, `hotspot_result` parsed JSON. Instruct model to **preserve** provided Mermaid fences verbatim in sections 2, 4, 5.

- [ ] **Step 3: Post-process: ensure at least one mermaid block per section**

If LLM omits fences, inject from `diagram_utils.embed_mermaid_in_markdown` using parsed agent data.

- [ ] **Step 4: Verify full pipeline**

Run: `python scripts/onboard_runner.py --repo-path test_repo`  
Expected: `docs/ONBOARDING.md`, `docs/ARCHITECTURE.md`, `docs/WORKFLOWS.md`

- [ ] **Step 5: Commit**

```bash
git add src/agents/documentation_generator.py
git commit -m "feat: generate ONBOARDING.md with embedded Mermaid"
```

---

### Task 6: Onboard runner script

**Files:**

- Create: `scripts/onboard_runner.py`
- Modify: `src/agents/coordinator.py` (default `output_dir='docs'`)

- [ ] **Step 1: Create runner**

```python
#!/usr/bin/env python3
"""Bob-callable onboarding pipeline. Not the hackathon user demo path."""
import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.agents.coordinator import run_analysis


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-path", default=".")
    parser.add_argument("--output-dir", default="docs")
    args = parser.parse_args()
    result = asyncio.run(
        run_analysis(
            repo_path=args.repo_path,
            output_dir=args.output_dir,
            parallel=True,
        )
    )
    manifest = ROOT / "generated" / "analysis.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps(result, indent=2, default=str), encoding="utf-8")
    print("ONBOARDING_COMPLETE")
    print(str(ROOT / "docs" / "ONBOARDING.md"))
    return 0 if result.get("summary", {}).get("failed", 1) == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Set coordinator default `output_dir` to `docs`**

In `AgentCoordinator.__init__`, change default from `docs/onboarding` to `docs`.

- [ ] **Step 3: Run**

Run: `python scripts/onboard_runner.py --repo-path test_repo`  
Expected: `generated/analysis.json` and onboarding markdown files

- [ ] **Step 4: Commit**

```bash
git add scripts/onboard_runner.py src/agents/coordinator.py generated/.gitkeep
git commit -m "feat: add onboard_runner for Bob skill orchestration"
```

---

### Task 7: Bob `@onboard` skill

**Files:**

- Create: `.bob/skills/onboard.py`

- [ ] **Step 1: Implement skill**

````python
"""Bob Skill: Full repo onboarding. Usage: @onboard [path]"""
import asyncio
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
````

- [ ] **Step 2: Manual test in Bob**

Bob Onboarding mode → `@onboard test_repo` → verify response contains Mermaid fences.

- [ ] **Step 3: Commit**

```bash
git add .bob/skills/onboard.py
git commit -m "feat: add @onboard Bob skill"
```

---

### Task 8: Bob mode & MCP template

**Files:**

- Modify: `.bob/modes/onboarding-assistant.json`
- Create: `.bob/mcp_servers.example.json`
- Modify: `docs/MCP_SETUP.md`

- [ ] **Step 1: Add documentation-generator to mode JSON**

```json
    "documentation-generator": {
      "enabled": true
    }
```

- [ ] **Step 2: Create example MCP config**

```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "node",
      "args": [
        "REPLACE_WITH_REPO_ROOT/src/mcp-servers/code-analyzer/build/server.js"
      ],
      "env": { "REPO_PATH": "REPLACE_WITH_TARGET_REPO" }
    },
    "git-analyzer": {
      "command": "node",
      "args": [
        "REPLACE_WITH_REPO_ROOT/src/mcp-servers/git-analyzer/build/server.js"
      ],
      "env": { "REPO_PATH": "REPLACE_WITH_TARGET_REPO" }
    },
    "documentation-generator": {
      "command": "node",
      "args": [
        "REPLACE_WITH_REPO_ROOT/src/mcp-servers/documentation-generator/build/server.js"
      ],
      "env": {
        "REPO_PATH": "REPLACE_WITH_TARGET_REPO",
        "OUTPUT_DIR": "REPLACE_WITH_REPO_ROOT/docs"
      }
    }
  }
}
```

- [ ] **Step 3: Update MCP_SETUP.md** with third server + copy-to-global instructions

- [ ] **Step 4: Commit**

```bash
git add .bob/modes/onboarding-assistant.json .bob/mcp_servers.example.json docs/MCP_SETUP.md
git commit -m "docs: wire documentation-generator MCP for Bob onboarding"
```

---

### Task 9: Demo artifacts & README

**Files:**

- Create: `bob_sessions/README.md`
- Create: `docs/diagrams/.gitkeep`
- Modify: `README.md`

- [ ] **Step 1: Add `bob_sessions/README.md`**

Document manual export steps for sessions `01_architecture` and `02_onboarding` (task_history.md + screenshots).

- [ ] **Step 2: Add Bob-only demo section to README**

Replace dashboard-first instructions with:

1. Build MCPs
2. Copy `.bob/mcp_servers.example.json` → global Bob config
3. Open Onboarding Assistant → `onboard me`
4. Open `docs/ONBOARDING.md` on GitHub

- [ ] **Step 3: Commit**

```bash
git add bob_sessions/README.md docs/diagrams/.gitkeep README.md
git commit -m "docs: Bob-only onboarding demo flow"
```

---

### Task 10: Coordinator context wiring

**Files:**

- Modify: `src/agents/coordinator.py`

- [ ] **Step 1: Ensure parallel run passes `architecture_result` keys into doc agent context**

After parallel block, set:

```python
        for key in ("architecture", "workflow", "hotspot"):
            if key in self.results and self.results[key].get("status") == "success":
                context[f"{key}_result"] = self.results[key].get("result", {})
```

- [ ] **Step 2: Run full parallel pipeline on test_repo**

Run: `python scripts/onboard_runner.py --repo-path test_repo`  
Expected: all docs present; `generated/analysis.json` lists agents succeeded

- [ ] **Step 3: Commit**

```bash
git add src/agents/coordinator.py
git commit -m "fix: pass agent results to documentation generator"
```

---

## Plan Self-Review (spec coverage)

| Spec requirement              | Task                                                  |
| ----------------------------- | ----------------------------------------------------- |
| Bob-only `@onboard`           | 7                                                     |
| Mermaid in all agents         | 2, 3, 4, 5                                            |
| `docs/ONBOARDING.md` + splits | 5                                                     |
| `docs/diagrams/*.mmd`         | 1, 2–4                                                |
| Three MCPs in Bob mode        | 8                                                     |
| `bob_sessions` demo docs      | 9                                                     |
| Error handling (JSON retry)   | 2 (add try/except + retry in base_agent or per agent) |
| `generated/analysis.json`     | 6                                                     |
| Section 5 auto-sync           | Deferred ✓                                            |

**Gap to add during Task 2:** Wrap `extract_json_from_llm_text` in try/except; on failure call `_generate_architecture_report` once more with suffix `"Return ONLY raw JSON, no markdown fences."`

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-bob-onboarding-diagrams.md`.

Spec saved to `docs/superpowers/specs/2026-05-17-bob-onboarding-diagrams-design.md` — review and confirm before implementation.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — run tasks in this session with checkpoints

Which approach do you want?
