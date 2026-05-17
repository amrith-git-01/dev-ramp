import json
import re
from pathlib import Path
from typing import Any, Dict


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
