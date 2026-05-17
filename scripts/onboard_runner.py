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
    return 0 if result.get("failed", 1) == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
