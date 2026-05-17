# Bob Onboarding + Mermaid Diagrams — Design Spec

**Status:** Approved (sections 1–4; section 5 auto-sync deferred)  
**Date:** 2026-05-17  
**Scope:** Bob-only trigger; no React dashboard; no git-hook/CI doc refresh in v1

---

## 1. Goals & Non-Goals

### Goals

- Single Bob entry point: user says **"onboard me"** or **`@onboard`** in Onboarding Assistant mode.
- Run parallel analysis (architecture, workflows, git hotspots) then sequential doc assembly.
- Every analysis step produces **Mermaid** diagrams embedded in markdown.
- Persist judge-friendly artifacts under `docs/` and manual exports under `bob_sessions/`.
- Reuse existing MCP servers and Python agents; minimize new infrastructure.

### Non-Goals (v1)

- React dashboard
- watsonx Orchestrate cloud runtime as execution engine
- New `workflow-extractor` or `diagram-generator` MCP servers
- Auto-regenerate docs on every commit (section 5 — future)
- CLI-first demo flow (`run_analysis.py` not in README demo path)

---

## 2. Architecture

```
User → Bob (Onboarding Assistant mode)
         → @onboard skill
              → onboard_runner.py (imports AgentCoordinator)
                   → [parallel] ArchitectureAnalyzer | WorkflowExtractor | HotspotDetector
                   → [sequential] DocumentationGenerator
              → writes docs/ONBOARDING.md, docs/ARCHITECTURE.md, docs/WORKFLOWS.md, docs/diagrams/*.mmd
         → skill returns summary + key Mermaid blocks for Bob chat rendering
```

| Component                     | Responsibility                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| **Onboarding Assistant mode** | UX, MCP enablement, newcomer instructions                               |
| **`@onboard` skill**          | Bob-visible trigger; invokes runner; formats chat response              |
| **`onboard_runner.py`**       | Non-interactive orchestration (same logic as coordinator, Bob-callable) |
| **`AgentCoordinator`**        | Parallel then sequential execution (existing)                           |
| **Agents**                    | MCP gather + watsonx prompts returning Mermaid + markdown               |
| **MCPs**                      | `code-analyzer`, `git-analyzer`, `documentation-generator`              |
| **`bob_sessions/`**           | Manual export after demo (documented, not automated)                    |

**Orchestrator:** `AgentCoordinator` in Python — not a fifth LLM agent. watsonx Orchestrate YAML remains the contract/spec only.

---

## 3. Bob "Onboard Me" Flow

1. User: `onboard me` or `@onboard [optional repo path]`
2. Skill prints progress stages (returned as Bob message):
   - Phase 1/3: Architecture (MCP + Granite)
   - Phase 2/3: Workflows
   - Phase 3/3: Git hotspots
   - Phase 4/4: Documentation assembly
3. Skill embeds in response:
   - C4/context Mermaid from architecture
   - One workflow sequence diagram
   - Hotspot diagram summary
4. Skill reports file paths:
   - `docs/ONBOARDING.md` (primary)
   - `docs/ARCHITECTURE.md`, `docs/WORKFLOWS.md`
   - `docs/diagrams/*.mmd`

**MCP registration:** Project template `.bob/mcp_servers.example.json`; developer copies to global `%APPDATA%\.bob\mcp_servers.json` (Windows) per `docs/MCP_SETUP.md`.

**Onboarding mode MCPs (all enabled):** `code-analyzer`, `git-analyzer`, `documentation-generator`.

---

## 4. Agent & Diagram Contracts

### 4.1 Architecture Analyzer

**MCP:** `analyze_structure`, `find_entry_points`, `analyze_dependencies`, `get_complexity_metrics`

**watsonx output (JSON parsed from response):**

```json
{
  "pattern": "MVC",
  "components": [{ "id": "api", "name": "API Layer" }],
  "tech_stack": ["Python", "FastAPI"],
  "diagrams": {
    "c4_context": "graph TB\n  ...",
    "request_flow": "flowchart LR\n  ...",
    "dependency_graph": "graph LR\n  ..."
  },
  "summary_markdown": "..."
}
```

**Files written:**

- `docs/ARCHITECTURE.md` — summary + embedded fenced Mermaid
- `docs/diagrams/architecture-c4.mmd`, `architecture-flow.mmd`, `dependency-graph.mmd`

### 4.2 Workflow Extractor

**Inputs:** Workflow config files (existing discovery) + architecture entry points from context

**watsonx output:**

```json
{
  "workflows": [
    {
      "name": "Adding a new endpoint",
      "steps": ["..."],
      "diagrams": {
        "sequence": "sequenceDiagram\n  ..."
      }
    }
  ]
}
```

