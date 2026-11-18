#!/usr/bin/env python3
"""
Deda Skills - WCAG 2.1 Contrast Ratio Auditor (Zero-Dependency)
Uso: python3 audit_contrast.py "#F5F2EB" "#24201D"
"""

import sys


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    cleaned = hex_color.strip().lstrip("#")
    if len(cleaned) == 3:
        cleaned = "".join(c * 2 for c in cleaned)
    if len(cleaned) != 6:
        raise ValueError(f"Cor hexadecimal invalida: {hex_color}")
    return int(cleaned[0:2], 16), int(cleaned[2:4], 16), int(cleaned[4:6], 16)


def relative_luminance(rgb: tuple[int, int, int]) -> float:
    def channel(val: int) -> float:
        srgb = val / 255.0
        return srgb / 12.92 if srgb <= 0.03928 else ((srgb + 0.055) / 1.055) ** 2.4

    r, g, b = rgb
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    l1 = relative_luminance(hex_to_rgb(fg_hex))
    l2 = relative_luminance(hex_to_rgb(bg_hex))
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def main() -> int:
    if len(sys.argv) != 3:
        print("Uso: python3 audit_contrast.py <fg_hex> <bg_hex>")
        return 1
    fg, bg = sys.argv[1], sys.argv[2]
    try:
        ratio = contrast_ratio(fg, bg)
    except ValueError as err:
        print(f"Erro: {err}")
        return 1

    aa_normal = ratio >= 4.5
    aa_large = ratio >= 3.0
    aaa_normal = ratio >= 7.0
    print(f"Contrast {fg} sobre {bg}: {ratio:.2f}:1")
    print(f"  WCAG AA Normal (>=4.5:1): {'PASS' if aa_normal else 'FAIL'}")
    print(f"  WCAG AA Large/UI (>=3.0:1): {'PASS' if aa_large else 'FAIL'}")
    print(f"  WCAG AAA Normal (>=7.0:1): {'PASS' if aaa_normal else 'FAIL'}")
    return 0 if aa_normal else 2


if __name__ == "__main__":
    raise SystemExit(main())
