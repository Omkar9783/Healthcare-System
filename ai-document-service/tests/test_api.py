import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data

def test_detect_endpoint():
    # Create simple in-memory PNG image
    img = np.zeros((500, 800, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".png", img)
    file_bytes = io.BytesIO(encoded.tobytes())

    response = client.post(
        "/api/document/detect",
        files={"file": ("test.png", file_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "document_type" in data
    assert "detection_confidence" in data

def test_verify_endpoint():
    img = np.zeros((500, 800, 3), dtype=np.uint8)
    _, encoded = cv2.imencode(".png", img)
    file_bytes = io.BytesIO(encoded.tobytes())

    response = client.post(
        "/api/document/verify",
        files={"file": ("test.png", file_bytes, "image/png")},
        data={"patient_data": '{"uid": "PAT-2026-000001", "name": "Rahul Sharma", "dateOfBirth": "1990-01-01", "gender": "Male"}'}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "verification_id" in data
    assert "document_detection_status" in data
    assert "ocr_status" in data
    assert "qr_status" in data
    assert "signature_status" in data
    assert "official_verification_status" in data
    assert "data_match_status" in data
    assert "anomaly_status" in data
    assert "verification_status" in data
