#!/usr/bin/env python3
import os
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"

FICTIONAL_NAMES = [
    "Aarav Ramesh Patil", "Pooja Suresh Sharma", "Vikram Anil Deshmukh",
    "Snehal Rajesh Kadam", "Rohit Sunil Jadhav", "Ananya Milind Shinde",
    "Kavita Deepak Joshi", "Siddharth Vijay More"
]

CITIES = ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"]

def create_synthetic_aadhaar_front(output_img_path: Path, output_lbl_path: Path, name: str, uid_num: str):
    w, h = 800, 500
    img = Image.new("RGB", (w, h), color="#FAFAFA")
    draw = ImageDraw.Draw(img)

    # Header top bar (tricolor motif)
    draw.rectangle([0, 0, w, 20], fill="#FF9933")
    draw.rectangle([0, 20, w, 40], fill="#FFFFFF")
    draw.rectangle([0, 40, w, 60], fill="#138808")

    draw.text((250, 70), "Government of India / भारत सरकार", fill="#1F2937")
    draw.text((250, 100), "Unique Identification Authority of India", fill="#4B5563")

    # Photo box
    draw.rectangle([50, 140, 220, 360], fill="#E2E8F0", outline="#94A3B8", width=2)
    draw.text((95, 240), "[ PHOTO ]", fill="#64748B")

    # Demographic text
    draw.text((260, 160), f"Name: {name}", fill="#0F172A")
    draw.text((260, 200), "DOB: 15/08/1992", fill="#0F172A")
    draw.text((260, 240), "Gender: Male / पुरुष", fill="#0F172A")

    # Aadhaar Number Strip
    draw.rectangle([100, 400, 700, 460], fill="#F1F5F9", outline="#CBD5E1")
    draw.text((270, 420), f"{uid_num[:4]}  {uid_num[4:8]}  {uid_num[8:]}", fill="#0F172A")

    img.save(output_img_path)

    # YOLO label format: class_id x_center y_center width height (normalized)
    # Class 0: aadhaar_front
    with open(output_lbl_path, "w") as f:
        f.write("0 0.5 0.5 1.0 1.0\n")

def create_synthetic_ration_front(output_img_path: Path, output_lbl_path: Path, name: str, rc_num: str, card_color: str):
    w, h = 600, 800
    bg_color = "#FEF3C7" if card_color == "Yellow" else ("#FFEDD5" if card_color == "Orange" else "#F8FAFC")
    img = Image.new("RGB", (w, h), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Header
    draw.rectangle([20, 20, w-20, 80], outline="#78350F", width=2)
    draw.text((90, 40), "MAHARASHTRA FOOD & CIVIL SUPPLIES DEPT", fill="#78350F")

    draw.text((50, 110), f"Ration Card No (SRC): {rc_num}", fill="#1E293B")
    draw.text((50, 145), f"Category: {card_color} Priority Card", fill="#1E293B")
    draw.text((50, 180), f"Head of Family: {name}", fill="#1E293B")
    draw.text((50, 215), "District: Mumbai Suburban | State: Maharashtra", fill="#1E293B")
    draw.text((50, 250), "Fair Price Shop No: MH-FPS-400088", fill="#1E293B")

    # Family details table
    draw.rectangle([40, 310, w-40, 720], outline="#475569", width=1)
    draw.text((60, 330), "Sr. | Member Name          | Age | Relation", fill="#334155")
    draw.line([40, 360, w-40, 360], fill="#94A3B8")
    draw.text((60, 380), f"1.  | {name[:18]:<20} | 42  | Self (HOF)", fill="#1E293B")
    draw.text((60, 420), "2.  | Sangeeta Patil       | 38  | Wife", fill="#1E293B")
    draw.text((60, 460), "3.  | Rahul Patil          | 16  | Son", fill="#1E293B")
    draw.text((60, 500), "4.  | Neha Patil           | 12  | Daughter", fill="#1E293B")

    img.save(output_img_path)

    # Class 2: ration_front
    with open(output_lbl_path, "w") as f:
        f.write("2 0.5 0.5 1.0 1.0\n")

def main():
    print("🎨 Generating compliant synthetic document dataset with fictional data...")
    splits = ["train", "val", "test"]
    counts = {"train": 10, "val": 3, "test": 2}

    for split in splits:
        img_dir_a = DATASETS_DIR / "aadhaar" / "images" / split
        lbl_dir_a = DATASETS_DIR / "aadhaar" / "labels" / split
        img_dir_r = DATASETS_DIR / "ration" / "images" / split
        lbl_dir_r = DATASETS_DIR / "ration" / "labels" / split
        
        for d in [img_dir_a, lbl_dir_a, img_dir_r, lbl_dir_r]:
            d.mkdir(parents=True, exist_ok=True)

        for i in range(counts[split]):
            name = FICTIONAL_NAMES[i % len(FICTIONAL_NAMES)]
            uid_num = f"{random.randint(2000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
            rc_num = f"27{random.randint(1000000000, 9999999999)}"
            color = random.choice(["Yellow", "Orange", "White"])

            # Aadhaar
            a_img = img_dir_a / f"synth_aadhaar_{split}_{i:03d}.jpg"
            a_lbl = lbl_dir_a / f"synth_aadhaar_{split}_{i:03d}.txt"
            create_synthetic_aadhaar_front(a_img, a_lbl, name, uid_num)

            # Ration
            r_img = img_dir_r / f"synth_ration_{split}_{i:03d}.jpg"
            r_lbl = lbl_dir_r / f"synth_ration_{split}_{i:03d}.txt"
            create_synthetic_ration_front(r_img, r_lbl, name, rc_num, color)

    print(f"✅ Generated synthetic datasets successfully in: {DATASETS_DIR}")

if __name__ == "__main__":
    main()
