#!/usr/bin/env python3
"""
EVR Image Preparation Script
=============================
1. Put all your numbered PNGs (1.png, 2.png, ...) into the 'raw/' folder
2. Edit PRODUCT_SEQUENCE below to match your spreadsheet order
3. Run: python3 prepare_images.py
4. Done — optimised WebPs appear in this folder, ready for the website

Each product entry: ('SKU', number_of_variations)
Order must match your numbered files exactly.
"""

from PIL import Image
import os, shutil

# ── EDIT THIS to match your spreadsheet order ─────────────────────────────
# ('SKU', number_of_images_for_that_product)
PRODUCT_SEQUENCE = [
    ('913',     8),   # files 1–8
    ('905B',    5),   # files 9–13
    ('2618',    3),   # files 14–16
    ('LX002',   5),   # files 17–21
    ('2617',    5),   # files 22–26
    ('XT002',   2),   # files 27–28
    ('LX008',   4),   # files 29–32
    ('906',     3),   # files 33–35
    ('912',    16),   # files 36–51
    ('LX007',   2),   # files 52–53
    ('KX1154',  5),   # files 54–58
    ('2501',    4),   # files 59–62
    ('905S',    5),   # files 63–67
    ('KXH2608', 2),   # files 68–69
    ('901',     7),   # files 70–76
    ('KXH2626', 4),   # files 77–80
    ('902X6',  13),   # files 81–93
    ('902',     8),   # files 94–101
    ('LX012',   2),   # files 102–103
    ('2406',    5),   # files 104–108
    ('8102',    4),   # files 109–112
    ('2510',    4),   # files 113–116
    ('2405',    5),   # files 117–121
    ('2511',    4),   # files 122–125
    ('2521',    1),   # files 126
    ('EV1001',  4),   # files 127–130
    ('EH1001',  5),   # files 131–135
]
# ──────────────────────────────────────────────────────────────────────────

WEBP_QUALITY  = 82       # 80–85 is the sweet spot: great quality, tiny files
OUTPUT_SIZE   = (600, 600)  # resize to 600×600 — plenty for 300px display cards
RAW_DIR       = os.path.join(os.path.dirname(__file__), 'raw')
OUT_DIR       = os.path.dirname(__file__)   # outputs go into photos/ directly

def run():
    if not os.path.isdir(RAW_DIR):
        print(f"ERROR: 'raw/' folder not found at {RAW_DIR}")
        print("Create it and put your numbered PNGs inside.")
        return

    # Build the full rename map
    mapping = []   # [(original_number, sku, variation_index), ...]
    n = 1
    for sku, count in PRODUCT_SEQUENCE:
        for v in range(1, count + 1):
            mapping.append((n, sku, v))
            n += 1

    total_expected = n - 1
    print(f"Expecting {total_expected} files (1.png – {total_expected}.png)")
    print(f"Processing {len(PRODUCT_SEQUENCE)} products...\n")

    converted   = 0
    skipped     = 0
    errors      = []
    total_in_kb = 0
    total_out_kb= 0

    for (num, sku, var) in mapping:
        src = os.path.join(RAW_DIR, f'{num}.png')
        if not os.path.isfile(src):
            # Also try .jpg / .jpeg in case some are JPEGs
            for ext in ['.jpg', '.jpeg', '.PNG', '.JPG']:
                alt = os.path.join(RAW_DIR, f'{num}{ext}')
                if os.path.isfile(alt):
                    src = alt
                    break
            else:
                skipped += 1
                print(f"  SKIP  {num}.png  ({sku} var {var}) — file not found")
                continue

        out_name = f'{sku}_{var}.webp'
        out_path = os.path.join(OUT_DIR, out_name)

        try:
            orig_kb = os.path.getsize(src) // 1024
            img = Image.open(src).convert('RGB')
            img = img.resize(OUTPUT_SIZE, Image.LANCZOS)
            img.save(out_path, 'WEBP', quality=WEBP_QUALITY, method=6)
            new_kb = os.path.getsize(out_path) // 1024
            total_in_kb  += orig_kb
            total_out_kb += new_kb
            converted += 1
            print(f"  OK    {num}.png  →  {out_name}  ({orig_kb}KB → {new_kb}KB)")
        except Exception as e:
            errors.append((src, str(e)))
            print(f"  ERROR {num}.png  →  {out_name}  ({e})")

    print(f"\n{'─'*55}")
    print(f"  Converted : {converted}")
    print(f"  Skipped   : {skipped}")
    print(f"  Errors    : {len(errors)}")
    if total_in_kb:
        saving = 100 - int(total_out_kb / total_in_kb * 100)
        print(f"  Size      : {total_in_kb:,}KB → {total_out_kb:,}KB  ({saving}% smaller)")
    print(f"{'─'*55}")
    if errors:
        print("\nFailed files:")
        for src, err in errors:
            print(f"  {src}: {err}")

if __name__ == '__main__':
    run()