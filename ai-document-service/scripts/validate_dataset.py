#!/usr/bin/env python3
import os
import sys
from pathlib import Path

def validate_dataset_folder(dataset_dir: Path):
    print(f"🔍 Validating dataset in: {dataset_dir}")
    images_dir = dataset_dir / "images"
    labels_dir = dataset_dir / "labels"

    if not images_dir.exists() or not labels_dir.exists():
        print("❌ 'images' or 'labels' directory missing.")
        return False

    valid_images = 0
    errors = 0

    for split in ["train", "val", "test"]:
        s_img = images_dir / split
        s_lbl = labels_dir / split
        if not s_img.exists():
            continue

        for img_file in s_img.glob("*.*"):
            if img_file.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                continue
            valid_images += 1
            lbl_file = s_lbl / f"{img_file.stem}.txt"
            if not lbl_file.exists():
                print(f"⚠️ Missing label for image: {img_file.name}")
                errors += 1
                continue

            with open(lbl_file) as f:
                for line_idx, line in enumerate(f):
                    parts = line.strip().split()
                    if len(parts) != 5:
                        print(f"❌ Invalid YOLO format in {lbl_file.name}:{line_idx + 1}")
                        errors += 1
                        continue
                    try:
                        cls_id = int(parts[0])
                        coords = [float(p) for p in parts[1:]]
                        if any(c < 0.0 or c > 1.0 for c in coords):
                            print(f"❌ Out of bounds coordinate in {lbl_file.name}:{line_idx + 1}")
                            errors += 1
                    except ValueError:
                        print(f"❌ Non-numeric value in {lbl_file.name}:{line_idx + 1}")
                        errors += 1

    print(f"✅ Verified {valid_images} images. Errors found: {errors}")
    return errors == 0

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent / "datasets"
    validate_dataset_folder(base / "aadhaar")
    validate_dataset_folder(base / "ration")
