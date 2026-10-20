#!/usr/bin/env python3
"""Compare recorded dialog interiors, not the differing background pages or shadows."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[2]
directory = root / (sys.argv[1] if len(sys.argv) > 1 else "output/playwright/finish")
records = json.loads((directory / "notices-verification.json").read_text())
results = []
for record in records["results"]:
    if record.get("error"):
        continue

    def crop(kind, box):
        image = Image.open(directory / (kind + "-dialog-" + record["id"] + ".png")).convert("RGB")
        left, top = round(box["x"]) + 3, round(box["y"]) + 3
        return image.crop((left, top, left + round(box["width"]) - 6, top + round(box["height"]) - 6))

    native, reference = crop("native", record["nativeBox"]), crop("reference", record["referenceBox"])
    assert native.size == reference.size, "Different interior dimensions: " + record["id"]
    difference = ImageChops.difference(native, reference)
    pixels = native.width * native.height
    same = sum(1 for pixel in difference.get_flattened_data() if pixel == (0, 0, 0))
    error = sum((index % 256) * count for index, count in enumerate(difference.histogram())) / (3 * pixels)
    result = {
        "id": record["id"], "exactEqualPixelPercent": round(same * 100 / pixels, 4),
        "meanAbsoluteRGBError": round(error, 6),
        "crop": {"borderExcluded": 3, "width": native.width, "height": native.height},
    }
    results.append(result)
    print(result["id"], result["exactEqualPixelPercent"], result["meanAbsoluteRGBError"])
(directory / "notice-pixel-comparison.json").write_text(json.dumps(results, indent=2) + "\n")
