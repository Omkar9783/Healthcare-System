import numpy as np
import pytest
from app.security.image_quality import ImageQualityAnalyzer
from app.security.duplicate_detection import DuplicateDetector
from app.security.layout_validation import LayoutValidator

def test_blur_detection_sharp_vs_blurred():
    # Sharp gradient image
    sharp = np.zeros((400, 400, 3), dtype=np.uint8)
    sharp[:, ::10] = 255 # sharp lines
    res_sharp = ImageQualityAnalyzer.evaluate(sharp)
    assert res_sharp["is_blurred"] is False

    # Uniform gray image (blurred / no edges)
    blurred = np.full((400, 400, 3), 128, dtype=np.uint8)
    res_blurred = ImageQualityAnalyzer.evaluate(blurred)
    assert res_blurred["is_blurred"] is True

def test_duplicate_image_hashes():
    img1 = np.full((200, 300, 3), 100, dtype=np.uint8)
    img2 = np.full((200, 300, 3), 100, dtype=np.uint8)
    h1 = DuplicateDetector.compute_image_hashes(img1)
    h2 = DuplicateDetector.compute_image_hashes(img2)
    assert h1["md5"] == h2["md5"]
    assert h1["dhash"] == h2["dhash"]
    dist = DuplicateDetector.hamming_distance(h1["dhash"], h2["dhash"])
    assert dist == 0

def test_layout_validation_aadhaar():
    # ID-1 standard ratio ~ 1.58 (e.g. 800x500)
    normal_img = np.zeros((500, 800, 3), dtype=np.uint8)
    res = LayoutValidator.validate_layout(normal_img, "aadhaar_front")
    assert res["is_valid_layout"] is True

    # Extreme vertical banner (e.g. 100x800)
    weird_img = np.zeros((800, 100, 3), dtype=np.uint8)
    res2 = LayoutValidator.validate_layout(weird_img, "aadhaar_front")
    assert res2["is_valid_layout"] is False
