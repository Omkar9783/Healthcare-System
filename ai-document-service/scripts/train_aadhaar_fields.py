#!/usr/bin/env python3
import os
import argparse
from pathlib import Path
from ultralytics import YOLO
import torch

def parse_args():
    parser = argparse.ArgumentParser(description="Train YOLO11 Aadhaar Field Detection Model")
    parser.add_argument("--data", type=str, default="datasets/data_aadhaar.yaml", help="Path to data YAML config")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="auto", help="Device (auto, mps, cpu, cuda)")
    parser.add_argument("--model", type=str, default="yolo11n.pt", help="Base model weights")
    parser.add_argument("--project", type=str, default="models", help="Save directory")
    parser.add_argument("--name", type=str, default="aadhaar_fields", help="Run name")
    return parser.parse_args()

def select_device(user_device: str) -> str:
    if user_device != "auto":
        return user_device
    if torch.backends.mps.is_available():
        print("⚡ Apple Silicon MPS acceleration enabled.")
        return "mps"
    if torch.cuda.is_available():
        return "0"
    return "cpu"

def main():
    args = parse_args()
    device = select_device(args.device)

    data_path = Path(args.data).resolve()
    if not data_path.exists():
        print(f"❌ Dataset YAML not found at: {data_path}")
        return

    print(f"🚀 Training Aadhaar Fields YOLO11 on {device}...")
    model = YOLO(args.model)
    model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=device,
        project=args.project,
        name=args.name,
        exist_ok=True
    )

    best_pt = Path(args.project) / args.name / "weights" / "best.pt"
    target_dest = Path("models/aadhaar_fields/best.pt")
    target_dest.parent.mkdir(parents=True, exist_ok=True)
    if best_pt.exists():
        import shutil
        shutil.copy(best_pt, target_dest)
        print(f"✅ Aadhaar Field weights deployed to: {target_dest}")

if __name__ == "__main__":
    main()