**Files written:**

- `docs/WORKFLOWS.md` — one section per workflow with embedded sequence Mermaid
- `docs/diagrams/workflow-<slug>.mmd`

### 4.3 Git Miner (Hotspot Detector)

**MCP:** `get_hotspot_files`, `get_contributors`, `get_file_history` (existing HotspotDetector)

**watsonx output:**

```json
{
  "hotspots": [{ "file": "src/x.py", "risk": "high", "advice": "..." }],
  "diagrams": {
    "heatmap": "graph TB\n  ...",
    "timeline": "timeline\n  ..."
  }
}
```

Use Mermaid `graph` or `gitgraph`/`timeline` syntax that renders on GitHub; avoid exotic types that fail rendering.

**Files written:**

- Section appended to architecture context for doc agent
- `docs/diagrams/hotspot-map.mmd`

### 4.4 Documentation Generator

**Inputs:** Prior agent JSON + diagram strings from context

**Output:** `docs/ONBOARDING.md` with sections:

1. Welcome / overview
2. Architecture (embed `c4_context`, `request_flow`)
3. Setup guide
4. Common workflows (embed sequence diagrams)
5. Code hotspots (embed heatmap)
6. First-week checklist

Also retain split files: `docs/ARCHITECTURE.md`, `docs/WORKFLOWS.md` (not only `docs/onboarding/` placeholders).

### 4.5 Diagram Storage

- **Primary:** Embedded in markdown (Option 1 from architecture doc).
- **Secondary:** Copy raw Mermaid to `docs/diagrams/*.mmd` for reuse and git diff clarity.
- **Optional manifest:** `generated/analysis.json` with commit-less metadata (`generated_at`, `repo_path`, agent summaries, diagram paths) for future incremental sync.

---

## 5. Reuse vs Build

| Reuse                                                           | Change                                       |
| --------------------------------------------------------------- | -------------------------------------------- |
| `code-analyzer`, `git-analyzer`, `documentation-generator` MCPs | Register in Bob; build all three             |
| `AgentCoordinator`, four Python agents                          | Mermaid JSON prompts; new output paths       |
| `.bob/modes/onboarding-assistant.json`                          | Add `documentation-generator` MCP            |
| `explain_module`, `find_similar` skills                         | Keep for post-onboard Q&A                    |
| `docs/MCP_SETUP.md`                                             | Add documentation-generator + example config |

| Build new                                                                    |
| ---------------------------------------------------------------------------- |
| `.bob/skills/onboard.py`                                                     |
| `scripts/onboard_runner.py`                                                  |
| `src/agents/diagram_utils.py` — parse JSON, write `.mmd`, wrap fenced blocks |
| `docs/diagrams/.gitkeep`, `bob_sessions/README.md`                           |
| `.bob/mcp_servers.example.json`                                              |

| Deferred                                       |
| ---------------------------------------------- |
| Section 5: commit/CI auto-sync                 |
| `workflow-extractor`, `diagram-generator` MCPs |
| Orchestrate runtime migration                  |

---

## 6. Error Handling

| Failure                             | Behavior                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| MCP server unreachable              | Skill returns clear error; lists which server failed; suggests `npm run build` in `src/mcp-servers`     |
| watsonx invalid/missing credentials | Fail fast with `.env` instructions                                                                      |
| JSON parse failure from LLM         | Retry once with "return valid JSON only"; fallback: markdown without diagrams + warning in Bob response |
| Empty git repo                      | Hotspot agent skips git MCP calls; notes in docs                                                        |
| Partial agent failure               | Coordinator continues; doc agent marks missing sections as "Unavailable"                                |

---

## 7. Testing & Demo

**Automated:**

- Unit tests for `diagram_utils.py` (JSON extract, `.mmd` write, fence embed)
- Integration test: `onboard_runner` against `test_repo` with mocked watsonx (or skip if no credentials in CI)

**Manual demo checklist:**

1. Build MCP servers
2. Configure global Bob MCP JSON from example
3. Open Onboarding mode → `@onboard`
4. Verify Mermaid renders in Bob chat and `docs/ONBOARDING.md` on GitHub
5. Export session to `bob_sessions/02_onboarding/`

---

## 8. Success Criteria

- [ ] `@onboard` completes against `test_repo` without CLI
- [ ] `docs/ONBOARDING.md` contains ≥3 rendered Mermaid blocks
- [ ] `docs/diagrams/` contains matching `.mmd` files
- [ ] Bob mode lists all three MCP servers enabled
- [ ] README demo section describes Bob-only flow (no dashboard)
