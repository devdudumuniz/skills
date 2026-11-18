# Contributing to Deda Skills

We welcome contributions to expand the **Deda Skills** catalog with high-quality, production-ready AI agent capabilities.

---

## Skill Architecture Principles

Every skill in this repository must follow strict production engineering guidelines:

1. **Open Standard Specification**:
   - Each skill resides in its own top-level directory (`<skill-name>/`).
   - Must contain a root `SKILL.md` with standard YAML frontmatter:
     ```yaml
     ---
     name: <kebab-case-name>
     description: <Detailed description of trigger conditions, objectives, and limitations>
     ---
     ```
2. **Plan-First & Read-Only Defaults**:
   - Destructive operations, external network mutations, production deploys, and firewall alterations **must never run automatically**.
   - The skill must produce a plan, verify prerequisites, and request explicit confirmation.
3. **Zero Secrets & Pure Generalization**:
   - Never commit API keys, personal credentials, private hostnames, or machine-specific absolute paths.
   - Use environment variables or reference-based secret injection.
4. **Self-Contained & Deterministic**:
   - Auxiliary code must go in `scripts/`, templates in `templates/`, and guides in `references/`.
   - Python dependencies must be minimal (standard library preferred) and explicitly declared.

---

## Adding a New Skill

1. Create `<your-skill-name>/SKILL.md`.
2. Add reference materials or scripts:
   ```text
   <your-skill-name>/
   ├── SKILL.md
   ├── references/
   └── scripts/
   ```
3. Register the skill in `manifest.json`.
4. Bundle distribution packages:
   ```bash
   python tools/package_skills.py --skill <your-skill-name>
   ```
5. Test installation:
   ```bash
   python install.py --dest ./test-dir --skill <your-skill-name>
   ```
