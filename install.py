#!/usr/bin/env python3
"""DM Skills Universal Installer

Cross-platform CLI tool to install DM Skills into any supported AI Agent runtime:
Claude Code, OpenAI Codex, Manus, Antigravity, Hermes, OpenCode, or local projects.

Zero external dependencies (pure standard Python 3.8+).

Usage:
    python install.py --list
    python install.py --agent claude
    python install.py --agent codex --skill exact-ui-extraction-transfer
    python install.py --agent antigravity --all
    python install.py --dest ./my-project/.skills
"""
import argparse
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent
MANIFEST_FILE = ROOT / "manifest.json"
PACKAGES_DIR = ROOT / "packages"


def load_manifest() -> dict:
    if not MANIFEST_FILE.is_file():
        sys.exit(f"Error: manifest.json not found at {MANIFEST_FILE}")
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_agent_path(agent_name: str, custom_dest: str | None = None) -> Path:
    if custom_dest:
        return Path(custom_dest).resolve()

    home = Path.home()
    agent_key = agent_name.lower().strip()

    if agent_key in ("claude", "claude-code"):
        return home / ".claude" / "skills"
    elif agent_key in ("codex", "openai-codex"):
        codex_home = os.environ.get("CODEX_HOME")
        return (Path(codex_home) if codex_home else (home / ".codex")) / "skills"
    elif agent_key in ("antigravity", "agy", "gemini"):
        # Antigravity discovers global skills in ~/.gemini/config/skills
        return home / ".gemini" / "config" / "skills"
    elif agent_key in ("hermes",):
        return home / ".hermes" / "skills"
    elif agent_key in ("opencode",):
        return home / ".opencode" / "skills"
    elif agent_key in ("manus",):
        return home / ".manus" / "skills"
    elif agent_key in ("local", "project"):
        return Path.cwd() / ".skills"
    else:
        sys.exit(
            f"Error: Unknown agent '{agent_name}'. Supported agents: "
            "claude, codex, manus, antigravity, hermes, opencode, local (or provide --dest <dir>)."
        )


def install_skill_to_dir(skill_id: str, dest_dir: Path, as_package: bool = False) -> None:
    manifest = load_manifest()
    skill_meta = next((s for s in manifest.get("skills", []) if s["id"] == skill_id), None)
    if not skill_meta:
        sys.exit(f"Error: skill '{skill_id}' not found in manifest.json")

    skill_src_dir = ROOT / skill_meta["path"]
    pkg_file = ROOT / skill_meta.get("package", f"packages/{skill_id}.skill")

    dest_dir.mkdir(parents=True, exist_ok=True)

    if as_package:
        if not pkg_file.is_file():
            sys.exit(f"Error: package {pkg_file} not found. Run python tools/package_skills.py first.")
        dest_pkg = dest_dir / pkg_file.name
        shutil.copy2(pkg_file, dest_pkg)
        print(f"  ✓ Copied package: {dest_pkg}")
    else:
        dest_skill_dir = dest_dir / skill_id
        if dest_skill_dir.exists():
            shutil.rmtree(dest_skill_dir)
        
        # Prefer copying cleanly from source directory
        if skill_src_dir.is_dir():
            shutil.copytree(
                skill_src_dir,
                dest_skill_dir,
                ignore=shutil.ignore_patterns(
                    "__pycache__", "*.pyc", ".git", "packages", "*.skill", "node_modules"
                ),
            )
            print(f"  ✓ Installed folder: {dest_skill_dir}")
        elif pkg_file.is_file():
            # Fallback: extract zip archive
            with zipfile.ZipFile(pkg_file, "r") as z:
                z.extractall(dest_dir)
            print(f"  ✓ Extracted from package: {dest_skill_dir}")
        else:
            sys.exit(f"Error: Cannot find source or package for skill '{skill_id}'")


def list_skills(manifest: dict) -> None:
    print(f"\n⚡ DM Skills Catalog (v{manifest.get('version', '1.0.0')})")
    print(f"{'ID':<30} {'Category':<14} {'Execution Mode':<16} Description")
    print("-" * 105)
    for s in manifest.get("skills", []):
        sid = s["id"]
        cat = s.get("category", "general")
        mode = s.get("execution_mode", "plan-first")
        desc = s.get("description", "").split("\n")[0][:40] + "..."
        print(f"{sid:<30} {cat:<14} {mode:<16} {desc}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Universal DM Skills Installer for AI Agents."
    )
    parser.add_argument(
        "--list", action="store_true", help="List all available skills in the catalog."
    )
    parser.add_argument(
        "--agent",
        help="Target agent platform (claude, codex, manus, antigravity, hermes, opencode, local).",
    )
    parser.add_argument(
        "--dest", help="Custom destination directory to install skills into."
    )
    parser.add_argument(
        "--skill", help="Install a specific skill by its ID (e.g. devops-delivery)."
    )
    parser.add_argument(
        "--all", action="store_true", help="Install all skills in the catalog."
    )
    parser.add_argument(
        "--package",
        action="store_true",
        help="Install as .skill zip archive instead of unpacked directory.",
    )

    args = parser.parse_args()
    manifest = load_manifest()

    if args.list or (len(sys.argv) == 1):
        list_skills(manifest)
        if len(sys.argv) == 1:
            parser.print_help()
        return

    if not args.agent and not args.dest:
        sys.exit("Error: Specify target agent with --agent <name> or a custom directory with --dest <dir>.")

    target_dir = resolve_agent_path(args.agent or "custom", args.dest)
    print(f"\n🎯 Target Installation Directory: {target_dir}")

    skills_to_install = []
    if args.skill:
        skills_to_install = [args.skill]
    elif args.all or args.agent:
        skills_to_install = [s["id"] for s in manifest.get("skills", [])]

    print(f"Installing {len(skills_to_install)} skill(s)...")
    for sid in skills_to_install:
        install_skill_to_dir(sid, target_dir, as_package=args.package)

    print(f"\n🎉 Successfully installed {len(skills_to_install)} skill(s) into {target_dir}!\n")


if __name__ == "__main__":
    main()
