#!/usr/bin/env python3
"""
Agent Profile Builder — Static Deterministic Profile Validator (Deda Skills)

Valida contratos JSON de perfil de agente sem dependencias externas (Python stdlib),
verificando campos obrigatorios, invariantes de seguranca deny-by-default,
isolamento de memoria, ciclo de execucao e ausencia de segredos hardcoded.

Uso:
  python3 validate_profile.py <caminho/para/agent-profile.json>
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, List, Tuple

REQUIRED_TOP_LEVEL_FIELDS = (
    "schema_version",
    "id",
    "name",
    "role",
    "mission",
    "tone",
    "model",
    "permissions",
    "tools",
    "memory",
    "execution_loop",
    "acceptance_criteria",
)

REQUIRED_LOOP_STAGES = ("request", "plan", "tool", "verify", "respond")
VALID_TRANSPORTS = {"api", "cli", "mcp"}
VALID_CREDENTIAL_SOURCES = {"env_ref", "none"}
VALID_MEMORY_SCOPES = {"user-tenant-isolated", "tenant-isolated", "user-isolated"}

SECRET_PATTERNS = (
    ("OpenAI/API key literal", re.compile(r"\bsk-[A-Za-z0-9_\-]{12,}\b")),
    ("GitHub token literal", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}\b")),
    ("Google API key literal", re.compile(r"\bAIza[0-9A-Za-z\-_]{20,}\b")),
    ("Slack token literal", re.compile(r"\bxox[baprs]-[A-Za-z0-9\-]{10,}\b")),
    ("AWS Access Key literal", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Bearer token literal", re.compile(r"\bBearer\s+[A-Za-z0-9\-_\.=]{12,}", re.IGNORECASE)),
    ("Private key block", re.compile(r"-----BEGIN\s+[A-Z ]*PRIVATE KEY-----")),
    ("Credentials embedded in URL", re.compile(r"https?://[^\s/@:]+:[^\s/@]+@")),
)

SUSPICIOUS_SECRET_KEY_NAMES = {
    "api_key",
    "apikey",
    "secret",
    "secret_key",
    "password",
    "passwd",
    "access_token",
    "refresh_token",
    "private_key",
    "client_secret",
    "auth_token",
}


def _scan_for_secrets(value: Any, path: str, errors: List[str]) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            child_path = f"{path}.{key}" if path else str(key)
            key_lower = str(key).strip().lower()
            if key_lower in SUSPICIOUS_SECRET_KEY_NAMES and isinstance(item, str) and item.strip():
                errors.append(
                    f"Segredo potencial proibido no campo '{child_path}': "
                    "credenciais nunca devem residir no JSON de perfil."
                )
            _scan_for_secrets(item, child_path, errors)
    elif isinstance(value, list):
        for idx, item in enumerate(value):
            _scan_for_secrets(item, f"{path}[{idx}]", errors)
    elif isinstance(value, str):
        for label, pattern in SECRET_PATTERNS:
            if pattern.search(value):
                errors.append(
                    f"Detectado {label} em '{path}': remova credenciais literais e use referencia de ambiente."
                )


def validate_profile_data(data: Any) -> Tuple[bool, List[str]]:
    errors: List[str] = []

    if not isinstance(data, dict):
        return False, ["O arquivo de perfil deve conter um objeto JSON na raiz."]

    for field in REQUIRED_TOP_LEVEL_FIELDS:
        if field not in data:
            errors.append(f"Campo obrigatorio ausente: '{field}'.")

    for str_field in ("schema_version", "id", "name", "role", "mission", "tone"):
        val = data.get(str_field)
        if str_field in data and (not isinstance(val, str) or not val.strip()):
            errors.append(f"Campo '{str_field}' deve ser uma string nao vazia.")

    profile_id = data.get("id")
    if isinstance(profile_id, str) and profile_id.strip():
        if not re.match(r"^[a-z0-9][a-z0-9\-]{1,62}[a-z0-9]$", profile_id):
            errors.append(
                "Campo 'id' deve usar kebab-case minusculo (3-64 caracteres, ex: 'support-triage-agent')."
            )

    # Model section
    model = data.get("model")
    if isinstance(model, dict):
        for req in ("provider", "model_id"):
            if not isinstance(model.get(req), str) or not model[req].strip():
                errors.append(f"Campo 'model.{req}' deve ser uma string nao vazia.")
        ctx = model.get("context_window_tokens")
        if ctx is not None and (not isinstance(ctx, int) or isinstance(ctx, bool) or ctx <= 0):
            errors.append("Campo 'model.context_window_tokens' deve ser inteiro positivo.")
    elif "model" in data:
        errors.append("Campo 'model' deve ser um objeto JSON.")

    # Permissions section (server-enforced deny-by-default)
    permissions = data.get("permissions")
    allowed_tools_set: set[str] = set()
    if isinstance(permissions, dict):
        if permissions.get("default_policy") != "deny":
            errors.append(
                "Invariante de seguranca violada: 'permissions.default_policy' deve ser estritamente 'deny'."
            )
        if permissions.get("enforcement_layer") != "server":
            errors.append(
                "Invariante de seguranca violada: 'permissions.enforcement_layer' deve ser 'server' "
                "(prompts ou skills nunca sao mecanismo de autorizacao)."
            )
        allowed_tools = permissions.get("allowed_tools")
        if not isinstance(allowed_tools, list):
            errors.append("Campo 'permissions.allowed_tools' deve ser uma lista.")
        else:
            for idx, tool_name in enumerate(allowed_tools):
                if not isinstance(tool_name, str) or not tool_name.strip():
                    errors.append(f"Item 'permissions.allowed_tools[{idx}]' deve ser string nao vazia.")
                else:
                    allowed_tools_set.add(tool_name)

        approvals = permissions.get("human_approval_required_for")
        if not isinstance(approvals, list) or len(approvals) == 0:
            errors.append(
                "Invariante de seguranca violada: 'permissions.human_approval_required_for' "
                "deve declarar ao menos uma acao sensivel."
            )
    elif "permissions" in data:
        errors.append("Campo 'permissions' deve ser um objeto JSON.")

    # Tools section
    tools = data.get("tools")
    declared_tool_names: set[str] = set()
    if isinstance(tools, list):
        for idx, tool in enumerate(tools):
            prefix = f"tools[{idx}]"
            if not isinstance(tool, dict):
                errors.append(f"'{prefix}' deve ser um objeto JSON.")
                continue
            name = tool.get("name")
            if not isinstance(name, str) or not name.strip():
                errors.append(f"'{prefix}.name' deve ser uma string nao vazia.")
            elif name in declared_tool_names:
                errors.append(f"Ferramenta duplicada em '{prefix}.name': '{name}'.")
            else:
                declared_tool_names.add(name)

            transport = tool.get("transport")
            if transport not in VALID_TRANSPORTS:
                errors.append(
                    f"'{prefix}.transport' invalido ('{transport}'). Valores aceitos: {sorted(VALID_TRANSPORTS)}."
                )

            cred_src = tool.get("credential_source")
            if cred_src not in VALID_CREDENTIAL_SOURCES:
                errors.append(
                    f"'{prefix}.credential_source' deve ser 'env_ref' ou 'none' (credenciais nunca no prompt/perfil)."
                )
            elif cred_src == "env_ref":
                env_name = tool.get("env_var_name")
                if not isinstance(env_name, str) or not re.match(r"^[A-Z][A-Z0-9_]{2,}$", env_name):
                    errors.append(
                        f"'{prefix}.env_var_name' obrigatorio em UPPER_SNAKE_CASE quando credential_source='env_ref'."
                    )

            timeout_ms = tool.get("timeout_ms")
            if not isinstance(timeout_ms, int) or isinstance(timeout_ms, bool) or timeout_ms <= 0:
                errors.append(f"'{prefix}.timeout_ms' deve ser um inteiro positivo.")

            if not isinstance(tool.get("idempotent"), bool):
                errors.append(f"'{prefix}.idempotent' deve ser booleano.")
    elif "tools" in data:
        errors.append("Campo 'tools' deve ser uma lista.")

    for allowed_name in sorted(allowed_tools_set):
        if declared_tool_names and allowed_name not in declared_tool_names:
            errors.append(
                f"Ferramenta autorizada '{allowed_name}' em 'permissions.allowed_tools' nao esta declarada em 'tools'."
            )

    # Memory section
    memory = data.get("memory")
    if isinstance(memory, dict):
        if not isinstance(memory.get("session_enabled"), bool):
            errors.append("Campo 'memory.session_enabled' deve ser booleano.")
        if not isinstance(memory.get("durable_enabled"), bool):
            errors.append("Campo 'memory.durable_enabled' deve ser booleano.")
        if memory.get("scope") not in VALID_MEMORY_SCOPES:
            errors.append(
                f"Invariante de isolamento violada: 'memory.scope' deve estar em {sorted(VALID_MEMORY_SCOPES)}."
            )
        ttl_days = memory.get("ttl_days")
        if not isinstance(ttl_days, int) or isinstance(ttl_days, bool) or ttl_days <= 0:
            errors.append("Campo 'memory.ttl_days' deve ser inteiro positivo.")
        if memory.get("authorized_retrieval_only") is not True:
            errors.append(
                "Invariante de seguranca violada: 'memory.authorized_retrieval_only' deve ser true."
            )
    elif "memory" in data:
        errors.append("Campo 'memory' deve ser um objeto JSON.")

    # Execution loop section
    loop = data.get("execution_loop")
    if isinstance(loop, dict):
        stages = loop.get("stages")
        if not isinstance(stages, list) or tuple(stages) != REQUIRED_LOOP_STAGES:
            errors.append(
                f"Campo 'execution_loop.stages' deve seguir exatamente a ordem {list(REQUIRED_LOOP_STAGES)}."
            )
        timeout_ms = loop.get("timeout_ms")
        if not isinstance(timeout_ms, int) or isinstance(timeout_ms, bool) or timeout_ms <= 0:
            errors.append("Campo 'execution_loop.timeout_ms' deve ser inteiro positivo.")
        max_steps = loop.get("max_steps")
        if not isinstance(max_steps, int) or isinstance(max_steps, bool) or max_steps <= 0:
            errors.append("Campo 'execution_loop.max_steps' deve ser inteiro positivo.")
        if loop.get("idempotency_required") is not True:
            errors.append("Campo 'execution_loop.idempotency_required' deve ser true.")
        if loop.get("tracing_redacted_logs") is not True:
            errors.append(
                "Invariante de seguranca violada: 'execution_loop.tracing_redacted_logs' deve ser true."
            )
        if loop.get("human_fallback") is not True:
            errors.append(
                "Invariante operacional violada: 'execution_loop.human_fallback' deve ser true."
            )
    elif "execution_loop" in data:
        errors.append("Campo 'execution_loop' deve ser um objeto JSON.")

    # Acceptance criteria
    criteria = data.get("acceptance_criteria")
    if not isinstance(criteria, list) or len(criteria) == 0 or not all(
        isinstance(c, str) and c.strip() for c in criteria
    ):
        errors.append("Campo 'acceptance_criteria' deve ser uma lista nao vazia de criterios claros.")

    # Secret & credential leakage scan
    _scan_for_secrets(data, "", errors)

    return len(errors) == 0, errors


def validate_profile_file(file_path: Path) -> Tuple[bool, List[str]]:
    if not file_path.exists():
        return False, [f"Arquivo nao encontrado: {file_path}"]
    try:
        raw = file_path.read_text(encoding="utf-8")
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return False, [f"JSON invalido em {file_path}: {exc}"]
    except OSError as exc:
        return False, [f"Erro ao ler {file_path}: {exc}"]

    return validate_profile_data(data)


def main(argv: List[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    if len(args) != 1:
        print("Uso: python3 validate_profile.py <caminho/para/agent-profile.json>", file=sys.stderr)
        return 2

    target = Path(args[0])
    ok, errors = validate_profile_file(target)
    if ok:
        print(f"OK: perfil '{target}' validado com sucesso (todas as invariantes atendidas).")
        return 0

    print(f"FAIL: perfil '{target}' reprovado com {len(errors)} erro(s):", file=sys.stderr)
    for err in errors:
        print(f"  - {err}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
