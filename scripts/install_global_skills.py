#!/usr/bin/env python3
"""
Deda Skills - Global Agent Installer
Instala e vincula todas as skills do repositório para ficarem disponíveis
globalmente para todos os agentes de IA (Claude Code, OpenAI Codex, Manus,
Antigravity, Cursor, Hermes, OpenCode e ferramentas locais).
"""

import os
import sys
import json
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"
PACKAGES_DIR = REPO_ROOT / "packages"
MANIFEST_FILE = REPO_ROOT / "manifest.json"

# Diretórios padrão onde agentes de IA procuram por skills
AGENT_TARGET_DIRS = [
    Path.home() / ".agent" / "skills",
    Path.home() / ".claude" / "skills",
    Path.home() / ".codex" / "skills",
    Path.home() / ".cursor" / "skills",
    Path.home() / ".config" / "agents" / "skills",
]

def load_manifest():
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Aviso ao ler manifest.json: {e}")
    return {"skills": []}

def discover_skills():
    skills = []
    if not SKILLS_DIR.exists():
        print(f"Erro: Diretório de skills não encontrado em {SKILLS_DIR}")
        return skills

    for item in sorted(SKILLS_DIR.iterdir()):
        if item.is_dir() and (item / "SKILL.md").exists():
            skill_id = item.name
            skill_md = item / "SKILL.md"
            
            # Lê título e descrição básica se disponível
            desc = ""
            name = skill_id.replace("-", " ").title()
            try:
                content = skill_md.read_text(encoding="utf-8")
                lines = content.splitlines()
                for line in lines[:10]:
                    if line.startswith("name:"):
                        name = line.split("name:", 1)[1].strip().strip('"\'')
                    elif line.startswith("description:"):
                        desc = line.split("description:", 1)[1].strip().strip('"\'')
            except Exception:
                pass

            skills.append({
                "id": skill_id,
                "name": name,
                "description": desc,
                "path": str(item.relative_to(REPO_ROOT)),
                "full_path": str(item),
                "has_skill_md": True,
            })
    return skills

def link_or_copy(src: Path, dst: Path):
    """Cria symlink relativo/absoluto ou copia recursivamente em caso de falha."""
    if dst.exists():
        if dst.is_symlink() or dst.is_file():
            dst.unlink()
        elif dst.is_dir():
            shutil.rmtree(dst)
    try:
        dst.symlink_to(src.resolve(), target_is_directory=True)
        return "symlink"
    except (OSError, NotImplementedError):
        shutil.copytree(src.resolve(), dst)
        return "copy"

def install_cli_helper():
    """Cria o helper CLI 'deda-skills' em ~/.local/bin para execução global no terminal."""
    local_bin = Path.home() / ".local" / "bin"
    local_bin.mkdir(parents=True, exist_ok=True)
    cli_path = local_bin / "deda-skills"

    cli_content = f"""#!/usr/bin/env python3
import sys
import json
from pathlib import Path

REPO = Path("{REPO_ROOT}")
SKILLS_DIR = REPO / "skills"

def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print("Deda Skills CLI - Habilidades de IA Globais")
        print("Comandos:")
        print("  deda-skills list           Listar todas as skills disponíveis")
        print("  deda-skills info <id>      Exibir detalhes e instruções de uma skill")
        print("  deda-skills path <id>      Obter caminho do diretório da skill")
        print("  deda-skills sync           Re-sincronizar skills globalmente")
        return

    cmd = args[0]
    if cmd == "list":
        print("=== Deda Skills Globais Disponíveis ===")
        for d in sorted(SKILLS_DIR.iterdir()):
            if d.is_dir() and (d / "SKILL.md").exists():
                print(f"  • {{d.name:<30}} [{{d / 'SKILL.md'}}]")
    elif cmd == "info" and len(args) > 1:
        target = SKILLS_DIR / args[1] / "SKILL.md"
        if target.exists():
            print(target.read_text(encoding="utf-8"))
        else:
            print(f"Skill '{{args[1]}}' não encontrada em {{SKILLS_DIR}}")
    elif cmd == "path" and len(args) > 1:
        target = SKILLS_DIR / args[1]
        if target.exists():
            print(str(target.resolve()))
        else:
            print(f"Skill '{{args[1]}}' não encontrada")
    elif cmd == "sync":
        import subprocess
        subprocess.run([sys.executable, str(REPO / "scripts" / "install_global_skills.py")])
    else:
        print(f"Comando desconhecido: {{cmd}}. Use 'deda-skills --help'")

if __name__ == "__main__":
    main()
"""
    try:
        cli_path.write_text(cli_content, encoding="utf-8")
        cli_path.chmod(0o755)
        return str(cli_path)
    except Exception as e:
        return f"Não foi possível criar CLI helper: {e}"

def main():
    print("======================================================")
    print(" ⚡ Deda Skills - Ativação Global para Agentes de IA  ")
    print("======================================================")
    print(f"Repositório: {REPO_ROOT}")
    print(f"Diretório de skills: {SKILLS_DIR}\n")

    skills = discover_skills()
    if not skills:
        print("❌ Nenhuma skill encontrada em ./skills/")
        sys.exit(1)

    print(f"✔ Localizadas {len(skills)} skills prontas para ativação:")
    for s in skills:
        print(f"  - {s['id']:<32} ({s['name']})")

    print("\n📦 Vinculando skills aos diretórios globais de agentes...")
    linked_counts = {}

    for target_dir in AGENT_TARGET_DIRS:
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            success_count = 0
            for s in skills:
                src_path = Path(s["full_path"])
                dest_path = target_dir / s["id"]
                method = link_or_copy(src_path, dest_path)
                success_count += 1

            # Cria manifesto local do agente
            agent_manifest = target_dir / "deda-skills-catalog.json"
            with open(agent_manifest, "w", encoding="utf-8") as f:
                json.dump({
                    "version": "1.0.0",
                    "source": str(REPO_ROOT),
                    "skills": skills,
                }, f, indent=2, ensure_ascii=False)

            linked_counts[str(target_dir)] = f"{success_count} skills ({method})"
            print(f"  ✔ {target_dir} -> {success_count} skills ativadas")
        except Exception as e:
            print(f"  ⚠ Não foi possível configurar {target_dir}: {e}")

    # Instala o helper CLI deda-skills
    cli_result = install_cli_helper()
    print(f"\n🚀 Helper CLI global: {cli_result}")

    print("\n======================================================")
    print(" 🎉 TODAS AS SKILLS ESTÃO ATIVAS GLOBALMENTE!         ")
    print("======================================================")
    print("Agora qualquer agente (Claude Code, Codex, Manus, etc.)")
    print("pode referenciar e ler diretamente as instruções de:")
    for s in skills:
        print(f"  • {s['id']}")
    print("\nPara verificar a qualquer momento no terminal, execute:")
    print("  deda-skills list")
    print("======================================================\n")

if __name__ == "__main__":
    main()
