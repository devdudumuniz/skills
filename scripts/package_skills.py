#!/usr/bin/env python3
"""
DM Skills - Packager
Compacta os diretórios de ./skills/ em arquivos portáteis .skill em ./packages/
"""

import os
import sys
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
PACKAGES_DIR = REPO_ROOT / "packages"

def package_all():
    PACKAGES_DIR.mkdir(parents=True, exist_ok=True)
    if not SKILLS_DIR.exists():
        print(f"Diretório {SKILLS_DIR} não encontrado.")
        sys.exit(1)

    count = 0
    for skill_folder in sorted(SKILLS_DIR.iterdir()):
        if skill_folder.is_dir() and (skill_folder / "SKILL.md").exists():
            pkg_path = PACKAGES_DIR / f"{skill_folder.name}.skill"
            print(f"Empacotando {skill_folder.name} -> {pkg_path.name}...")
            
            with zipfile.ZipFile(pkg_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(skill_folder):
                    for file in files:
                        full_path = Path(root) / file
                        rel_path = full_path.relative_to(skill_folder)
                        zf.write(full_path, arcname=str(rel_path))
            count += 1

    print(f"\n✔ {count} skills empacotadas com sucesso em {PACKAGES_DIR}!")

if __name__ == "__main__":
    package_all()
