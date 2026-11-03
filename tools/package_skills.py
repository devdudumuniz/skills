#!/usr/bin/env python3
"""Build and bundle .skill packages for all skills in the repository.

Usage:
    python tools/package_skills.py [--skill <name>] [--clean]
"""
import argparse
import os
import sys
import zipfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_DIR = ROOT / "packages"

IGNORE_DIRS = {
    "__pycache__",
    ".pytest_cache",
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "dist",
    "build",
    "packages",
    "tools",
    "assets",
    ".idea",
    ".vscode"
}

IGNORE_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".skill",
    ".DS_Store",
    ".log"
}


def should_include(rel_path: Path) -> bool:
    for part in rel_path.parts:
        if part in IGNORE_DIRS:
            return False
    if rel_path.suffix.lower() in IGNORE_EXTENSIONS:
        return False
    return True


def package_skill(skill_dir: Path, out_dir: Path) -> Path:
    skill_name = skill_dir.name
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{skill_name}.skill"

    # We also check if <skill_dir>/packages exists
    skill_local_pkg_dir = skill_dir / "packages"

    print(f"📦 Packaging {skill_name} -> {out_file.name}...")
    file_count = 0

    with zipfile.ZipFile(out_file, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path in sorted(skill_dir.rglob("*")):
            if not file_path.is_file():
                continue
            rel_to_skill = file_path.relative_to(skill_dir)
            if not should_include(rel_to_skill):
                continue
            
            archive_name = f"{skill_name}/{rel_to_skill.as_posix()}"
            zf.write(file_path, arcname=archive_name)
            file_count += 1

    # If the skill directory already had a local packages/ folder, mirror it there
    if skill_local_pkg_dir.is_dir():
        import shutil
        local_dest = skill_local_pkg_dir / f"{skill_name}.skill"
        shutil.copy2(out_file, local_dest)
        print(f"   ↳ Mirrored to {skill_dir.name}/packages/{skill_name}.skill")

    print(f"   ✓ {file_count} files bundled ({out_file.stat().st_size:,} bytes)")
    return out_file


def main():
    parser = argparse.ArgumentParser(description="Package skills into .skill archives.")
    parser.add_argument("--skill", help="Package a single skill by name.")
    args = parser.parse_args()

    PACKAGES_DIR.mkdir(parents=True, exist_ok=True)

    if args.skill:
        target = ROOT / args.skill
        if not target.is_dir() or not (target / "SKILL.md").is_file():
            sys.exit(f"Error: skill '{args.skill}' not found or missing SKILL.md.")
        skills = [target]
    else:
        skills = [
            d for d in sorted(ROOT.iterdir())
            if d.is_dir() and (d / "SKILL.md").is_file() and d.name not in IGNORE_DIRS
        ]

    print(f"Found {len(skills)} skill(s) to package:")
    for s in skills:
        package_skill(s, PACKAGES_DIR)

    print("\n✅ All packages built successfully in packages/!")


if __name__ == "__main__":
    main()
