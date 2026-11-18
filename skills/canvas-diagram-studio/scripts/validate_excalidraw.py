#!/usr/bin/env python3
"""
Deda Skills - Validador de Schema Excalidraw v2 (Zero-Dependency)
Uso: python3 validate_excalidraw.py <arquivo.excalidraw>
"""

import json
import math
import sys
from pathlib import Path


def validate_excalidraw(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"JSON invalido: {exc}"]

    if data.get("type") != "excalidraw":
        errors.append("Campo raiz 'type' deve ser 'excalidraw'.")
    if not isinstance(data.get("version"), int) or data["version"] < 2:
        errors.append("Campo raiz 'version' deve ser inteiro >= 2.")
    elements = data.get("elements")
    if not isinstance(elements, list):
        errors.append("Campo raiz 'elements' deve ser uma lista.")
        return errors

    ids: dict[str, dict] = {}
    for idx, el in enumerate(elements):
        if not isinstance(el, dict):
            errors.append(f"Elemento [{idx}] nao e um objeto.")
            continue
        el_id = el.get("id")
        if not el_id or not isinstance(el_id, str):
            errors.append(f"Elemento [{idx}] sem 'id' valido.")
            continue
        if el_id in ids:
            errors.append(f"ID duplicado encontrado: '{el_id}'.")
        ids[el_id] = el

        for num_field in ("x", "y", "width", "height"):
            val = el.get(num_field)
            if not isinstance(val, (int, float)) or not math.isfinite(val):
                errors.append(f"Elemento '{el_id}' com '{num_field}' invalido: {val}.")

    for el_id, el in ids.items():
        container_id = el.get("containerId")
        if container_id is not None and container_id not in ids:
            errors.append(f"Texto '{el_id}' referencia containerId inexistente '{container_id}'.")

        for bound in el.get("boundElements") or []:
            b_id = bound.get("id") if isinstance(bound, dict) else None
            if b_id and b_id not in ids:
                errors.append(f"Elemento '{el_id}' referencia boundElement inexistente '{b_id}'.")

        for binding_key in ("startBinding", "endBinding"):
            binding = el.get(binding_key)
            if isinstance(binding, dict):
                target = binding.get("elementId")
                if target and target not in ids:
                    errors.append(f"Seta '{el_id}' possui {binding_key} para ID inexistente '{target}'.")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python3 validate_excalidraw.py <arquivo.excalidraw>")
        return 1
    target = Path(sys.argv[1])
    if not target.exists():
        print(f"Arquivo nao encontrado: {target}")
        return 1
    errs = validate_excalidraw(target)
    if errs:
        print(f"FAIL ({len(errs)} erro(s)):")
        for e in errs:
            print(f"  - {e}")
        return 2
    print(f"PASS: '{target}' e um arquivo Excalidraw v2 valido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
