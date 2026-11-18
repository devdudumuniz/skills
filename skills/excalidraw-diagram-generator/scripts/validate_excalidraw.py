#!/usr/bin/env python3
"""Zero-dependency structural validator for Excalidraw v2 (.excalidraw) files."""

import json
import math
import sys
from pathlib import Path


def validate_excalidraw(file_path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"Invalid JSON: {exc}"]

    if data.get("type") != "excalidraw":
        errors.append("Root field 'type' must be 'excalidraw'.")
    if data.get("version") != 2:
        errors.append("Root field 'version' must be 2.")

    elements = data.get("elements")
    if not isinstance(elements, list) or len(elements) == 0:
        errors.append("Field 'elements' must be a non-empty list.")
        return errors

    by_id: dict[str, dict] = {}
    for idx, el in enumerate(elements):
        el_id = el.get("id")
        if not el_id or not isinstance(el_id, str):
            errors.append(f"Element at index {idx} is missing a string 'id'.")
            continue
        if el_id in by_id:
            errors.append(f"Duplicate element id: {el_id}")
        by_id[el_id] = el

        for coord in ("x", "y", "width", "height"):
            val = el.get(coord)
            if not isinstance(val, (int, float)) or not math.isfinite(val):
                errors.append(f"Element '{el_id}' has invalid numeric field '{coord}': {val}")

    for el_id, el in by_id.items():
        if el.get("type") == "text" and el.get("containerId"):
            cid = el["containerId"]
            parent = by_id.get(cid)
            if not parent:
                errors.append(f"Text '{el_id}' references missing containerId '{cid}'.")
            else:
                bound = parent.get("boundElements") or []
                if not any(b.get("id") == el_id and b.get("type") == "text" for b in bound):
                    errors.append(f"Container '{cid}' does not list text '{el_id}' in boundElements.")

        if el.get("type") == "arrow":
            for side in ("startBinding", "endBinding"):
                binding = el.get(side)
                if binding and binding.get("elementId") not in by_id:
                    errors.append(f"Arrow '{el_id}' {side} targets missing element '{binding.get('elementId')}'.")

        for ref in el.get("boundElements") or []:
            if ref.get("id") not in by_id:
                errors.append(f"Element '{el_id}' boundElements references missing '{ref.get('id')}'.")

    return errors


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 validate_excalidraw.py <diagram.excalidraw>")
        sys.exit(2)
    target = Path(sys.argv[1])
    errs = validate_excalidraw(target)
    if errs:
        print("FAIL:", "\n".join(errs))
        sys.exit(1)
    print(f"PASS: {target} is valid Excalidraw v2 JSON.")
