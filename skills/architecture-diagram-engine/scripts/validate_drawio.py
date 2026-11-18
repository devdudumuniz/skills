#!/usr/bin/env python3
"""
Deda Skills - Validador XML Draw.io / mxGraph (Zero-Dependency)
Uso: python3 validate_drawio.py <arquivo.drawio>
"""

import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def validate_drawio(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        return [f"XML malformado: {exc}"]

    root = tree.getroot()
    if root.tag != "mxfile":
        errors.append(f"Elemento raiz deve ser <mxfile>, encontrado <{root.tag}>.")
        return errors

    diagrams = root.findall("diagram")
    if not diagrams:
        errors.append("Nenhum elemento <diagram> encontrado dentro de <mxfile>.")
        return errors

    for d_idx, diag in enumerate(diagrams):
        d_id = diag.attrib.get("id") or f"index-{d_idx}"
        if not diag.attrib.get("id"):
            errors.append(f"Diagrama #{d_idx} sem atributo 'id'.")

        model = diag.find("mxGraphModel")
        if model is None:
            errors.append(f"Diagrama '{d_id}' sem <mxGraphModel> (pode estar comprimido ou invalido).")
            continue

        cell_root = model.find("root")
        if cell_root is None:
            errors.append(f"Diagrama '{d_id}' sem elemento <root>.")
            continue

        cells = cell_root.findall("mxCell")
        if len(cells) < 2:
            errors.append(f"Diagrama '{d_id}' precisa das celulas reservadas id='0' e id='1'.")
            continue

        if cells[0].attrib.get("id") != "0" or cells[1].attrib.get("id") != "1" or cells[1].attrib.get("parent") != "0":
            errors.append(f"Diagrama '{d_id}' deve iniciar com <mxCell id='0'/> seguido de <mxCell id='1' parent='0'/>.")

        seen_ids: set[str] = set()
        for cell in cells:
            cid = cell.attrib.get("id")
            if not cid:
                errors.append(f"Diagrama '{d_id}' contem <mxCell> sem 'id'.")
                continue
            if cid in seen_ids:
                errors.append(f"Diagrama '{d_id}' possui id duplicado '{cid}'.")
            seen_ids.add(cid)

        for cell in cells:
            cid = cell.attrib.get("id", "?")
            if cid == "0":
                continue
            parent = cell.attrib.get("parent")
            if not parent or parent not in seen_ids:
                errors.append(f"Diagrama '{d_id}', celula '{cid}': parent invalido '{parent}'.")

            is_vertex = cell.attrib.get("vertex") == "1"
            is_edge = cell.attrib.get("edge") == "1"
            geom = cell.find("mxGeometry")

            if is_vertex and geom is None:
                errors.append(f"Diagrama '{d_id}', vertice '{cid}' sem <mxGeometry>.")

            if is_edge:
                src = cell.attrib.get("source")
                tgt = cell.attrib.get("target")
                if src and src not in seen_ids:
                    errors.append(f"Diagrama '{d_id}', aresta '{cid}' referencia source inexistente '{src}'.")
                if tgt and tgt not in seen_ids:
                    errors.append(f"Diagrama '{d_id}', aresta '{cid}' referencia target inexistente '{tgt}'.")
                if not src and not tgt:
                    has_pts = geom is not None and any(
                        p.attrib.get("as") in ("sourcePoint", "targetPoint") for p in geom.findall("mxPoint")
                    )
                    if not has_pts:
                        errors.append(
                            f"Diagrama '{d_id}', aresta '{cid}' sem source/target nem sourcePoint/targetPoint."
                        )

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python3 validate_drawio.py <arquivo.drawio>")
        return 1
    target = Path(sys.argv[1])
    if not target.exists():
        print(f"Arquivo nao encontrado: {target}")
        return 1
    errs = validate_drawio(target)
    if errs:
        print(f"FAIL ({len(errs)} erro(s)):")
        for e in errs:
            print(f"  - {e}")
        return 2
    print(f"PASS: '{target}' e um arquivo Draw.io mxGraph valido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
